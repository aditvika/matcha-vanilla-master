import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  UserCircle2,
  Crown,
  Languages,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Home as HomeIcon,
  Plus,
  Settings as SettingsIcon,
  Camera,
  Check,
  Sparkles,
  Zap,
  BadgeCheck,
  ExternalLink,
  LogIn,
  Mail,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  auth,
  sendMagicLink,
  signInWithGoogle,
  completeEmailLinkSignInIfPresent,
} from "@/lib/firebase";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Matcha Vanilla Production" },
      {
        name: "description",
        content: "Manage your account, subscription, language and privacy preferences.",
      },
    ],
  }),
  component: SettingsPage,
});

type SheetKey = "profile" | "premium" | "language" | null;

const LANGUAGES = [
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "es-ES", label: "Español" },
  { code: "fr-FR", label: "Français" },
  { code: "de-DE", label: "Deutsch" },
  { code: "ja-JP", label: "日本語" },
  { code: "vi-VN", label: "Tiếng Việt" },
];

function SettingsPage() {
  const [openSheet, setOpenSheet] = useState<SheetKey>(null);
  const [name, setName] = useState<string>(() => {
    if (typeof window === "undefined") return "Matcha User";
    return localStorage.getItem("mv:profile:name") || "Matcha User";
  });
  const [avatar, setAvatar] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("mv:profile:avatar");
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("mv:auth:loggedIn") === "1";
  });
  const userEmail = isLoggedIn
    ? localStorage.getItem("mv:auth:email") || "user@matchavanilla.app"
    : "";
  const [language, setLanguage] = useState("en-US");
  const isPremium = false;
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem("mv:profile:name", name);
  }, [name]);
  useEffect(() => {
    if (avatar) localStorage.setItem("mv:profile:avatar", avatar);
    else localStorage.removeItem("mv:profile:avatar");
  }, [avatar]);

  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    localStorage.removeItem("mv:auth:loggedIn");
    localStorage.removeItem("mv:auth:email");
    setIsLoggedIn(false);
    setOpenSheet(null);
  };

  const currentLangLabel = LANGUAGES.find((l) => l.code === language)?.label ?? "English (US)";

  const items: Array<{
    label: string;
    desc: string;
    Icon: typeof UserCircle2;
    onClick: () => void;
    isExternal?: boolean;
  }> = [
    {
      label: "Account Profile",
      desc: "Name, email and avatar",
      Icon: UserCircle2,
      onClick: () => setOpenSheet("profile"),
    },
    {
      label: "Manage Premium Subscription",
      desc: isPremium ? "Premium Active" : "Free Plan",
      Icon: Crown,
      onClick: () => setOpenSheet("premium"),
    },
    {
      label: "Language",
      desc: currentLangLabel,
      Icon: Languages,
      onClick: () => setOpenSheet("language"),
    },
    {
      label: "Privacy Policy",
      desc: "Opens in a new tab",
      Icon: ShieldCheck,
      onClick: () => {
        window.open("https://www.privacypolicies.com/live/sample", "_blank", "noopener,noreferrer");
      },
      isExternal: true,
    },
  ];

  return (
    <main className="home-root">
      <div className="home-glow home-glow-green" aria-hidden />
      <div className="home-glow home-glow-warm" aria-hidden />

      <div className="home-content home-fade-in">
        <header className="home-header">
          <div>
            <p className="home-greet-eyebrow">Preferences</p>
            <h1 className="home-greet">Settings</h1>
          </div>
        </header>

        <section className="home-section" aria-label="Account settings">
          <ul className="settings-list">
            {items.map(({ label, desc, Icon, onClick, isExternal }) => (
              <li key={label}>
                <button type="button" className="settings-item" onClick={onClick}>
                  <div className="settings-item-icon">
                    <Icon size={20} />
                  </div>
                  <div className="settings-item-text">
                    <p className="settings-item-label">{label}</p>
                    <p className="settings-item-desc">{desc}</p>
                  </div>
                  {isExternal ? (
                    <ExternalLink size={18} className="settings-item-chev" />
                  ) : (
                    <ChevronRight size={18} className="settings-item-chev" />
                  )}
                </button>
              </li>
            ))}
          </ul>

          <button type="button" className="settings-logout">
            <LogOut size={18} />
            <span>Log out</span>
          </button>
        </section>
      </div>

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
          <SettingsIcon size={22} />
          <span>Settings</span>
        </Link>
      </nav>

      {/* Profile Sheet */}
      <Drawer open={openSheet === "profile"} onOpenChange={(o) => !o && setOpenSheet(null)}>
        <DrawerContent className="settings-sheet">
          <DrawerHeader className="settings-sheet-header">
            <DrawerTitle className="settings-sheet-title">Account Profile</DrawerTitle>
            <DrawerDescription className="settings-sheet-desc">
              Update your personal information
            </DrawerDescription>
          </DrawerHeader>

          <div className="settings-sheet-body">
            <div className="profile-avatar-wrap">
              <div
                className="profile-avatar"
                aria-hidden
                style={
                  avatar
                    ? {
                        backgroundImage: `url(${avatar})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        color: "transparent",
                      }
                    : undefined
                }
              >
                {name.charAt(0).toUpperCase()}
              </div>
              <button
                type="button"
                className="profile-avatar-edit"
                aria-label="Change avatar"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera size={16} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleAvatarPick}
              />
            </div>

            <div className="profile-field">
              <Label htmlFor="profile-name" className="profile-label">Name</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="profile-input"
                placeholder="Your name"
              />
            </div>

            <div className="profile-field">
              <Label className="profile-label">Account</Label>
              {isLoggedIn ? (
                <div className="profile-email-display">
                  <Mail size={16} />
                  <span>{userEmail}</span>
                  <BadgeCheck size={16} className="profile-email-verified" />
                </div>
              ) : (
                <a href="/login" className="profile-link-account">
                  <LogIn size={18} />
                  <span>Log In / Link Account</span>
                </a>
              )}
            </div>
          </div>

          <DrawerFooter className="settings-sheet-footer">
            <button
              type="button"
              className="settings-sheet-primary"
              onClick={() => setOpenSheet(null)}
            >
              Save Changes
            </button>
            {isLoggedIn && (
              <button
                type="button"
                className="profile-logout-btn"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Premium Sheet */}
      <Drawer open={openSheet === "premium"} onOpenChange={(o) => !o && setOpenSheet(null)}>
        <DrawerContent className="settings-sheet">
          <DrawerHeader className="settings-sheet-header">
            <DrawerTitle className="settings-sheet-title">Premium Subscription</DrawerTitle>
            <DrawerDescription className="settings-sheet-desc">
              {isPremium ? "You're on the Premium plan" : "You're on the Free plan"}
            </DrawerDescription>
          </DrawerHeader>

          <div className="settings-sheet-body">
            <div className="premium-status">
              <div className="premium-status-icon">
                <Crown size={20} />
              </div>
              <div>
                <p className="premium-status-label">Current Plan</p>
                <p className="premium-status-value">
                  {isPremium ? "Premium Active" : "Free Plan"}
                </p>
              </div>
            </div>

            <div className="premium-card">
              <div className="premium-card-header">
                <Sparkles size={18} />
                <span>MVMaster Premium</span>
              </div>
              <ul className="premium-benefits">
                <li>
                  <BadgeCheck size={16} />
                  <span>HD Photo & Video Enhancement</span>
                </li>
                <li>
                  <BadgeCheck size={16} />
                  <span>No Ads, ever</span>
                </li>
                <li>
                  <Zap size={16} />
                  <span>Faster Processing Queue</span>
                </li>
                <li>
                  <BadgeCheck size={16} />
                  <span>4K Export & Priority Support</span>
                </li>
              </ul>
            </div>
          </div>

          <DrawerFooter className="settings-sheet-footer">
            <button
              type="button"
              className="settings-sheet-primary"
              onClick={() => setOpenSheet(null)}
            >
              {isPremium ? "Manage Subscription" : "Upgrade to Premium"}
            </button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Language Sheet */}
      <Drawer open={openSheet === "language"} onOpenChange={(o) => !o && setOpenSheet(null)}>
        <DrawerContent className="settings-sheet">
          <DrawerHeader className="settings-sheet-header">
            <DrawerTitle className="settings-sheet-title">Language</DrawerTitle>
            <DrawerDescription className="settings-sheet-desc">
              Choose your preferred language
            </DrawerDescription>
          </DrawerHeader>

          <div className="settings-sheet-body">
            <ul className="language-list">
              {LANGUAGES.map((lang) => {
                const selected = lang.code === language;
                return (
                  <li key={lang.code}>
                    <button
                      type="button"
                      className={`language-item${selected ? " language-item-active" : ""}`}
                      onClick={() => {
                        setLanguage(lang.code);
                        setOpenSheet(null);
                      }}
                    >
                      <span>{lang.label}</span>
                      {selected && <Check size={18} />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <DrawerClose className="sr-only">Close</DrawerClose>
        </DrawerContent>
      </Drawer>
    </main>
  );
}
