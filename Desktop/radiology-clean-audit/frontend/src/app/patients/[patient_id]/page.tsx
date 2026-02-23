"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getToken, clearToken, authHeaders } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

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
  g === "M" ? "Erkek" : g === "F" ? "Kadın" : "Belirtilmemiş";

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ patient_id: string }>;
}) {
  const router = useRouter();
  const { patient_id } = use(params);
  const patientId = decodeURIComponent(patient_id);

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
          `${API}/patients/${encodeURIComponent(patientId)}`,
          { headers: authHeaders() }
        );
        if (res.status === 401) { clearToken(); router.replace("/"); return; }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (e: any) {
        setErr(e?.message ?? "Yükleme hatası");
      } finally {
        setLoading(false);
      }
    })();
  }, [patientId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/patients" className="text-sm text-zinc-600 hover:underline">
          ← Hastalar
        </Link>
        <span className="text-zinc-300">/</span>
        <span className="text-sm font-medium">{patientId}</span>
      </div>

      {loading && <div className="text-sm text-zinc-500">Yükleniyor…</div>}
      {err && <div className="text-sm text-red-600">Hata: {err}</div>}

      {data && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{data.full_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-zinc-500">Hasta ID</div>
                  <div className="font-medium font-mono">{data.patient_id}</div>
                </div>
                <div>
                  <div className="text-zinc-500">Cinsiyet</div>
                  <div className="font-medium">{genderLabel(data.gender)}</div>
                </div>
                <div>
                  <div className="text-zinc-500">Doğum Tarihi</div>
                  <div className="font-medium">{data.birth_date ?? "-"}</div>
                </div>
                <div>
                  <div className="text-zinc-500">Kayıt Tarihi</div>
                  <div className="font-medium">
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
                <div className="text-sm text-zinc-500">
                  Bu hastaya ait vaka yok.
                </div>
              ) : (
                <ul className="divide-y divide-zinc-200">
                  {data.cases.map((c) => (
                    <li
                      key={c.case_id}
                      className="py-3 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">{c.case_id}</div>
                        <div className="text-sm text-zinc-500">
                          {c.decision ?? "-"}
                          {c.created_at
                            ? ` · ${new Date(c.created_at).toLocaleDateString("tr-TR")}`
                            : ""}
                        </div>
                      </div>
                      <Link href={`/cases/${encodeURIComponent(c.case_id)}`}>
                        <Button variant="secondary">Aç</Button>
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
