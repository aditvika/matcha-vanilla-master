
CREATE OR REPLACE FUNCTION public.consume_daily_credit(p_kind text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_today date := (now() AT TIME ZONE 'UTC')::date;
  v_row public.profiles%ROWTYPE;
  v_active_premium boolean;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;
  IF p_kind NOT IN ('photo','video') THEN
    RAISE EXCEPTION 'INVALID_KIND';
  END IF;

  INSERT INTO public.profiles (id, email)
    SELECT v_user, (SELECT email FROM auth.users WHERE id = v_user)
    ON CONFLICT (id) DO NOTHING;

  -- Reset counters if server date changed
  UPDATE public.profiles
     SET daily_photo_count = 0,
         daily_video_count = 0,
         last_active_server_date = v_today,
         updated_at = now()
   WHERE id = v_user
     AND (last_active_server_date IS DISTINCT FROM v_today);

  SELECT * INTO v_row FROM public.profiles WHERE id = v_user FOR UPDATE;

  v_active_premium := COALESCE(v_row.is_premium, false)
                      AND v_row.premium_until IS NOT NULL
                      AND v_row.premium_until > now();

  IF NOT v_active_premium THEN
    IF p_kind = 'photo' AND v_row.daily_photo_count >= 5 THEN
      RETURN jsonb_build_object('success', false, 'reason', 'DAILY_LIMIT_REACHED', 'kind', 'photo', 'limit', 5);
    END IF;
    IF p_kind = 'video' AND v_row.daily_video_count >= 3 THEN
      RETURN jsonb_build_object('success', false, 'reason', 'DAILY_LIMIT_REACHED', 'kind', 'video', 'limit', 3);
    END IF;
  END IF;

  IF p_kind = 'photo' THEN
    UPDATE public.profiles
       SET daily_photo_count = daily_photo_count + 1,
           updated_at = now()
     WHERE id = v_user
     RETURNING * INTO v_row;
  ELSE
    UPDATE public.profiles
       SET daily_video_count = daily_video_count + 1,
           updated_at = now()
     WHERE id = v_user
     RETURNING * INTO v_row;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'is_premium', v_active_premium,
    'daily_photo_count', v_row.daily_photo_count,
    'daily_video_count', v_row.daily_video_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_daily_credit(text) TO authenticated;
