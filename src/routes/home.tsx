import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  Wand2,
  UserRoundCog,
  Video,
  FolderOpen,
  Home as HomeIcon,
  Plus,
  Settings,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Crown,
  Gift,
  Medal,
  Award,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { PremiumModal } from "@/components/premium-modal";
import { SubscriptionModal } from "@/components/subscription-modal";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Home — Matcha Vanilla Production" },
      {
        name: "description",
        content: "Your AI creative studio. Enhance photos, swap faces, upscale video and more.",
      },
    ],
  }),
  component: HomePage,
});

type Service = {
  label: string;
  Icon: typeof Wand2;
};

const services: Service[] = [
  { label: "Enhance Photo", Icon: Wand2 },
  { label: "Face Swap", Icon: UserRoundCog },
  { label: "Upscale Video", Icon: Video },
  { label: "Project History", Icon: FolderOpen },
];

type Notification = {
  id: string;
  Icon: typeof Wand2;
  title: string;
  body: string;
  time: string;
  tone: "success" | "premium" | "info";
};

const notifications: Notification[] = [
  {
    id: "1",
    Icon: CheckCircle2,
    title: "Your video upscale is complete!",
    body: "Tap to preview the 4K render and download.",
    time: "2m ago",
    tone: "success",
  },
  {
    id: "2",
    Icon: Crown,
    title: "Unlock 4K exports with Premium",
    body: "Go pro to remove watermarks and queue limits.",
    time: "1h ago",
    tone: "premium",
  },
  {
    id: "3",
    Icon: Gift,
    title: "New: Face Swap v2 is live",
    body: "Sharper edges, better blending, faster results.",
    time: "Yesterday",
    tone: "info",
  },
];

type LeaderTab = "Bulanan" | "Tahunan" | "Mix";
type LeaderEntry = { name: string; tier: LeaderTab; mvp: number };
const leaderboard: Record<LeaderTab, LeaderEntry[]> = {
  Bulanan: [
    { name: "Ahmad_Zain", tier: "Bulanan", mvp: 12 },
    { name: "Siti_Rahma", tier: "Bulanan", mvp: 9 },
    { name: "Rizky_Alif", tier: "Bulanan", mvp: 6 },
  ],
  Tahunan: [
    { name: "Adityo Saputra", tier: "Tahunan", mvp: 7 },
    { name: "Vika Adellya", tier: "Tahunan", mvp: 5 },
    { name: "Hayabusa", tier: "Tahunan", mvp: 2 },
  ],
  Mix: [
    { name: "Kevin_San", tier: "Mix", mvp: 15 },
    { name: "Putri_Utami", tier: "Mix", mvp: 11 },
    { name: "Budi_Gaming", tier: "Mix", mvp: 8 },
  ],
};
const rankMeta = [
  { Icon: Crown, cls: "lb-rank-gold" },
  { Icon: Medal, cls: "lb-rank-silver" },
  { Icon: Award, cls: "lb-rank-bronze" },
];

function HomePage() {
  const [notifOpen, setNotifOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [faceSwapOpen, setFaceSwapOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);

  const openNotifications = () => {
    setNotifOpen(true);
    setHasUnread(false);
  };

  return (
    <main className="home-root">
      <div className="home-glow home-glow-green" aria-hidden />
      <div className="home-glow home-glow-warm" aria-hidden />

      <div className="home-content home-fade-in">
        {/* Header */}
        <header className="home-header">
          <div>
            <p className="home-greet-eyebrow">Welcome back</p>
            <h1 className="home-greet">Hello, User!</h1>
          </div>
          <button
            className="home-bell"
            aria-label="Notifications"
            type="button"
            onClick={openNotifications}
          >
            <Bell size={20} />
            {hasUnread && <span className="home-bell-dot" aria-hidden />}
          </button>
        </header>

        {/* Featured glass card */}
        <button
          type="button"
          className="home-featured"
          aria-label="MVMaster Premium"
          onClick={() => setPremiumOpen(true)}
        >
          <div className="home-featured-glow" aria-hidden />
          <div className="home-featured-row">
            <div className="home-featured-icon">
              <Sparkles size={22} />
            </div>
            <div className="home-featured-text">
              <p className="home-featured-tag">MVMaster Premium</p>
              <h2 className="home-featured-title">Unlock unlimited AI magic</h2>
              <p className="home-featured-sub">
                Pro models, 4K exports & priority queue.
              </p>
            </div>
            <ChevronRight size={20} className="home-featured-chev" />
          </div>
        </button>

        {/* Service grid */}
        <section className="home-section" aria-label="Services">
          <div className="home-section-head">
            <h3 className="home-section-title">Services</h3>
            <span className="home-section-link">See all</span>
          </div>
          <div className="home-grid">
            {services.map(({ label, Icon }) => (
              <button
                key={label}
                type="button"
                className="home-card"
                onClick={label === "Face Swap" ? () => setFaceSwapOpen(true) : undefined}
              >
                <div className="home-card-icon">
                  <Icon size={24} />
                </div>
                <span className="home-card-label">{label}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Bottom nav */}
      <nav className="home-nav" aria-label="Primary">
        <Link
          to="/home"
          className="home-nav-item"
          activeProps={{ className: "home-nav-item home-nav-active" }}
        >
          <HomeIcon size={22} />
          <span>Home</span>
        </Link>
        <Link to="/home" className="home-nav-item home-nav-create">
          <Plus size={26} />
        </Link>
        <Link
          to="/settings"
          className="home-nav-item"
          activeProps={{ className: "home-nav-item home-nav-active" }}
        >
          <Settings size={22} />
          <span>Settings</span>
        </Link>
      </nav>

      {/* Face Swap — Coming Soon modal */}
      <Dialog open={faceSwapOpen} onOpenChange={setFaceSwapOpen}>
        <DialogContent className="coming-soon-dialog-content">
          <DialogHeader>
            <DialogTitle className="coming-soon-dialog-title">Coming Soon!</DialogTitle>
            <DialogDescription className="coming-soon-dialog-desc">
              We will bring this feature to you very soon.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              className="coming-soon-dialog-btn"
              onClick={() => setFaceSwapOpen(false)}
            >
              Got it
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notifications bottom sheet */}
      <Drawer open={notifOpen} onOpenChange={setNotifOpen}>
        <DrawerContent className="notif-sheet">
          <DrawerHeader className="notif-sheet-header">
            <DrawerTitle className="notif-sheet-title">Notifications</DrawerTitle>
            <DrawerDescription className="notif-sheet-sub">
              Updates from your AI studio
            </DrawerDescription>
          </DrawerHeader>
          <ul className="notif-list">
            {notifications.map(({ id, Icon, title, body, time, tone }) => (
              <li key={id} className="notif-item">
                <div className={`notif-icon notif-icon-${tone}`}>
                  <Icon size={18} />
                </div>
                <div className="notif-text">
                  <p className="notif-title">{title}</p>
                  <p className="notif-body">{body}</p>
                </div>
                <span className="notif-time">{time}</span>
              </li>
            ))}
          </ul>
          <div className="notif-sheet-foot" />
        </DrawerContent>
      </Drawer>

      {/* Premium notification modal */}
      <PremiumModal
        open={premiumOpen}
        onOpenChange={setPremiumOpen}
        onUnderstand={() => setTimeout(() => setSubOpen(true), 250)}
      />

      {/* Subscription plans modal */}
      <SubscriptionModal open={subOpen} onOpenChange={setSubOpen} />
    </main>
  );
}
