"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Breadcrumb from "@/components/Breadcrumb";
import { SkeletonCard } from "@/components/Skeleton";
import { getToken, clearToken, authHeaders } from "@/lib/auth";
import { API_BASE } from "@/lib/constants";

type CaseItem = {
  case_id: string;
  decision?: string;
  created_at?: string;
};

type PatientDetail = {
  patient_id: string;
  full_name: string;
  birth_date?: string;
  gender?: string;
  created_at?: string;
  cases: CaseItem[];
};

const genderLabel = (g?: string) =>
  g === "M" ? "Erkek" : g === "F" ? "Kadin" : "Belirtilmemis";

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ patient_id: string }>;
}) {
  const router = useRouter();
  const { patient_id } = use(params);
  const patientId = useMemo(() => decodeURIComponent(patient_id), [patient_id]);

  const [data, setData] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace("/"); return; }

    (async () => {
      try {
        setErr(null);
        setLoading(true);
        const res = await fetch(
          `${API_BASE}/patients/${encodeURIComponent(patientId)}`,
          { headers: authHeaders() }
        );
        if (res.status === 401) { clearToken(); router.replace("/"); return; }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (e: any) {
        setErr(e?.message ?? "Yukleme hatasi");
      } finally {
        setLoading(false);
      }
    })();
  }, [patientId]);

  return (
    <div className="space-y-4">
      <Breadcrumb items={[
        { label: "Ana Sayfa", href: "/" },
        { label: "Hastalar", href: "/patients" },
        { label: patientId },
      ]} />

      {loading && <><SkeletonCard /><SkeletonCard /></>}
      {err && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-3 py-2" role="alert">
          Hata: {err}
        </div>
      )}

      {!loading && !err && data && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{data.full_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-zinc-500 dark:text-zinc-400">Hasta ID</div>
                  <div className="font-medium font-mono dark:text-zinc-100">{data.patient_id}</div>
                </div>
                <div>
                  <div className="text-zinc-500 dark:text-zinc-400">Cinsiyet</div>
                  <div className="font-medium dark:text-zinc-100">{genderLabel(data.gender)}</div>
                </div>
                <div>
                  <div className="text-zinc-500 dark:text-zinc-400">Dogum Tarihi</div>
                  <div className="font-medium dark:text-zinc-100">{data.birth_date ?? "-"}</div>
                </div>
                <div>
                  <div className="text-zinc-500 dark:text-zinc-400">Kayit Tarihi</div>
                  <div className="font-medium dark:text-zinc-100">
                    {data.created_at
                      ? new Date(data.created_at).toLocaleDateString("tr-TR")
                      : "-"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Vakalar ({data.cases.length})</CardTitle>
                <Link href="/new">
                  <Button>+ Yeni Analiz</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {data.cases.length === 0 ? (
                <div className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">
                  Bu hastaya ait vaka yok.
                </div>
              ) : (
                <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {data.cases.map((c) => (
                    <li
                      key={c.case_id}
                      className="py-3 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium dark:text-zinc-100">{c.case_id}</div>
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                          {c.decision ?? "-"}
                          {c.created_at
                            ? ` · ${new Date(c.created_at).toLocaleDateString("tr-TR")}`
                            : ""}
                        </div>
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
        </>
      )}
    </div>
  );
}
