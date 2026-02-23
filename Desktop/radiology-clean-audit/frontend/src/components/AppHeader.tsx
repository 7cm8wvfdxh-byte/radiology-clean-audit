"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getToken, clearToken } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export default function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (pathname === "/login" || pathname === "/") return;
    const token = getToken();
    if (!token) {
      router.replace("/");
      return;
    }
    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) {
          clearToken();
          router.replace("/");
        } else {
          setUsername(d.username);
        }
      })
      .catch(() => {
        clearToken();
        router.replace("/");
      });
  }, [pathname]);

  function logout() {
    clearToken();
    router.replace("/login");
  }

  if (pathname === "/login" || pathname === "/") return null;

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold hover:opacity-80">
          Radiology-Clean
        </Link>
        <div className="flex items-center gap-3">
          {username && (
            <span className="text-xs text-zinc-500">{username}</span>
          )}
          <button
            onClick={logout}
            className="text-xs text-zinc-600 hover:text-zinc-900 border border-zinc-200 rounded px-2 py-1"
          >
            Çıkış
          </button>
        </div>
      </div>
    </header>
  );
}
