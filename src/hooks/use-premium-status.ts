import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseSession } from "@/hooks/use-supabase-session";

export type PackageType = "monthly" | "yearly" | null;

export type PremiumStatus = {
  isPremium: boolean;
  packageType: PackageType;
  premiumUntil: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

export function usePremiumStatus(): PremiumStatus {
  const { user } = useSupabaseSession();
  const [isPremium, setIsPremium] = useState(false);
  const [packageType, setPackageType] = useState<PackageType>(null);
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setIsPremium(false);
      setPackageType(null);
      setPremiumUntil(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("is_premium, premium_until, package_type")
      .eq("id", user.id)
      .maybeSingle();
    const until = data?.premium_until ?? null;
    const active =
      !!data?.is_premium && !!until && new Date(until).getTime() > Date.now();
    setIsPremium(active);
    setPackageType(
      active ? ((data?.package_type as PackageType) ?? null) : null,
    );
    setPremiumUntil(until);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const el = document.documentElement;
    if (isPremium) el.classList.add("mv-premium");
    else el.classList.remove("mv-premium");
  }, [isPremium]);

  return { isPremium, packageType, premiumUntil, loading, refresh };
}
