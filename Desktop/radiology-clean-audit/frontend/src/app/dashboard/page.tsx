"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getToken, clearToken, authHeaders } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

const LIRADS_COLORS: Record<string, string> = {
  "LR-1": "bg-green-100 text-green-800 border-green-300",
  "LR-2": "bg-green-50 text-green-700 border-green-200",
  "LR-3": "bg-yellow-50 text-yellow-800 border-yellow-300",
  "LR-4": "bg-orange-50 text-orange-800 border-orange-300",
  "LR-5": "bg-red-50 text-red-800 border-red-300",
  "LR-M": "bg-purple-50 text-purple-800 border-purple-300",
  "LR-TIV": "bg-red-100 text-red-900 border-red-400",
};

const LIRADS_ORDER = ["LR-1", "LR-2", "LR-3", "LR-4", "LR-5", "LR-M", "LR-TIV"];

function LiradsBadge({ category }: { category: string }) {
  const color = LIRADS_COLORS[category] || "bg-zinc-100 text-zinc-800 border-zinc-300";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      {category}
    </span>
  );
}

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
        const res = await fetch(`${API}/stats`, { headers: authHeaders() });
        if (res.status === 401) {
          clearToken();
          router.replace("/");
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setStats(await res.json());
      } catch (e: any) {
        setErr(e?.message ?? "Fetch error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const dist = stats?.lirads_distribution ?? {};
  const maxCount = Math.max(1, ...Object.values(dist));

  return (
    <div className="space-y-6">
      {/* Baslik */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-zinc-600 hover:underline">
            &larr; Ana Sayfa
          </Link>
          <h1 className="text-xl font-semibold mt-1">Dashboard</h1>
          <p className="text-sm text-zinc-500">LI-RADS istatistikleri ve genel bakis</p>
        </div>
      </div>

      {loading && <div className="text-sm text-zinc-500">Yukleniyor...</div>}
      {err && <div className="text-sm text-red-600">Hata: {err}</div>}

      {!loading && !err && stats && (
        <>
          {/* Ozet kartlari */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-zinc-900">{stats.total_cases}</div>
                <div className="text-sm text-zinc-500">Toplam Vaka</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-zinc-900">{stats.total_patients}</div>
                <div className="text-sm text-zinc-500">Toplam Hasta</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-red-700">{stats.high_risk_cases.length}</div>
                <div className="text-sm text-zinc-500">Yuksek Riskli</div>
                <div className="text-xs text-zinc-400">LR-4, LR-5, LR-M, LR-TIV</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-zinc-900">
                  {Object.keys(dist).length}
                </div>
                <div className="text-sm text-zinc-500">Farkli Kategori</div>
              </CardContent>
            </Card>
          </div>

          {/* LI-RADS Dagilimi */}
          <Card>
            <CardHeader>
              <CardTitle>LI-RADS Dagilimi</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(dist).length === 0 ? (
                <div className="text-sm text-zinc-500">Henuz veri yok</div>
              ) : (
                <div className="space-y-3">
                  {LIRADS_ORDER.map((cat) => {
                    const count = dist[cat] ?? 0;
                    if (count === 0 && !(cat in dist)) return null;
                    const pct = (count / maxCount) * 100;
                    const barColor =
                      cat === "LR-5" || cat === "LR-TIV"
                        ? "bg-red-400"
                        : cat === "LR-4"
                        ? "bg-orange-400"
                        : cat === "LR-M"
                        ? "bg-purple-400"
                        : cat === "LR-3"
                        ? "bg-yellow-400"
                        : "bg-green-400";
                    return (
                      <div key={cat} className="flex items-center gap-3">
                        <div className="w-16 flex-shrink-0">
                          <LiradsBadge category={cat} />
                        </div>
                        <div className="flex-1">
                          <div className="h-6 bg-zinc-100 rounded-md overflow-hidden">
                            <div
                              className={`h-full ${barColor} rounded-md transition-all duration-500`}
                              style={{ width: `${Math.max(pct, 2)}%` }}
                            />
                          </div>
                        </div>
                        <div className="w-8 text-right text-sm font-medium text-zinc-700">
                          {count}
                        </div>
                      </div>
                    );
                  })}
                  {/* Bilinmeyen kategoriler */}
                  {Object.entries(dist)
                    .filter(([cat]) => !LIRADS_ORDER.includes(cat))
                    .map(([cat, count]) => (
                      <div key={cat} className="flex items-center gap-3">
                        <div className="w-16 flex-shrink-0">
                          <LiradsBadge category={cat} />
                        </div>
                        <div className="flex-1">
                          <div className="h-6 bg-zinc-100 rounded-md overflow-hidden">
                            <div
                              className="h-full bg-zinc-400 rounded-md"
                              style={{ width: `${Math.max((count / maxCount) * 100, 2)}%` }}
                            />
                          </div>
                        </div>
                        <div className="w-8 text-right text-sm font-medium text-zinc-700">
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
            <Card>
              <CardHeader>
                <CardTitle>Yuksek Riskli Vakalar</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-zinc-200">
                  {stats.high_risk_cases.map((c) => (
                    <li key={c.case_id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <LiradsBadge category={c.category} />
                        <div>
                          <div className="text-sm font-medium text-zinc-800">{c.case_id}</div>
                          <div className="text-xs text-zinc-500">{c.decision}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-xs text-zinc-400">{c.created_at?.slice(0, 10)}</div>
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
              <CardTitle>Son Vakalar</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recent_cases.length === 0 ? (
                <div className="text-sm text-zinc-500">Henuz vaka yok</div>
              ) : (
                <ul className="divide-y divide-zinc-200">
                  {stats.recent_cases.map((c) => (
                    <li key={c.case_id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <LiradsBadge category={c.category} />
                        <div>
                          <div className="text-sm font-medium text-zinc-800">{c.case_id}</div>
                          <div className="text-xs text-zinc-500">
                            {c.decision} {c.patient_id ? `| Hasta: ${c.patient_id}` : ""}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-xs text-zinc-400">
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
