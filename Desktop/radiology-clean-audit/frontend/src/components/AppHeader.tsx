"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getToken, clearToken } from "@/lib/auth";
import { API_BASE } from "@/lib/constants";
import ThemeToggle from "@/components/ThemeToggle";

const NAV_ITEMS = [
  { href: "/", label: "Vakalar" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/agent", label: "Radyolog Ajan" },
  { href: "/compare", label: "Karsilastir" },
  { href: "/new", label: "Yeni Vaka" },
  { href: "/patients", label: "Hastalar" },
  { href: "/second-reading", label: "Ikinci Okuma" },
];

export default function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [username, setUsername] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (pathname === "/") return;
    const token = getToken();
    if (!token) { router.replace("/"); return; }
    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) { clearToken(); router.replace("/"); }
        else setUsername(d.username);
      })
      .catch(() => { clearToken(); router.replace("/"); });
  }, [pathname, router]);

  function logout() {
    clearToken();
    router.replace("/");
  }

  // Login sayfasinda header gosterme
  if (pathname === "/" && !getToken()) return null;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header
      className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:bg-zinc-900/80 dark:border-zinc-700"
      role="banner"
    >
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold text-zinc-900 dark:text-zinc-100 hover:opacity-80 transition-opacity" aria-label="Ana sayfa">
          Radiology-Clean
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" role="navigation" aria-label="Ana navigasyon">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                isActive(item.href)
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
              }`}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User + theme + mobile toggle */}
        <div className="flex items-center gap-2">
          {username && (
            <span className="hidden sm:inline text-xs text-zinc-500 dark:text-zinc-400">{username}</span>
          )}
          <ThemeToggle />
          <button
            onClick={logout}
            className="text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-600 rounded-md px-2.5 py-1.5 transition-colors"
            aria-label="Oturumu kapat"
          >
            Cikis
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label={mobileOpen ? "Menuyu kapat" : "Menuyu ac"}
            aria-expanded={mobileOpen}
          >
            <svg className="w-5 h-5 text-zinc-700 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2" role="navigation" aria-label="Mobil navigasyon">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2.5 rounded-md text-sm transition-colors ${
                isActive(item.href)
                  ? "bg-zinc-100 text-zinc-900 font-medium dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
