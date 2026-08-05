import { Image as ImageIcon, Video, Lock, Timer } from "lucide-react";
import { useQuota, useResetCountdown, type QuotaItem } from "@/hooks/use-quota";

type Row = {
  key: string;
  label: string;
  kind: "photo" | "video";
  locked: boolean;
  used: number;
  limit: number | null;
  remaining: number;
};

function buildRows(tier: string, quotas: QuotaItem[]): Row[] {
  if (tier === "free") {
    return quotas
      .filter((q) => ["720p", "1080p"].includes(q.resolution) || q.locked)
      .map((q) => ({
        key: `${q.kind}-${q.resolution}`,
        label: `${q.kind === "photo" ? "Photo" : "Video"} ${q.resolution}`,
        kind: q.kind,
        locked: q.locked,
        used: q.used,
        limit: q.limit,
        remaining: q.remaining,
      }));
  }
  return (["photo", "video"] as const).map((kind) => {
    const q = quotas.find((x) => x.kind === kind);
    return {
      key: kind,
      label: kind === "photo" ? "Photo (720p–4K)" : "Video (720p–4K)",
      kind,
      locked: false,
      used: q?.used ?? 0,
      limit: q?.limit ?? 0,
      remaining: q?.remaining ?? 0,
    };
  });
}

export function QuotaPanel() {
  const { tier, quotas, periodEnd, skewMs, loading } = useQuota();
  const countdown = useResetCountdown(periodEnd, skewMs);

  const rows = buildRows(tier, quotas);
  const cycle =
    tier === "free" ? "Resets daily" : tier === "monthly" ? "Resets weekly" : "Resets monthly";

  return (
    <section className="home-section quota-panel" aria-label="Remaining quota">
      <div className="home-section-head">
        <h3 className="home-section-title">Your Quota</h3>
        <span className="quota-reset">
          <Timer size={13} /> {cycle} · {countdown}
        </span>
      </div>

      <div className="quota-grid">
        {loading && rows.length === 0 ? (
          <p className="quota-empty">Loading quota…</p>
        ) : (
          rows.map((r) => {
            const pct =
              r.limit && r.limit > 0 ? Math.min(100, (r.used / r.limit) * 100) : 0;
            return (
              <div key={r.key} className={`quota-item ${r.locked ? "quota-item-locked" : ""}`}>
                <div className="quota-item-top">
                  <span className="quota-item-label">
                    {r.kind === "photo" ? <ImageIcon size={14} /> : <Video size={14} />}
                    {r.label}
                  </span>
                  {r.locked ? (
                    <span className="quota-item-lock">
                      <Lock size={12} /> Premium
                    </span>
                  ) : (
                    <span className="quota-item-count">
                      {r.remaining}/{r.limit ?? 0}
                    </span>
                  )}
                </div>
                {!r.locked && (
                  <div className="quota-bar" aria-hidden>
                    <span style={{ width: `${pct}%` }} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
