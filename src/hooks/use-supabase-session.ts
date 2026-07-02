import { createContext, createElement, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type SupabaseSessionState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
};

const SupabaseSessionContext = createContext<SupabaseSessionState | null>(null);

export function SupabaseSessionProvider({
  children,
  onAuthChange,
}: {
  children: React.ReactNode;
  onAuthChange?: (event: string, session: Session | null) => void;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let authEventSeen = false;

    const applySession = (nextSession: Session | null) => {
      if (!mounted) return;
      setSession(nextSession);
      setLoading(false);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      authEventSeen = true;
      applySession(nextSession);
      onAuthChange?.(event, nextSession);
    });

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!authEventSeen) applySession(data.session);
      })
      .catch(() => {
        if (!authEventSeen) applySession(null);
      });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [onAuthChange]);

  const value = useMemo<SupabaseSessionState>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      isAuthenticated: !!session?.user,
    }),
    [loading, session],
  );

  return createElement(SupabaseSessionContext.Provider, { value }, children);
}

export function useSupabaseSession() {
  const context = useContext(SupabaseSessionContext);
  if (!context) {
    throw new Error("useSupabaseSession must be used within SupabaseSessionProvider");
  }
  return context;
}
