import { useState } from "react";
import { RequireAuth } from "@/components/require-auth";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Crown, Medal, Award, Trophy } from "lucide-react";
import { leaderboardFull, getInitials, type LeaderTab } from "@/lib/leaderboard-data";

type Search = { tab?: LeaderTab };

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Premium Leaderboard — MVMaster" },
      { name: "description", content: "Top 20 ranking of MVMaster premium members." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): Search => {
    const tab = s.tab as LeaderTab | undefined;
    return { tab: tab === "Tahunan" || tab === "Mix" ? tab : "Bulanan" };
  },
  component: () => (
    <RequireAuth>
      <LeaderboardPage />
    </RequireAuth>
  ),
});

function rankMeta(i: number) {
  if (i === 0) return { Icon: Crown, cls: "lb-rank-gold" };
  if (i === 1) return { Icon: Medal, cls: "lb-rank-silver" };
  if (i === 2) return { Icon: Award, cls: "lb-rank-bronze" };
  return { Icon: Trophy, cls: "lb-rank-other" };
}

function LeaderboardPage() {
  const { tab } = Route.useSearch();
  const [leaderTab, setLeaderTab] = useState<LeaderTab>(tab ?? "Bulanan");

  return (
    <main className="home-root">
      <div className="home-glow home-glow-green" aria-hidden />
      <div className="home-glow home-glow-warm" aria-hidden />

      <div className="home-content home-fade-in">
        <header className="lb-page-header">
          <Link to="/home" className="lb-back" aria-label="Back to home">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <p className="home-greet-eyebrow">Premium</p>
            <h1 className="home-greet">Leaderboard</h1>
          </div>
        </header>

        <section className="home-section" aria-label="Full leaderboard">
          <div className="lb-tabs" role="tablist">
            {(["Bulanan", "Tahunan", "Mix"] as LeaderTab[]).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={leaderTab === t}
                className={`lb-tab ${leaderTab === t ? "lb-tab-active" : ""}`}
                onClick={() => setLeaderTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <ul className="lb-list">
            {[...leaderboardFull[leaderTab]]
              .sort((a, b) => b.mvp - a.mvp)
              .slice(0, 20)
              .map((entry, i) => {
              const { Icon, cls } = rankMeta(i);
              const initials = getInitials(entry.name);
              return (
                <li key={entry.name} className="lb-row">
                  <div className={`lb-rank ${cls}`}>
                    <Icon size={18} />
                    <span className="lb-rank-num">{i + 1}</span>
                  </div>
                  <div className="lb-avatar" aria-hidden>{initials}</div>
                  <div className="lb-user">
                    <p className="lb-name">{entry.name}</p>
                    <span className="lb-tier">{entry.tier}</span>
                  </div>
                  <span className="lb-score">{entry.mvp} MVP</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </main>
  );
}
