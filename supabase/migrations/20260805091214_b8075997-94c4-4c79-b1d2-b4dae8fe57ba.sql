
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS premium_started_at timestamptz;

UPDATE public.profiles SET premium_started_at = COALESCE(premium_started_at, updated_at) WHERE is_premium = true AND premium_started_at IS NULL;

CREATE TABLE IF NOT EXISTS public.quota_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket text NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  used_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, bucket, period_start)
);

GRANT SELECT ON public.quota_usage TO authenticated;
GRANT ALL ON public.quota_usage TO service_role;
ALTER TABLE public.quota_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own quota usage" ON public.quota_usage FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS quota_usage_touch_updated_at ON public.quota_usage;
CREATE TRIGGER quota_usage_touch_updated_at BEFORE UPDATE ON public.quota_usage
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Returns tier and current server-time period window for a user
CREATE OR REPLACE FUNCTION public.quota_window(_user_id uuid)
RETURNS TABLE (tier text, period_start timestamptz, period_end timestamptz)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p public.profiles%ROWTYPE;
  v_now timestamptz := now();
  v_act timestamptz;
  v_n integer;
BEGIN
  SELECT * INTO p FROM public.profiles WHERE id = _user_id;

  IF p.id IS NULL OR NOT COALESCE(p.is_premium,false) OR p.premium_until IS NULL OR p.premium_until <= v_now THEN
    tier := 'free';
    period_start := date_trunc('day', v_now AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
    period_end := period_start + interval '1 day';
    RETURN NEXT;
    RETURN;
  END IF;

  v_act := COALESCE(p.premium_started_at, p.created_at, v_now);

  IF p.package_type = 'yearly' THEN
    tier := 'yearly';
    v_n := (EXTRACT(YEAR FROM age(v_now, v_act)) * 12 + EXTRACT(MONTH FROM age(v_now, v_act)))::int;
    period_start := v_act + (v_n || ' months')::interval;
    period_end := v_act + ((v_n + 1) || ' months')::interval;
  ELSE
    tier := 'monthly';
    v_n := floor(EXTRACT(EPOCH FROM (v_now - v_act)) / 604800)::int;
    period_start := v_act + (v_n * 7 || ' days')::interval;
    period_end := period_start + interval '7 days';
  END IF;
  RETURN NEXT;
END;
$$;

-- Limit lookup for a tier/kind/resolution. NULL = locked.
CREATE OR REPLACE FUNCTION public.quota_limit(_tier text, _kind text, _resolution text)
RETURNS TABLE (bucket text, max_uses integer)
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF _tier = 'free' THEN
    bucket := _kind || ':' || _resolution;
    IF _kind = 'photo' AND _resolution IN ('720p','1080p') THEN max_uses := 5;
    ELSIF _kind = 'video' AND _resolution = '720p' THEN max_uses := 3;
    ELSIF _kind = 'video' AND _resolution = '1080p' THEN max_uses := 1;
    ELSE max_uses := NULL;
    END IF;
  ELSE
    bucket := _kind;
    IF _tier = 'monthly' THEN max_uses := CASE WHEN _kind = 'photo' THEN 50 ELSE 15 END;
    ELSE max_uses := CASE WHEN _kind = 'photo' THEN 150 ELSE 30 END;
    END IF;
  END IF;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_quota_status()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  w record;
  items jsonb := '[]'::jsonb;
  r record;
  lim record;
  used int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;

  SELECT * INTO w FROM public.quota_window(v_user);

  FOR r IN
    SELECT k.kind, res.resolution
    FROM (VALUES ('photo'),('video')) AS k(kind)
    CROSS JOIN (VALUES ('720p'),('1080p'),('2K'),('4K')) AS res(resolution)
  LOOP
    SELECT * INTO lim FROM public.quota_limit(w.tier, r.kind, r.resolution);
    SELECT COALESCE(used_count,0) INTO used FROM public.quota_usage
      WHERE user_id = v_user AND bucket = lim.bucket AND period_start = w.period_start;
    used := COALESCE(used, 0);
    items := items || jsonb_build_object(
      'kind', r.kind,
      'resolution', r.resolution,
      'bucket', lim.bucket,
      'locked', lim.max_uses IS NULL,
      'limit', lim.max_uses,
      'used', CASE WHEN lim.max_uses IS NULL THEN 0 ELSE used END,
      'remaining', CASE WHEN lim.max_uses IS NULL THEN 0 ELSE GREATEST(lim.max_uses - used, 0) END
    );
  END LOOP;

  RETURN jsonb_build_object(
    'tier', w.tier,
    'server_time', now(),
    'period_start', w.period_start,
    'period_end', w.period_end,
    'quotas', items
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_quota(p_kind text, p_resolution text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  w record;
  lim record;
  v_used int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  IF p_kind NOT IN ('photo','video') THEN RAISE EXCEPTION 'INVALID_KIND'; END IF;
  IF p_resolution NOT IN ('720p','1080p','2K','4K') THEN RAISE EXCEPTION 'INVALID_RESOLUTION'; END IF;

  INSERT INTO public.profiles (id, email)
    SELECT v_user, (SELECT email FROM auth.users WHERE id = v_user)
    ON CONFLICT (id) DO NOTHING;

  SELECT * INTO w FROM public.quota_window(v_user);
  SELECT * INTO lim FROM public.quota_limit(w.tier, p_kind, p_resolution);

  IF lim.max_uses IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'LOCKED', 'tier', w.tier,
                              'period_end', w.period_end);
  END IF;

  INSERT INTO public.quota_usage (user_id, bucket, period_start, period_end, used_count)
  VALUES (v_user, lim.bucket, w.period_start, w.period_end, 0)
  ON CONFLICT (user_id, bucket, period_start) DO NOTHING;

  SELECT used_count INTO v_used FROM public.quota_usage
    WHERE user_id = v_user AND bucket = lim.bucket AND period_start = w.period_start
    FOR UPDATE;

  IF v_used >= lim.max_uses THEN
    RETURN jsonb_build_object('success', false, 'reason', 'QUOTA_EXCEEDED', 'tier', w.tier,
                              'limit', lim.max_uses, 'remaining', 0, 'period_end', w.period_end);
  END IF;

  UPDATE public.quota_usage SET used_count = used_count + 1
    WHERE user_id = v_user AND bucket = lim.bucket AND period_start = w.period_start
    RETURNING used_count INTO v_used;

  RETURN jsonb_build_object('success', true, 'tier', w.tier, 'limit', lim.max_uses,
                            'used', v_used, 'remaining', GREATEST(lim.max_uses - v_used, 0),
                            'period_end', w.period_end, 'server_time', now());
END;
$$;

REVOKE ALL ON FUNCTION public.quota_window(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.quota_limit(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_quota_status() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.consume_quota(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_quota_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_quota(text, text) TO authenticated;

-- Record activation date on voucher claim
CREATE OR REPLACE FUNCTION public.claim_voucher(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_voucher public.vouchers%ROWTYPE;
  v_new_until TIMESTAMPTZ;
  v_current_until TIMESTAMPTZ;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;

  SELECT * INTO v_voucher FROM public.vouchers WHERE code = upper(trim(p_code)) FOR UPDATE;

  IF NOT FOUND OR v_voucher.is_used THEN
    RAISE EXCEPTION 'INVALID_OR_USED';
  END IF;

  INSERT INTO public.profiles (id, email)
    SELECT v_user, (SELECT email FROM auth.users WHERE id = v_user)
    ON CONFLICT (id) DO NOTHING;

  SELECT premium_until INTO v_current_until FROM public.profiles WHERE id = v_user;
  v_current_until := GREATEST(COALESCE(v_current_until, now()), now());

  IF v_voucher.package_type = 'monthly' THEN
    v_new_until := v_current_until + INTERVAL '30 days';
  ELSE
    v_new_until := v_current_until + INTERVAL '365 days';
  END IF;

  UPDATE public.vouchers SET is_used = true, used_by = v_user, used_at = now() WHERE id = v_voucher.id;

  UPDATE public.profiles
     SET is_premium = true,
         premium_until = v_new_until,
         package_type = v_voucher.package_type,
         premium_started_at = COALESCE(premium_started_at, now()),
         updated_at = now()
   WHERE id = v_user;

  RETURN jsonb_build_object('success', true, 'package_type', v_voucher.package_type, 'premium_until', v_new_until);
END;
$$;
REVOKE ALL ON FUNCTION public.claim_voucher(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_voucher(text) TO authenticated;
