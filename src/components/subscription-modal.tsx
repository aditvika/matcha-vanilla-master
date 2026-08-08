import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Check, Zap, Award, Ticket, LogIn } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseSession } from "@/hooks/use-supabase-session";
import { usePremiumStatus } from "@/hooks/use-premium-status";

const plans = [
  {
    title: "Paket Bulanan",
    price: "Rp 55.000",
    desc: "Sistem kredit berkala maks. 200 kredit per bulan. Kredit reset setiap bulan.",
    highlighted: false,
  },
  {
    title: "Paket Tahunan",
    price: "Rp 239.000",
    desc: "Sistem kredit berkala maks. 250 kredit per bulan. Kredit reset setiap bulan.",
    highlighted: true,
    badge: "Lebih Hemat!",
  },
  {
    title: "Paket Tahunan VIP+ Sultan",
    price: "Rp 350.000",
    desc: "Sistem kredit berkala maks. 400 kredit per bulan. Kredit reset setiap bulan.",
    highlighted: true,
    sultan: true,
    badge: "Sultan / Best Value!",
  },
];

const features = [
  { icon: Check, text: "Buka semua fitur pilihan HD 2K & 4K" },
  { icon: Zap, text: "Proses HD tanpa antrean" },
  { icon: Award, text: "Nama kalian yg berlangganan akan di list di top leaderboard MV Official" },
];

export function SubscriptionModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { user } = useSupabaseSession();
  const { refresh: refreshPremium } = usePremiumStatus();
  const [code, setCode] = useState("");
  const [claiming, setClaiming] = useState(false);

  const handleClaim = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      toast.error("Masukkan kode aktivasi terlebih dahulu");
      return;
    }
    if (!user) {
      toast.error("Silakan masuk terlebih dahulu untuk mengaktifkan premium");
      return;
    }
    setClaiming(true);
    try {
      const { data, error } = await supabase.rpc("claim_voucher", {
        p_code: trimmed,
      });
      if (error) {
        if (error.message.includes("NOT_AUTHENTICATED")) {
          toast.error("Silakan masuk terlebih dahulu");
        } else {
          toast.error("Kode aktivasi salah atau sudah digunakan!");
        }
        return;
      }
      const payload = data as { package_type?: string; premium_until?: string } | null;
      const pkg = payload?.package_type === "yearly" ? "Tahunan" : "Bulanan";
      toast.success(`Premium ${pkg} berhasil diaktifkan 🎉`);
      setCode("");
      await refreshPremium();
      onOpenChange(false);
    } catch {
      toast.error("Kode aktivasi salah atau sudah digunakan!");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="subscription-modal-content"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="subscription-modal-title">
            Pilih Paket Premium Kamu 🚀
          </DialogTitle>
          <DialogDescription className="sr-only">
            Pilih paket premium bulanan atau tahunan
          </DialogDescription>
        </DialogHeader>

        <div className="sub-plans-grid">
          {plans.map((plan) => (
            <div
              key={plan.title}
              className={`sub-plan-card${plan.highlighted ? " sub-plan-card-highlighted" : ""}`}
            >
              {plan.badge && <span className="sub-plan-badge">{plan.badge}</span>}
              <h3 className="sub-plan-title">{plan.title}</h3>
              <p className="sub-plan-price">{plan.price}</p>
              <p className="sub-plan-desc" style={{ whiteSpace: "pre-line" }}>
                {plan.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="sub-features">
          <h4 className="sub-features-title">Fitur Istimewa Yang Kamu Dapatkan:</h4>
          <ul className="sub-features-list">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="sub-feature-item">
                <Icon size={18} />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="voucher-section">
          <h4 className="voucher-title">
            <Ticket size={16} /> Punya Kode Aktivasi?
          </h4>
          {user ? (
            <div className="voucher-row">
              <input
                type="text"
                className="voucher-input"
                placeholder="Masukkan Kode Aktivasi"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                disabled={claiming}
                autoCapitalize="characters"
              />
              <button
                type="button"
                className="voucher-btn"
                onClick={handleClaim}
                disabled={claiming}
              >
                {claiming ? "Memproses…" : "Aktifkan Premium"}
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="voucher-signin"
              onClick={() => onOpenChange(false)}
            >
              <LogIn size={16} />
              <span>Masuk untuk klaim voucher</span>
            </Link>
          )}
        </div>

        <p className="sub-footer-note">
          (NOTE) Nominal harga yang tertera sudah harga akhir, dan untuk kenyamanan bersama harga akan terus di update lewat komunitas sesuai dengan pasar
        </p>
      </DialogContent>
    </Dialog>
  );
}
