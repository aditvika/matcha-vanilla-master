import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseSession } from "@/hooks/use-supabase-session";

export type QuotaTier = "free" | "monthly" | "yearly";

export type QuotaItem = {
  kind: "photo" | "video";
  resolution: "720p" | "1080p" | "2K" | "4K";
  bucket: string;
  locked: boolean;
  limit: number | null;
  used: number;
  remaining: number;
};

export type QuotaStatus = {
  tier: QuotaTier;
  serverTime: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  quotas: QuotaItem[];
};

const EMPTY: QuotaStatus = {
  tier: "free",
  serverTime: null,
  periodStart: null,
  periodEnd: null,
  quotas: [],
};

/**
 * Quota state is fully server-driven: limits, usage and the reset window all
 * come from the database clock, so changing the device date has no effect.
 */
export function useQuota() {
  const { user } = useSupabaseSession();
  const [status, setStatus] = useState<QuotaStatus>(EMPTY);
  const [loading, setLoading] = useState(true);
  /** Milliseconds of drift between the device clock and the server clock. */
  const [skewMs, setSkewMs] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) {
      setStatus(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)("get_quota_status");
    if (!error && data) {
      const d = data as Record<string, unknown>;
      const serverTime = (d.server_time as string) ?? null;
      if (serverTime) setSkewMs(new Date(serverTime).getTime() - Date.now());
      setStatus({
        tier: (d.tier as QuotaTier) ?? "free",
        serverTime,
        periodStart: (d.period_start as string) ?? null,
        periodEnd: (d.period_end as string) ?? null,
        quotas: ((d.quotas as QuotaItem[]) ?? []).map((q) => ({
          ...q,
          used: Number(q.used ?? 0),
          remaining: Number(q.remaining ?? 0),
          limit: q.limit === null || q.limit === undefined ? null : Number(q.limit),
        })),
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const find = useCallback(
    (kind: QuotaItem["kind"], resolution: QuotaItem["resolution"]) =>
      status.quotas.find((q) => q.kind === kind && q.resolution === resolution) ?? null,
    [status.quotas],
  );

  return { ...status, skewMs, loading, refresh, find };
}

/** Countdown until the server-side reset, corrected for device clock drift. */
export function useResetCountdown(periodEnd: string | null, skewMs: number) {
  const [label, setLabel] = useState("--");

  useEffect(() => {
    if (!periodEnd) {
      setLabel("--");
      return;
    }
    const tick = () => {
      const diff = new Date(periodEnd).getTime() - (Date.now() + skewMs);
      if (diff <= 0) {
        setLabel("0d 00:00:00");
        return;
      }
      const s = Math.floor(diff / 1000);
      const d = Math.floor(s / 86400);
      const h = Math.floor((s % 86400) / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = s % 60;
      const pad = (n: number) => String(n).padStart(2, "0");
      setLabel(`${d}d ${pad(h)}:${pad(m)}:${pad(sec)}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [periodEnd, skewMs]);

  return label;
}
