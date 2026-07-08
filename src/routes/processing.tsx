import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Zap, Loader2 } from "lucide-react";
import { useSelectedMedia } from "@/hooks/use-selected-media";
import { usePremiumStatus } from "@/hooks/use-premium-status";

const searchSchema = z.object({
  resolution: z.string(),
});

export const Route = createFileRoute("/processing")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Processing — Matcha Vanilla Production" },
      { name: "description", content: "Your media is being processed." },
    ],
  }),
  component: ProcessingPage,
});

const FREE_MESSAGES = [
  "Processing via Standard Server...",
  "Waiting in Queue (Est. 1-2 minutes)",
  "Analyzing frames...",
  "Applying enhancement...",
];
const PREMIUM_MESSAGES = [
  "Processing via Priority GPU Server...",
  "Zero Queue - Priority Lane Active",
  "Rendering at ultra quality...",
];

function ProcessingPage() {
  const { media } = useSelectedMedia();
  const { isPremium } = usePremiumStatus();
  const { resolution } = Route.useSearch();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const doneRef = useRef(false);

  const duration = isPremium ? 4000 : 30000;
  const messages = isPremium ? PREMIUM_MESSAGES : FREE_MESSAGES;

  useEffect(() => {
    if (!media) {
      void navigate({ to: "/home", replace: true });
      return;
    }
    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      if (pct >= 100 && !doneRef.current) {
        doneRef.current = true;
        clearInterval(tick);
        setTimeout(() => {
          void navigate({ to: "/result", search: { resolution }, replace: true });
        }, 350);
      }
    }, 100);
    const msgTick = setInterval(() => {
      setMsgIdx((i) => (i + 1) % messages.length);
    }, isPremium ? 1200 : 3500);
    return () => {
      clearInterval(tick);
      clearInterval(msgTick);
    };
  }, [duration, isPremium, media, messages.length, navigate, resolution]);

  if (!media) return null;

  return (
    <main className={`proc-root ${isPremium ? "proc-premium" : "proc-free"}`}>
      <div className="proc-bg" aria-hidden />
      <div className="proc-card">
        <div className="proc-badge">
          {isPremium ? <Zap size={14} /> : <Loader2 size={14} className="proc-spin" />}
          <span>{isPremium ? "PRIORITY LANE" : "STANDARD LANE"}</span>
        </div>

        {isPremium ? (
          <div className="proc-orbit" aria-hidden>
            <div className="proc-orbit-ring proc-orbit-a" />
            <div className="proc-orbit-ring proc-orbit-b" />
            <div className="proc-orbit-ring proc-orbit-c" />
            <div className="proc-orbit-core">
              <Zap size={28} />
            </div>
          </div>
        ) : (
          <div className="proc-bar-wrap">
            <div className="proc-bar-track">
              <div className="proc-bar-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="proc-bar-pct">{Math.floor(progress)}%</div>
          </div>
        )}

        <p className="proc-message" key={msgIdx}>
          {messages[msgIdx]}
        </p>
        <p className="proc-sub">
          Output resolution: <strong>{resolution}</strong>
        </p>
      </div>
    </main>
  );
}
