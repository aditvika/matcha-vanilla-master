import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Lock, ArrowLeft, LogIn } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useSupabaseSession } from "@/hooks/use-supabase-session";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Sign In — Matcha Vanilla Production" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useSupabaseSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) {
      navigate({ to: "/home", replace: true });
    }
  }, [loading, session, navigate]);

  // Trap the system/browser Back button while unauthenticated so guests
  // cannot navigate back into protected screens.
  useEffect(() => {
    if (loading || session) return;
    window.history.pushState({ authGuard: true }, "");
    const onPop = () => {
      window.history.pushState({ authGuard: true }, "");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [loading, session]);


  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    // RFC-style practical email validation
    const emailOk = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(cleanEmail) && cleanEmail.length <= 255;
    if (!emailOk) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) {
          const m = error.message.toLowerCase();
          if (m.includes("already") || m.includes("registered")) {
            toast.error("This email is already registered. Please sign in instead.");
            setMode("signin");
            return;
          }
          throw error;
        }
        if (data.session) {
          toast.success("Account created! You're signed in.");
        } else {
          toast.success("Account created! Check your inbox to confirm, then sign in.");
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) {
          const m = error.message.toLowerCase();
          if (m.includes("not confirmed")) {
            toast.error("Please confirm your email first, then sign in.");
            return;
          }
          if (m.includes("invalid login credentials")) {
            // Distinguish "no account" from "wrong password" without leaking data
            // beyond what the user asked for.
            const { error: otpError } = await supabase.auth.signInWithOtp({
              email: cleanEmail,
              options: { shouldCreateUser: false },
            });
            if (otpError && /signups? not allowed|not found/i.test(otpError.message)) {
              toast.error("Account not found. Please sign up first.");
            } else {
              toast.error("Invalid password. Please try again.");
            }
            return;
          }
          throw error;
        }
        toast.success("Welcome back!");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };


  const handleGoogle = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      // Session was set in-place (preview popup flow) — go straight to Home.
      navigate({ to: "/home", replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed";
      toast.error(msg);
      setBusy(false);
    }
  };

  return (
    <main className="home-root">
      <div className="home-glow home-glow-green" aria-hidden />
      <div className="home-glow home-glow-warm" aria-hidden />

      <div className="home-content home-fade-in">
        <header className="home-header">
          {session ? (
            <Link to="/home" className="home-icon-btn" aria-label="Back">
              <ArrowLeft size={20} />
            </Link>
          ) : null}

          <div>
            <p className="home-greet-eyebrow">Account</p>
            <h1 className="home-greet">{mode === "signin" ? "Sign In" : "Create Account"}</h1>
          </div>
        </header>

        <section className="home-section">
          <form className="auth-form" onSubmit={handleEmail}>
            <label className="auth-field">
              <Mail size={16} />
              <input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="auth-field">
              <Lock size={16} />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button type="submit" className="auth-primary-btn" disabled={busy}>
              <LogIn size={16} />
              <span>{mode === "signin" ? "Sign In" : "Create Account"}</span>
            </button>
          </form>

          <div className="profile-divider"><span>or</span></div>

          <button
            type="button"
            className="profile-google-btn"
            onClick={handleGoogle}
            disabled={busy}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"/>
              <path fill="#4285F4" d="M21.2 12.2c0-.6-.1-1.1-.2-1.6H12v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1v.1l3.6 2.8c2.1-2 3.6-4.9 3.6-9.3z"/>
              <path fill="#FBBC05" d="M5.4 14.3l-.7.5-2.3 1.8C3.9 19.9 7.7 22 12 22c2.6 0 4.8-.9 6.4-2.3l-3.6-2.8c-1 .7-2.3 1.2-2.8 1.2-2.6 0-4.8-1.7-5.6-4.1z"/>
              <path fill="#34A853" d="M12 21.6c2.6 0 4.8-.9 6.4-2.3l-3.6-2.8c-1 .7-2.3 1.1-2.8 1.1-2.6 0-4.8-1.7-5.6-4.1l-3 2.3C5 19.5 8.2 21.6 12 21.6z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            type="button"
            className="auth-switch-btn"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin"
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </section>
      </div>
    </main>
  );
}
