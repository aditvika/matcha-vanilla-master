import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/require-auth";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Lock, Sparkles, Wand2, Video } from "lucide-react";
import { useSelectedMedia } from "@/hooks/use-selected-media";
import { usePremiumStatus } from "@/hooks/use-premium-status";
import { PremiumModal } from "@/components/premium-modal";
import { SubscriptionModal } from "@/components/subscription-modal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/preview")({
  head: () => ({
    meta: [
      { title: "Preview — Matcha Vanilla Production" },
      { name: "description", content: "Preview your selected media and choose an output resolution." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <PreviewPage />
    </RequireAuth>
  ),
});

type Option = {
  key: string;
  label: string;
  sub: string;
  locked: boolean;
};

function PreviewPage() {
  const { media, clear } = useSelectedMedia();
  const { isPremium } = usePremiumStatus();
  const navigate = useNavigate();
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!media) void navigate({ to: "/home", replace: true });
  }, [media, navigate]);

  if (!media) return null;

  const isVideo = media.kind === "video";

  const photoOptions: Option[] = [
    { key: "720p", label: "720p", sub: isPremium ? "Premium" : "5× Daily Limit", locked: false },
    { key: "1080p", label: "1080p", sub: isPremium ? "Premium" : "5× Daily Limit", locked: false },
    { key: "2K", label: "2K", sub: isPremium ? "Ultra HD" : "Premium Only", locked: !isPremium },
    { key: "4K", label: "4K", sub: isPremium ? "Ultra HD" : "Premium Only", locked: !isPremium },
  ];

  const videoOptions: Option[] = [
    { key: "720p", label: "720p", sub: isPremium ? "Premium" : "3× Daily Limit", locked: false },
    {
      key: "1080p",
      label: "1080p",
      sub: isPremium ? "Premium" : "1× / Need Premium",
      locked: !isPremium,
    },
    { key: "2K", label: "2K", sub: isPremium ? "Ultra HD" : "Premium Only", locked: !isPremium },
    { key: "4K", label: "4K", sub: isPremium ? "Ultra HD" : "Premium Only", locked: !isPremium },
  ];

  const options = isVideo ? videoOptions : photoOptions;
  const HeadingIcon = isVideo ? Video : Wand2;
  const heading = isVideo ? "Upscale Video" : "Enhance Photo";

  const handleOption = (opt: Option) => {
    if (opt.locked) {
      setPremiumOpen(true);
      return;
    }
    setSelected(opt.key);
  };

  const goBack = () => {
    clear();
    void navigate({ to: "/home" });
  };

  const handleProcess = async () => {
    if (!selected || processing) return;

    setProcessing(true);
    try {
      const kind = isVideo ? "video" : "photo";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)("consume_quota", {
        p_kind: kind,
        p_resolution: selected,
      });
      if (error) {
        toast.error("Could not verify your quota. Please try again.");
        setProcessing(false);
        return;
      }
      const res = data as {
        success: boolean;
        reason?: string;
        limit?: number;
        remaining?: number;
        period_end?: string;
      };
      if (!res?.success) {
        if (res?.reason === "LOCKED") {
          setPremiumOpen(true);
        } else {
          toast.error(
            isVideo
              ? `Video quota used up (${res?.limit ?? 0} per period). Upgrade or redeem a voucher for more.`
              : `Photo quota used up (${res?.limit ?? 0} per period). Upgrade or redeem a voucher for more.`,
            {
              duration: 6000,
              action: { label: "Upgrade", onClick: () => setSubOpen(true) },
            },
          );
        }
        setProcessing(false);
        return;
      }
      void navigate({ to: "/processing", search: { resolution: selected } });
    } catch {
      toast.error("Something went wrong. Please try again.");
      setProcessing(false);
    }
  };


  return (
    <main className="preview-root">
      <div className="preview-glow preview-glow-a" aria-hidden />
      <div className="preview-glow preview-glow-b" aria-hidden />

      <header className="preview-header">
        <button type="button" className="preview-back" aria-label="Back" onClick={goBack}>
          <ArrowLeft size={20} />
        </button>
        <div className="preview-heading">
          <HeadingIcon size={18} />
          <h1>{heading}</h1>
        </div>
        <span className="preview-badge">{isPremium ? "PREMIUM" : "FREE"}</span>
      </header>

      <section className="preview-stage" aria-label="Selected media">
        <div className="preview-frame">
          {isVideo ? (
            <video
              src={media.url}
              className="preview-media"
              controls
              playsInline
            />
          ) : (
            <img src={media.url} alt="Selected preview" className="preview-media" />
          )}
        </div>
        <p className="preview-filename" title={media.file.name}>
          {media.file.name}
        </p>
      </section>

      <section className="preview-options" aria-label="Resolution options">
        <div className="preview-options-head">
          <Sparkles size={16} />
          <h2>Select Output Resolution</h2>
        </div>
        <div className="preview-options-grid">
          {options.map((opt) => {
            const active = selected === opt.key && !opt.locked;
            return (
              <button
                key={opt.key}
                type="button"
                className={`preview-opt ${opt.locked ? "preview-opt-locked" : ""} ${active ? "preview-opt-active" : ""}`}
                onClick={() => handleOption(opt)}
                aria-pressed={active}
              >
                <div className="preview-opt-top">
                  <span className="preview-opt-label">{opt.label}</span>
                  {opt.locked && <Lock size={14} className="preview-opt-lock" />}
                </div>
                <span className="preview-opt-sub">{opt.sub}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="preview-cta"
          disabled={!selected || processing}
          onClick={() => void handleProcess()}
        >
          {processing ? "Starting..." : selected ? `Process at ${selected}` : "Choose a resolution"}
        </button>
      </section>

      <PremiumModal
        open={premiumOpen}
        onOpenChange={setPremiumOpen}
        onUnderstand={() => setTimeout(() => setSubOpen(true), 250)}
      />
      <SubscriptionModal open={subOpen} onOpenChange={setSubOpen} />
    </main>
  );
}
