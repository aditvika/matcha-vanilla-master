
ALTER FUNCTION public.touch_updated_at() SET search_path = public;
ALTER FUNCTION public.vouchers_validate() SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.claim_voucher(TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
