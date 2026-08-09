-- Cost + pool definition for the credit system
CREATE OR REPLACE FUNCTION public.credit_rule(_tier text, _kind text, _resolution text)
RETURNS TABLE(bucket text, pool_max integer, cost integer)
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
BEGIN
  IF _tier = 'free' THEN
    bucket := _kind;
    IF _kind = 'photo' THEN
      pool_max := 5;
      cost := CASE WHEN _resolution IN ('720p','1080p') THEN 1 ELSE NULL END;
    ELSE
      pool_max := 9;
      cost := CASE WHEN _resolution = '720p' THEN 3 ELSE NULL END;
    END IF;
  ELSE
    bucket := 'credits';
    pool_max := CASE _tier
                  WHEN 'monthly' THEN 200
                  WHEN 'yearly' THEN 250
                  WHEN 'yearly_vip' THEN 400
                  ELSE 200 END;
    IF _kind = 'photo' THEN
      cost := CASE WHEN _resolution = '4K' THEN 2 ELSE 1 END;
    ELSE
      cost := CASE WHEN _resolution IN ('720p','1080p') THEN 5 ELSE 10 END;
    END IF;
  END IF;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_credit_status()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  w record;
  r record;
  rule record;
  pools jsonb := '[]'::jsonb;
  rates jsonb := '[]'::jsonb;
  used int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;

  SELECT * INTO w FROM public.quota_window(v_user);

  IF w.tier = 'free' THEN
    FOR r IN SELECT unnest(ARRAY['photo','video']) AS kind LOOP
      SELECT * INTO rule FROM public.credit_rule(w.tier, r.kind, '720p');
      SELECT COALESCE(used_count,0) INTO used FROM public.quota_usage
        WHERE user_id = v_user AND bucket = rule.bucket AND period_start = w.period_start;
      used := COALESCE(used,0);
      pools := pools || jsonb_build_object(
        'key', r.kind, 'kind', r.kind, 'limit', rule.pool_max,
        'used', used, 'remaining', GREATEST(rule.pool_max - used, 0));
    END LOOP;
  ELSE
    SELECT * INTO rule FROM public.credit_rule(w.tier, 'photo', '720p');
    SELECT COALESCE(used_count,0) INTO used FROM public.quota_usage
      WHERE user_id = v_user AND bucket = 'credits' AND period_start = w.period_start;
    used := COALESCE(used,0);
    pools := pools || jsonb_build_object(
      'key', 'credits', 'kind', 'all', 'limit', rule.pool_max,
      'used', used, 'remaining', GREATEST(rule.pool_max - used, 0));
  END IF;

  FOR r IN
    SELECT k.kind, res.resolution
    FROM (VALUES ('photo'),('video')) AS k(kind)
    CROSS JOIN (VALUES ('720p'),('1080p'),('2K'),('4K')) AS res(resolution)
  LOOP
    SELECT * INTO rule FROM public.credit_rule(w.tier, r.kind, r.resolution);
    rates := rates || jsonb_build_object(
      'kind', r.kind, 'resolution', r.resolution,
      'locked', rule.cost IS NULL, 'cost', rule.cost);
  END LOOP;

  RETURN jsonb_build_object(
    'tier', w.tier,
    'server_time', now(),
    'period_start', w.period_start,
    'period_end', w.period_end,
    'pools', pools,
    'rates', rates
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_credits(p_kind text, p_resolution text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  w record;
  rule record;
  v_used int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  IF p_kind NOT IN ('photo','video') THEN RAISE EXCEPTION 'INVALID_KIND'; END IF;
  IF p_resolution NOT IN ('720p','1080p','2K','4K') THEN RAISE EXCEPTION 'INVALID_RESOLUTION'; END IF;

  INSERT INTO public.profiles (id, email)
    SELECT v_user, (SELECT email FROM auth.users WHERE id = v_user)
    ON CONFLICT (id) DO NOTHING;

  SELECT * INTO w FROM public.quota_window(v_user);
  SELECT * INTO rule FROM public.credit_rule(w.tier, p_kind, p_resolution);

  IF rule.cost IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'LOCKED', 'tier', w.tier,
                              'period_end', w.period_end);
  END IF;

  INSERT INTO public.quota_usage (user_id, bucket, period_start, period_end, used_count)
  VALUES (v_user, rule.bucket, w.period_start, w.period_end, 0)
  ON CONFLICT (user_id, bucket, period_start) DO NOTHING;

  SELECT used_count INTO v_used FROM public.quota_usage
    WHERE user_id = v_user AND bucket = rule.bucket AND period_start = w.period_start
    FOR UPDATE;

  IF v_used + rule.cost > rule.pool_max THEN
    RETURN jsonb_build_object('success', false, 'reason', 'INSUFFICIENT_CREDITS', 'tier', w.tier,
                              'cost', rule.cost, 'limit', rule.pool_max,
                              'remaining', GREATEST(rule.pool_max - v_used, 0),
                              'period_end', w.period_end);
  END IF;

  UPDATE public.quota_usage SET used_count = used_count + rule.cost
    WHERE user_id = v_user AND bucket = rule.bucket AND period_start = w.period_start
    RETURNING used_count INTO v_used;

  RETURN jsonb_build_object('success', true, 'tier', w.tier, 'cost', rule.cost,
                            'limit', rule.pool_max, 'used', v_used,
                            'remaining', GREATEST(rule.pool_max - v_used, 0),
                            'period_end', w.period_end, 'server_time', now());
END;
$$;

REVOKE ALL ON FUNCTION public.credit_rule(text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_credit_status() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.consume_credits(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.credit_rule(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_credit_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_credits(text, text) TO authenticated;