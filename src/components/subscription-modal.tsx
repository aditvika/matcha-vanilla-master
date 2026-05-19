import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Check, Zap, Award } from "lucide-react";

const plans = [
  {
    title: "Paket Bulanan",
    price: "Rp 30.000",
    desc: "Sistem kuota berkala (FUP) maks. 50 foto & 15 video per minggu.",
    highlighted: false,
  },
  {
    title: "Paket Tahunan",
    price: "Rp 120.000",
    desc: "Sistem kuota berkala (FUP) maks. 150 foto & 30 video per bulan.",
    highlighted: true,
    badge: "Lebih Hemat!",
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="subscription-modal-content">
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
            <button
              key={plan.title}
              type="button"
              className={`sub-plan-card${plan.highlighted ? " sub-plan-card-highlighted" : ""}`}
              onClick={() => onOpenChange(false)}
            >
              {plan.badge && <span className="sub-plan-badge">{plan.badge}</span>}
              <h3 className="sub-plan-title">{plan.title}</h3>
              <p className="sub-plan-price">{plan.price}</p>
              <p className="sub-plan-desc">{plan.desc}</p>
            </button>
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

        <p className="sub-footer-note">
          (NOTE) nominal harga bersih akhir, tidak ada tambahan apapun lagi!
        </p>
      </DialogContent>
    </Dialog>
  );
}
