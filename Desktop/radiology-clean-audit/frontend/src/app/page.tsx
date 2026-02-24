"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { FormField, Input } from "@/components/ui/FormField";
import { SkeletonList } from "@/components/Skeleton";
import { getToken, setToken, clearToken, authHeaders } from "@/lib/auth";
import { API_BASE } from "@/lib/constants";

type CaseItem = {
  case_id: string;
  decision?: string;
  created_at?: string;
};

// ── Login Form ────────────────────────────────────────────────────────────────
function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const form = new URLSearchParams();
      form.append("username", username);
      form.append("password", password);
      const res = await fetch(`${API_BASE}/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail ?? "Kullanici adi veya sifre hatali");
      }
      const data = await res.json();
      setToken(data.access_token);
      onLogin();
    } catch (e: any) {
      setError(e?.message ?? "Giris basarisiz");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Radiology-Clean</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Sisteme giris yapin</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Giris</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="Kullanici Adi" required>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  autoFocus
                />
              </FormField>
              <FormField label="Sifre" required>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </FormField>
              {error && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-3 py-2" role="alert">
                  {error}
                </div>
              )}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Giris yapiliyor..." : "Giris Yap"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 mt-4">
          Radiology-Clean Audit v2.1
        </p>
      </div>
    </div>
  );
}

// ── Case List ─────────────────────────────────────────────────────────────────
function CaseList({ onLogout }: { onLogout: () => void }) {
  const [items, setItems] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { onLogout(); return; }
    (async () => {
      try {
        setErr(null);
        const res = await fetch(`${API_BASE}/cases`, {
          headers: authHeaders(),
        });
        if (res.status === 401) {
          clearToken();
          onLogout();
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if ((e?.message ?? "").includes("401")) {
          clearToken();
          onLogout();
          return;
        }
        setErr(e?.message ?? "Fetch error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold dark:text-zinc-100">Vakalar</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Tum vaka listesi</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vaka Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <SkeletonList rows={3} />}
          {err && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-3 py-2" role="alert">
              Hata: {err}
            </div>
          )}
          {!loading && !err && items.length === 0 && (
            <div className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">
              Henuz vaka yok. Ust menuden &quot;Yeni Vaka&quot; ile baslayabilirsiniz.
            </div>
          )}
          {!loading && (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {items.map((c) => (
                <li key={c.case_id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium dark:text-zinc-100">{c.case_id}</div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">{c.decision ?? "-"}</div>
                  </div>
                  <Link href={`/cases/${encodeURIComponent(c.case_id)}`}>
                    <Button variant="secondary">Ac</Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Root Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    setAuthed(!!getToken());
  }, []);

  if (authed === null) return null; // hydration bekleniyor

  if (!authed) return <LoginForm onLogin={() => setAuthed(true)} />;

  return <CaseList onLogout={() => setAuthed(false)} />;
}
