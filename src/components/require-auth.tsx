import { useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSupabaseSession } from "@/hooks/use-supabase-session";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useSupabaseSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      void navigate({ to: "/auth", replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <span className="text-sm text-muted-foreground">Loading…</span>
      </main>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
