import { supabase } from "@/integrations/supabase/client";

export type LeaderTab = "Bulanan" | "Tahunan" | "Mix";

export type LeaderEntry = {
  name: string;
  tier: "Bulanan" | "Tahunan" | "VIP+";
  mvp: number;
};

export function getDisplayNameFromEmail(email?: string | null): string {
  if (!email) return "Pengguna";
  const namePart = email.split("@")[0];
  return namePart || "Pengguna";
}

export function getInitials(name: string) {
  return name
    .replace(/[_\s.]+/g, " ")
    .trim()
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export async function fetchLeaderboardData(): Promise<Record<LeaderTab, LeaderEntry[]>> {
  try {
    const { data, error } = await (supabase
      .from("profiles") as any)
      .select("email, full_name, plan_type, mvp_points")
      .gt("mvp_points", 0)
      .order("mvp_points", { ascending: false });

    if (error || !data) {
      return { Bulanan: [], Tahunan: [], Mix: [] };
    }

    const bulananList: LeaderEntry[] = [];
    const tahunanList: LeaderEntry[] = [];
    const mixList: LeaderEntry[] = [];

    (data as any[]).forEach((row) => {
      const name = getDisplayNameFromEmail(row.email || row.full_name);
      const points = row.mvp_points || 0;
      const pkg = row.plan_type || "monthly";

      let displayTier: "Bulanan" | "Tahunan" | "VIP+" = "Bulanan";
      if (pkg === "yearly_vip" || pkg === "sultan") {
        displayTier = "VIP+";
      } else if (pkg === "yearly") {
        displayTier = "Tahunan";
      }

      const entry: LeaderEntry = {
        name,
        tier: displayTier,
        mvp: points,
      };

      if (displayTier === "Bulanan") {
        bulananList.push(entry);
      } else if (displayTier === "Tahunan" || displayTier === "VIP+") {
        tahunanList.push(entry);
      }

      mixList.push(entry);
    });

    return {
      Bulanan: bulananList.sort((a, b) => b.mvp - a.mvp),
      Tahunan: tahunanList.sort((a, b) => b.mvp - a.mvp),
      Mix: mixList.sort((a, b) => b.mvp - a.mvp),
    };
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
    return { Bulanan: [], Tahunan: [], Mix: [] };
  }
}
