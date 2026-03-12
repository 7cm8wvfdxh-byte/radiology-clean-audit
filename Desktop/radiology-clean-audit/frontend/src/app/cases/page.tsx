"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import LiradsBadge from "@/components/LiradsBadge";
import Breadcrumb from "@/components/Breadcrumb";
import { SkeletonList } from "@/components/Skeleton";
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumb items={[{ label: "Ana Sayfa", href: "/" }, { label: "Vakalar" }]} />
          <h1 className="text-2xl font-bold mt-2 dark:text-zinc-100 tracking-tight">Tum Vakalar</h1>
        </div>
        <Link href="/new">
          <Button>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Vaka
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Vaka Listesi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <SkeletonList rows={5} />}
          {err && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2.5 flex items-center gap-2" role="alert">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Hata: {err}
            </div>
          )}
          {!loading && !err && items.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Henuz vaka yok.</p>
            </div>
          )}
          {!loading && (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {items.map((c) => (
                <li key={c.case_id} className="py-3.5 flex items-center justify-between hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 -mx-5 px-5 transition-colors">
                  <div className="flex items-center gap-3">
                    {c.category ? (
                      <LiradsBadge category={c.category} />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{c.case_id}</div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">{c.decision ?? "-"}</div>
                    </div>
                  </div>
                  <Link href={`/cases/${encodeURIComponent(c.case_id)}`}>
                    <Button variant="secondary" className="text-xs">Ac</Button>
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
