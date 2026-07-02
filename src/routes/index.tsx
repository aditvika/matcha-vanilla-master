import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSupabaseSession } from "@/hooks/use-supabase-session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Matcha Vanilla Production" },
      {
        name: "description",
        content: "Matcha Vanilla Production — premium creative studio, powered by Gemini AI.",
      },
      { property: "og:title", content: "Matcha Vanilla Production" },
      {
        property: "og:description",
        content: "Matcha Vanilla Production — premium creative studio, powered by Gemini AI.",
      },
    ],
  }),
  component: SplashScreen,
});

function MVMonogram() {
  return (
    <svg
      viewBox="0 0 320 200"
      className="splash-monogram"
      aria-label="MV monogram"
      role="img"
    >
      <defs>
        <linearGradient id="mv-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e5e7eb" />
        </linearGradient>
      </defs>
      {/* M */}
      <path
        d="M20 180 V40 H58 L92 130 L126 40 H164 V180 H130 V96 L102 170 H82 L54 96 V180 Z"
        fill="url(#mv-fill)"
      />
      {/* V */}
      <path
        d="M156 40 H196 L236 150 L276 40 H316 L252 200 H220 Z"
        fill="url(#mv-fill)"
      />
    </svg>
  );
}

function CornerSparkle() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="splash-sparkle"
      aria-hidden="true"
      role="img"
    >
      <path
        d="M12 2 L13.6 10.4 L22 12 L13.6 13.6 L12 22 L10.4 13.6 L2 12 L10.4 10.4 Z"
        fill="currentColor"
      />
    </svg>
  );
}

function HeartSpark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="splash-heart"
      aria-hidden="true"
      role="img"
    >
      <defs>
        <linearGradient id="heart-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="50%" stopColor="#EA4C89" />
          <stop offset="100%" stopColor="#FBBC05" />
        </linearGradient>
      </defs>
      <path
        d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"
        fill="url(#heart-grad)"
      />
    </svg>
  );
}

function SplashScreen() {
  const navigate = useNavigate();
  const { session, loading } = useSupabaseSession();

  useEffect(() => {
    if (loading) return;
    if (session) {
      navigate({ to: "/home", replace: true });
      return;
    }
    const t = setTimeout(() => navigate({ to: "/home", replace: true }), 2600);
    return () => clearTimeout(t);
  }, [loading, navigate, session]);

  return (
    <main className="splash-root">

      <div className="splash-glow splash-glow-warm" aria-hidden="true" />
      <div className="splash-glow splash-glow-green" aria-hidden="true" />
      <div className="splash-glow splash-glow-soft" aria-hidden="true" />

      <section className="splash-center splash-fade-in">
        <MVMonogram />
        <h1 className="splash-title">
          Matcha Vanilla
          <br />
          Production
        </h1>
      </section>

      <footer className="splash-footer splash-fade-in-delayed">
        <p className="splash-powered">Powered by</p>
        <div className="splash-gemini-row">
          <HeartSpark />
          <span className="splash-gemini">Gemini AI</span>
        </div>
      </footer>

      <CornerSparkle />
    </main>
  );
}
