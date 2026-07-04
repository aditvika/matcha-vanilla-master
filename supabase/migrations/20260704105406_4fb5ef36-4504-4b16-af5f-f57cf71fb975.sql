
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS package_type text;

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

  SELECT * INTO v_voucher
  FROM public.vouchers
  WHERE code = upper(trim(p_code))
  FOR UPDATE;

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

  UPDATE public.vouchers
     SET is_used = true, used_by = v_user, used_at = now()
   WHERE id = v_voucher.id;

  UPDATE public.profiles
     SET is_premium = true,
         premium_until = v_new_until,
         package_type = v_voucher.package_type,
         updated_at = now()
   WHERE id = v_user;

  RETURN jsonb_build_object(
    'success', true,
    'package_type', v_voucher.package_type,
    'premium_until', v_new_until
  );
END;
$function$;
