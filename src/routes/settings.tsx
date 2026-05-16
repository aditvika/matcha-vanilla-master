import { createFileRoute, Link } from "@tanstack/react-router";
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
} from "lucide-react";

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

type Item = {
  label: string;
  desc: string;
  Icon: typeof UserCircle2;
};

const items: Item[] = [
  { label: "Account Profile", desc: "Name, email and avatar", Icon: UserCircle2 },
  { label: "Manage Premium Subscription", desc: "Plan, billing and invoices", Icon: Crown },
  { label: "Language", desc: "English (US)", Icon: Languages },
  { label: "Privacy Policy", desc: "Data and permissions", Icon: ShieldCheck },
];

function SettingsPage() {
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
            {items.map(({ label, desc, Icon }) => (
              <li key={label}>
                <button type="button" className="settings-item">
                  <div className="settings-item-icon">
                    <Icon size={20} />
                  </div>
                  <div className="settings-item-text">
                    <p className="settings-item-label">{label}</p>
                    <p className="settings-item-desc">{desc}</p>
                  </div>
                  <ChevronRight size={18} className="settings-item-chev" />
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
    </main>
  );
}
