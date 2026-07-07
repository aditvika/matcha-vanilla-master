
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS total_mvp_points integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_photo_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_video_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weekly_video_count_premium integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_video_count_premium integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_server_date date;

CREATE OR REPLACE FUNCTION public.get_server_date()
RETURNS date
LANGUAGE sql
STABLE
SET search_path = public
AS $$ SELECT (now() AT TIME ZONE 'UTC')::date $$;

CREATE OR REPLACE FUNCTION public.reset_daily_counts_if_new_day()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_today date := (now() AT TIME ZONE 'UTC')::date;
  v_last date;
  v_row public.profiles%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;

  INSERT INTO public.profiles (id, email)
    SELECT v_user, (SELECT email FROM auth.users WHERE id = v_user)
    ON CONFLICT (id) DO NOTHING;

  SELECT last_active_server_date INTO v_last FROM public.profiles WHERE id = v_user;

  IF v_last IS DISTINCT FROM v_today THEN
    UPDATE public.profiles
      SET daily_photo_count = 0,
          daily_video_count = 0,
          last_active_server_date = v_today,
          updated_at = now()
      WHERE id = v_user;
  END IF;

  SELECT * INTO v_row FROM public.profiles WHERE id = v_user;

  RETURN jsonb_build_object(
    'server_date', v_today,
    'daily_photo_count', v_row.daily_photo_count,
    'daily_video_count', v_row.daily_video_count,
    'weekly_video_count_premium', v_row.weekly_video_count_premium,
    'monthly_video_count_premium', v_row.monthly_video_count_premium,
    'total_mvp_points', v_row.total_mvp_points,
    'is_premium', v_row.is_premium
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_server_date() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.reset_daily_counts_if_new_day() TO authenticated;
