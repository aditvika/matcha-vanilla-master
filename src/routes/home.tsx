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
} from "lucide-react";

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

function HomePage() {
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
          <button className="home-bell" aria-label="Notifications" type="button">
            <Bell size={20} />
            <span className="home-bell-dot" aria-hidden />
          </button>
        </header>

        {/* Featured glass card */}
        <section className="home-featured" aria-label="MVMaster Premium">
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
        </section>

        {/* Service grid */}
        <section className="home-section" aria-label="Services">
          <div className="home-section-head">
            <h3 className="home-section-title">Services</h3>
            <span className="home-section-link">See all</span>
          </div>
          <div className="home-grid">
            {services.map(({ label, Icon }) => (
              <button key={label} type="button" className="home-card">
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
        <Link to="/home" className="home-nav-item home-nav-active">
          <HomeIcon size={22} />
          <span>Home</span>
        </Link>
        <Link to="/home" className="home-nav-item home-nav-create">
          <Plus size={26} />
        </Link>
        <Link to="/home" className="home-nav-item">
          <Settings size={22} />
          <span>Settings</span>
        </Link>
      </nav>
    </main>
  );
}
