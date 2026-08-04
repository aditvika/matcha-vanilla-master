import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type Lang = "id" | "en";

const STORAGE_KEY = "mv:lang";

type Dict = Record<string, string>;

const en: Dict = {
  // common
  "common.gotIt": "Got it",
  "common.ok": "Oke",
  "common.seeAll": "See all",
  "common.loading": "Loading…",
  "common.save": "Save Changes",
  // nav
  "nav.home": "Home",
  "nav.settings": "Settings",
  // home
  "home.welcome": "Welcome back",
  "home.hello": "Hello, User!",
  "home.notifications": "Notifications",
  "home.notifSub": "Updates from your AI studio",
  "home.services": "Services",
  "home.leaderboard": "Premium Leaderboard",
  "home.premiumTag": "MVMaster Premium",
  "home.premiumTitle": "Unlock unlimited AI magic",
  "home.premiumSub": "Pro models, 4K exports & priority queue.",
  "home.premiumActive": "PREMIUM ACTIVATED",
  "home.premiumActiveSub": "enjoy your premium access",
  "svc.enhancePhoto": "Enhance Photo",
  "svc.faceSwap": "Face Swap",
  "svc.upscaleVideo": "Upscale Video",
  "svc.projectHistory": "Project History",
  "home.comingSoon": "Coming Soon!",
  "home.comingSoonBody": "We will bring this feature to you very soon.",
  // settings
  "settings.eyebrow": "Preferences",
  "settings.title": "Settings",
  "settings.admin": "Admin Dashboard",
  "settings.adminDesc": "Manage vouchers & subscribers",
  "settings.profile": "Account Profile",
  "settings.profileDesc": "Name, email and avatar",
  "settings.premium": "Manage Premium Subscription",
  "settings.language": "Language",
  "settings.privacy": "Privacy Policy",
  "settings.privacyDesc": "Opens in a new tab",
  "settings.logout": "Log out",
  "settings.freePlan": "Free Plan",
  "settings.premiumMonthly": "Premium Active - Bulanan",
  "settings.premiumYearly": "Premium Active - Tahunan",
  "settings.profileSheetDesc": "Update your personal information",
  "settings.name": "Name",
  "settings.account": "Account",
  "settings.languageDesc": "Choose your preferred language",
  "settings.signedOut": "Berhasil keluar dari akun.",
  "settings.signOutFailed": "Gagal keluar dari akun. Silakan coba lagi.",
  // auth
  "auth.eyebrow": "Account",
  "auth.signIn": "Sign In",
  "auth.createAccount": "Create Account",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.google": "Continue with Google",
  "auth.toSignup": "Don't have an account? Sign up",
  "auth.toSignin": "Already have an account? Sign in",
  "auth.working": "Please wait…",
};

const id: Dict = {
  "common.gotIt": "Mengerti",
  "common.ok": "Oke",
  "common.seeAll": "Lihat semua",
  "common.loading": "Memuat…",
  "common.save": "Simpan Perubahan",
  "nav.home": "Beranda",
  "nav.settings": "Pengaturan",
  "home.welcome": "Selamat datang kembali",
  "home.hello": "Halo, Pengguna!",
  "home.notifications": "Notifikasi",
  "home.notifSub": "Kabar terbaru dari studio AI kamu",
  "home.services": "Layanan",
  "home.leaderboard": "Papan Peringkat Premium",
  "home.premiumTag": "MVMaster Premium",
  "home.premiumTitle": "Buka keajaiban AI tanpa batas",
  "home.premiumSub": "Model pro, ekspor 4K & antrean prioritas.",
  "home.premiumActive": "PREMIUM AKTIF",
  "home.premiumActiveSub": "selamat menikmati",
  "svc.enhancePhoto": "Perjelas Foto",
  "svc.faceSwap": "Tukar Wajah",
  "svc.upscaleVideo": "Perjelas Video",
  "svc.projectHistory": "Riwayat Proyek",
  "home.comingSoon": "Segera Hadir!",
  "home.comingSoonBody": "Fitur ini akan segera kami hadirkan untuk kamu.",
  "settings.eyebrow": "Preferensi",
  "settings.title": "Pengaturan",
  "settings.admin": "Dasbor Admin",
  "settings.adminDesc": "Kelola voucher & pelanggan",
  "settings.profile": "Profil Akun",
  "settings.profileDesc": "Nama, email, dan avatar",
  "settings.premium": "Kelola Langganan Premium",
  "settings.language": "Bahasa",
  "settings.privacy": "Kebijakan Privasi",
  "settings.privacyDesc": "Dibuka di tab baru",
  "settings.logout": "Keluar",
  "settings.freePlan": "Paket Gratis",
  "settings.premiumMonthly": "Premium Aktif - Bulanan",
  "settings.premiumYearly": "Premium Aktif - Tahunan",
  "settings.profileSheetDesc": "Perbarui informasi pribadi kamu",
  "settings.name": "Nama",
  "settings.account": "Akun",
  "settings.languageDesc": "Pilih bahasa yang kamu inginkan",
  "settings.signedOut": "Berhasil keluar dari akun.",
  "settings.signOutFailed": "Gagal keluar dari akun. Silakan coba lagi.",
  "auth.eyebrow": "Akun",
  "auth.signIn": "Masuk",
  "auth.createAccount": "Buat Akun",
  "auth.email": "Email",
  "auth.password": "Kata Sandi",
  "auth.google": "Lanjutkan dengan Google",
  "auth.toSignup": "Belum punya akun? Daftar",
  "auth.toSignin": "Sudah punya akun? Masuk",
  "auth.working": "Mohon tunggu…",
};

const dicts: Record<Lang, Dict> = { en, id };

type I18nState = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nState | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "id" || stored === "en") setLangState(stored);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback((key: string) => dicts[lang][key] ?? en[key] ?? key, [lang]);

  const value = useMemo<I18nState>(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
