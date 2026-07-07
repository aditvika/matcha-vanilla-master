import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseSession } from "@/hooks/use-supabase-session";

export type DailyCredits = {
  serverDate: string | null;
  dailyPhotoCount: number;
  dailyVideoCount: number;
  weeklyVideoCountPremium: number;
  monthlyVideoCountPremium: number;
  totalMvpPoints: number;
  isPremium: boolean;
};

const EMPTY: DailyCredits = {
  serverDate: null,
  dailyPhotoCount: 0,
  dailyVideoCount: 0,
  weeklyVideoCountPremium: 0,
  monthlyVideoCountPremium: 0,
  totalMvpPoints: 0,
  isPremium: false,
};

/**
 * Uses the server's date (not the device clock) to reset daily counters,
 * blocking users from bypassing limits by changing their phone's date.
 */
export function useDailyCredits() {
  const { user } = useSupabaseSession();
  const [state, setState] = useState<DailyCredits>(EMPTY);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setState(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)("reset_daily_counts_if_new_day");
    if (!error && data) {
      const d = data as Record<string, unknown>;
      setState({
        serverDate: (d.server_date as string) ?? null,
        dailyPhotoCount: Number(d.daily_photo_count ?? 0),
        dailyVideoCount: Number(d.daily_video_count ?? 0),
        weeklyVideoCountPremium: Number(d.weekly_video_count_premium ?? 0),
        monthlyVideoCountPremium: Number(d.monthly_video_count_premium ?? 0),
        totalMvpPoints: Number(d.total_mvp_points ?? 0),
        isPremium: Boolean(d.is_premium),
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, loading, refresh };
}
