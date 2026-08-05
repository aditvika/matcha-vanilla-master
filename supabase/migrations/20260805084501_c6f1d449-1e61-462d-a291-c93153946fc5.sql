-- Lock down function execution
REVOKE ALL ON FUNCTION public.claim_voucher(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.consume_daily_credit(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reset_daily_counts_if_new_day() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_server_date() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.vouchers_validate() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.claim_voucher(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_daily_credit(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_daily_counts_if_new_day() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_server_date() TO authenticated;

-- Vouchers: explicit, owner-scoped read access; writes only via service role / definer fn
GRANT SELECT ON public.vouchers TO authenticated;
GRANT ALL ON public.vouchers TO service_role;

DROP POLICY IF EXISTS "Users read own redeemed vouchers" ON public.vouchers;
CREATE POLICY "Users read own redeemed vouchers"
ON public.vouchers
FOR SELECT
TO authenticated
USING (used_by = auth.uid());