-- Allow the new yearly_vip package type
CREATE OR REPLACE FUNCTION public.vouchers_validate()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.package_type NOT IN ('monthly','yearly','yearly_vip') THEN
    RAISE EXCEPTION 'package_type must be monthly, yearly or yearly_vip';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.claim_voucher(p_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.quota_limit(_tier text, _kind text, _resolution text)
 RETURNS TABLE(bucket text, max_uses integer)
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
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
    IF _tier = 'monthly' THEN max_uses := CASE WHEN _kind = 'photo' THEN 150 ELSE 50 END;
    ELSIF _tier = 'yearly_vip' THEN max_uses := CASE WHEN _kind = 'photo' THEN 300 ELSE 100 END;
    ELSE max_uses := CASE WHEN _kind = 'photo' THEN 190 ELSE 60 END;
    END IF;
  END IF;
  RETURN NEXT;
END;
$function$;

CREATE OR REPLACE FUNCTION public.quota_window(_user_id uuid)
 RETURNS TABLE(tier text, period_start timestamp with time zone, period_end timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  tier := COALESCE(p.package_type, 'monthly');

  -- All premium tiers reset monthly
  v_n := (EXTRACT(YEAR FROM age(v_now, v_act)) * 12 + EXTRACT(MONTH FROM age(v_now, v_act)))::int;
  period_start := v_act + (v_n || ' months')::interval;
  period_end := v_act + ((v_n + 1) || ' months')::interval;
  RETURN NEXT;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.claim_voucher(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.quota_limit(text,text,text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.quota_window(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.claim_voucher(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.quota_limit(text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.quota_window(uuid) TO authenticated;