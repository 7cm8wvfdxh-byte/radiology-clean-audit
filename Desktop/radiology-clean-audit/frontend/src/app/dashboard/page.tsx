"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import LiradsBadge from "@/components/LiradsBadge";
import Breadcrumb from "@/components/Breadcrumb";
import { SkeletonStats, SkeletonCard } from "@/components/Skeleton";
import { getToken, clearToken, authHeaders } from "@/lib/auth";
import { API_BASE, LIRADS_ORDER } from "@/lib/constants";
import { getErrorMessage } from "@/lib/errors";

type Stats = {
  total_cases: number;
  total_patients: number;
  lirads_distribution: Record<string, number>;
  recent_cases: {
    case_id: string;
    created_at: string;
    created_by: string;
    patient_id: string | null;
    category: string;
    decision: string;
  }[];
  high_risk_cases: {
    case_id: string;
    created_at: string;
    created_by: string;
    patient_id: string | null;
    category: string;
    decision: string;
  }[];
};

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
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
        setErr(null);
        const res = await fetch(`${API_BASE}/stats`, { headers: authHeaders() });
        if (res.status === 401) {
          clearToken();
          router.replace("/");
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setStats(await res.json());
      } catch (e: unknown) {
        setErr(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const dist = stats?.lirads_distribution ?? {};
  const maxCount = Math.max(1, ...Object.values(dist));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Breadcrumb items={[{ label: "Ana Sayfa", href: "/" }, { label: "Dashboard" }]} />
        <h1 className="text-2xl font-bold mt-2 dark:text-zinc-100 tracking-tight">Dashboard</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">LI-RADS istatistikleri ve genel bakis</p>
      </div>

      {loading && (
        <div className="space-y-6">
          <SkeletonStats />
          <SkeletonCard />
        </div>
      )}
      {err && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2.5 flex items-center gap-2" role="alert">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Hata: {err}
        </div>
      )}

      {!loading && !err && stats && (
        <>
          {/* Ozet kartlari */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{stats.total_cases}</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Toplam Vaka</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{stats.total_patients}</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Toplam Hasta</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-red-700 dark:text-red-400">{stats.high_risk_cases.length}</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Yuksek Riskli</div>
                <div className="text-xs text-zinc-400 dark:text-zinc-500">LR-4, LR-5, LR-M, LR-TIV</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                  {Object.keys(dist).length}
                </div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Farkli Kategori</div>
              </CardContent>
            </Card>
          </div>

          {/* LI-RADS Dagilimi */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                LI-RADS Dagilimi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(dist).length === 0 ? (
                <div className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-6">Henuz veri yok</div>
              ) : (
                <div className="space-y-3">
                  {LIRADS_ORDER.map((cat) => {
                    const count = dist[cat] ?? 0;
                    if (count === 0 && !(cat in dist)) return null;
                    const pct = (count / maxCount) * 100;
                    const barColor =
                      cat === "LR-5" || cat === "LR-TIV"
                        ? "bg-gradient-to-r from-red-400 to-red-500"
                        : cat === "LR-4"
                        ? "bg-gradient-to-r from-orange-400 to-orange-500"
                        : cat === "LR-M"
                        ? "bg-gradient-to-r from-purple-400 to-purple-500"
                        : cat === "LR-3"
                        ? "bg-gradient-to-r from-amber-400 to-yellow-500"
                        : "bg-gradient-to-r from-emerald-400 to-green-500";
                    return (
                      <div key={cat} className="flex items-center gap-3">
                        <div className="w-20 flex-shrink-0">
                          <LiradsBadge category={cat} />
                        </div>
                        <div className="flex-1">
                          <div className="h-7 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden">
                            <div
                              className={`h-full ${barColor} rounded-lg transition-all duration-700 ease-out`}
                              style={{ width: `${Math.max(pct, 3)}%` }}
                            />
                          </div>
                        </div>
                        <div className="w-10 text-right text-sm font-bold text-zinc-700 dark:text-zinc-300">
                          {count}
                        </div>
                      </div>
                    );
                  })}
                  {Object.entries(dist)
                    .filter(([cat]) => !LIRADS_ORDER.includes(cat))
                    .map(([cat, count]) => (
                      <div key={cat} className="flex items-center gap-3">
                        <div className="w-20 flex-shrink-0">
                          <LiradsBadge category={cat} />
                        </div>
                        <div className="flex-1">
                          <div className="h-7 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-zinc-400 to-zinc-500 rounded-lg"
                              style={{ width: `${Math.max((count / maxCount) * 100, 3)}%` }}
                            />
                          </div>
                        </div>
                        <div className="w-10 text-right text-sm font-bold text-zinc-700 dark:text-zinc-300">
                          {count}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Yuksek Riskli Vakalar */}
          {stats.high_risk_cases.length > 0 && (
            <Card className="border-red-200/60 dark:border-red-800/40">
              <CardHeader className="bg-red-50/30 dark:bg-red-900/10">
                <CardTitle className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Yuksek Riskli Vakalar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {stats.high_risk_cases.map((c) => (
                    <li key={c.case_id} className="py-3 flex items-center justify-between hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 -mx-5 px-5 transition-colors">
                      <div className="flex items-center gap-3">
                        <LiradsBadge category={c.category} />
                        <div>
                          <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{c.case_id}</div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">{c.decision}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-xs text-zinc-400 dark:text-zinc-500">{c.created_at?.slice(0, 10)}</div>
                        <Link href={`/cases/${encodeURIComponent(c.case_id)}`}>
                          <Button variant="secondary" className="text-xs">
                            Ac
                          </Button>
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Son Vakalar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Son Vakalar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recent_cases.length === 0 ? (
                <div className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-6">Henuz vaka yok</div>
              ) : (
                <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {stats.recent_cases.map((c) => (
                    <li key={c.case_id} className="py-3 flex items-center justify-between hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 -mx-5 px-5 transition-colors">
                      <div className="flex items-center gap-3">
                        <LiradsBadge category={c.category} />
                        <div>
                          <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{c.case_id}</div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            {c.decision} {c.patient_id ? `| Hasta: ${c.patient_id}` : ""}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-xs text-zinc-400 dark:text-zinc-500">
                          {c.created_by && <span>{c.created_by} · </span>}
                          {c.created_at?.slice(0, 10)}
                        </div>
                        <Link href={`/cases/${encodeURIComponent(c.case_id)}`}>
                          <Button variant="secondary" className="text-xs">
                            Ac
                          </Button>
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
