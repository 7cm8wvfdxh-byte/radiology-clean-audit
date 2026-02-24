"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import LiradsBadge from "@/components/LiradsBadge";
import { getToken, clearToken, authHeaders } from "@/lib/auth";
import { API_BASE } from "@/lib/constants";

type CaseItem = {
  case_id: string;
  decision?: string;
  category?: string;
  created_at?: string;
};

export default function CasesPage() {
  const router = useRouter();
  const [items, setItems] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/");
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/cases`, {
          headers: authHeaders(),
        });
        if (res.status === 401) {
          clearToken();
          router.replace("/");
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : "Veri alinamadi");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-zinc-600 hover:underline">
            &larr; Ana Sayfa
          </Link>
          <h1 className="text-xl font-semibold mt-1">Tum Vakalar</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vaka Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-sm text-zinc-500">Yukleniyor...</div>}
          {err && <div className="text-sm text-red-600">Hata: {err}</div>}
          {!loading && !err && items.length === 0 && (
            <div className="text-sm text-zinc-500">Henuz vaka yok.</div>
          )}
          <ul className="divide-y divide-zinc-200">
            {items.map((c) => (
              <li key={c.case_id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {c.category && <LiradsBadge category={c.category} />}
                  <div>
                    <div className="font-medium">{c.case_id}</div>
                    <div className="text-sm text-zinc-600">{c.decision ?? "-"}</div>
                  </div>
                </div>
                <Link href={`/cases/${encodeURIComponent(c.case_id)}`}>
                  <Button variant="secondary">Ac</Button>
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
