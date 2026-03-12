"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import LiradsBadge from "@/components/LiradsBadge";
import Breadcrumb from "@/components/Breadcrumb";
import { SkeletonCard } from "@/components/Skeleton";
import { Select } from "@/components/ui/FormField";
import { getToken, clearToken, authHeaders } from "@/lib/auth";
import { API_BASE } from "@/lib/constants";
import { getErrorMessage } from "@/lib/errors";
import type { AuditPack } from "@/types/audit";

type CaseItem = {
  case_id: string;
  created_at?: string;
  decision?: string;
};

function CasePanel({ data, label }: { data: AuditPack | null; label: string }) {
  if (!data) {
    return (
      <Card className="flex-1">
        <CardContent className="pt-5">
          <div className="text-center py-12">
            <svg className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-zinc-400 dark:text-zinc-500">{label} secilmedi</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const content = data.content || {};
  const lirads = content.lirads || {};
  const dsl = content.dsl || {};
  const clinicalData = content.clinical_data;

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>{data.case_id}</span>
          {lirads.category && (
            <LiradsBadge category={lirads.category} label={lirads.label} />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Karar */}
        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Karar</div>
          <div className="text-sm font-semibold dark:text-zinc-100">{content.decision ?? "-"}</div>
        </div>

        {/* Tarih & versiyon */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Tarih</div>
            <div className="text-xs font-mono dark:text-zinc-300">{data.generated_at?.slice(0, 19)}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Versiyon</div>
            <div className="text-xs dark:text-zinc-300">v{data.version ?? 1}</div>
          </div>
        </div>

        {/* DSL ozellikleri */}
        <div>
          <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">Lezyon Ozellikleri</div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <div className="flex justify-between bg-zinc-50 dark:bg-zinc-800/30 rounded-lg px-2.5 py-1.5">
              <span className="text-zinc-500 dark:text-zinc-400">APHE:</span>
              <span className={dsl.arterial_phase?.hyperenhancement ? "text-red-600 font-bold" : "text-zinc-400 dark:text-zinc-500"}>
                {dsl.arterial_phase?.hyperenhancement ? "Var" : "Yok"}
              </span>
            </div>
            <div className="flex justify-between bg-zinc-50 dark:bg-zinc-800/30 rounded-lg px-2.5 py-1.5">
              <span className="text-zinc-500 dark:text-zinc-400">Washout:</span>
              <span className={dsl.portal_phase?.washout ? "text-red-600 font-bold" : "text-zinc-400 dark:text-zinc-500"}>
                {dsl.portal_phase?.washout ? "Var" : "Yok"}
              </span>
            </div>
            <div className="flex justify-between bg-zinc-50 dark:bg-zinc-800/30 rounded-lg px-2.5 py-1.5">
              <span className="text-zinc-500 dark:text-zinc-400">Kapsul:</span>
              <span className={dsl.delayed_phase?.capsule ? "text-red-600 font-bold" : "text-zinc-400 dark:text-zinc-500"}>
                {dsl.delayed_phase?.capsule ? "Var" : "Yok"}
              </span>
            </div>
            <div className="flex justify-between bg-zinc-50 dark:bg-zinc-800/30 rounded-lg px-2.5 py-1.5">
              <span className="text-zinc-500 dark:text-zinc-400">Boyut:</span>
              <span className="font-bold dark:text-zinc-200">{dsl.lesion_size_mm ?? 0} mm</span>
            </div>
            <div className="flex justify-between bg-zinc-50 dark:bg-zinc-800/30 rounded-lg px-2.5 py-1.5">
              <span className="text-zinc-500 dark:text-zinc-400">Siroz:</span>
              <span className={dsl.cirrhosis ? "text-amber-600 font-bold" : "text-zinc-400 dark:text-zinc-500"}>
                {dsl.cirrhosis ? "Var" : "Yok"}
              </span>
            </div>
            {dsl.rim_aphe && (
              <div className="flex justify-between bg-zinc-50 dark:bg-zinc-800/30 rounded-lg px-2.5 py-1.5">
                <span className="text-zinc-500 dark:text-zinc-400">Rim APHE:</span>
                <span className="text-purple-600 font-bold">Var</span>
              </div>
            )}
            {dsl.tumor_in_vein && (
              <div className="flex justify-between bg-zinc-50 dark:bg-zinc-800/30 rounded-lg px-2.5 py-1.5">
                <span className="text-zinc-500 dark:text-zinc-400">Tumor in Vein:</span>
                <span className="text-red-700 font-bold">Var</span>
              </div>
            )}
            {dsl.infiltrative && (
              <div className="flex justify-between bg-zinc-50 dark:bg-zinc-800/30 rounded-lg px-2.5 py-1.5">
                <span className="text-zinc-500 dark:text-zinc-400">Infiltratif:</span>
                <span className="text-purple-600 font-bold">Var</span>
              </div>
            )}
          </div>
        </div>

        {/* Uygulanan kriterler */}
        {lirads.applied_criteria?.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">Uygulanan Kriterler</div>
            <div className="flex flex-wrap gap-1.5">
              {lirads.applied_criteria.map((c: string) => (
                <span key={c} className="text-xs bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-medium">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Klinik bilgiler */}
        {clinicalData && (
          <div>
            <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Klinik</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-300 space-y-0.5">
              {clinicalData.age && <div>Yas: {clinicalData.age}</div>}
              {clinicalData.gender && <div>Cinsiyet: {clinicalData.gender}</div>}
              {clinicalData.indication && <div>Endikasyon: {clinicalData.indication}</div>}
            </div>
          </div>
        )}

        {/* Imza */}
        <div className="text-xs text-zinc-400 dark:text-zinc-500 font-mono flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          {data.signature?.slice(0, 16)}...
        </div>
      </CardContent>
    </Card>
  );
}

export default function ComparePage() {
  const router = useRouter();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [caseIdA, setCaseIdA] = useState("");
  const [caseIdB, setCaseIdB] = useState("");
  const [dataA, setDataA] = useState<AuditPack | null>(null);
  const [dataB, setDataB] = useState<AuditPack | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace("/"); return; }

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/cases?limit=100`, { headers: authHeaders() });
        if (res.status === 401) { clearToken(); router.replace("/"); return; }
        if (!res.ok) return;
        const data = await res.json();
        setCases(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function loadCase(caseId: string, side: "a" | "b") {
    if (!caseId) {
      if (side === "a") setDataA(null);
      else setDataB(null);
      return;
    }
    setErr(null);
    try {
      const res = await fetch(`${API_BASE}/cases/${encodeURIComponent(caseId)}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (side === "a") setDataA(data);
      else setDataB(data);
    } catch (e: unknown) {
      setErr(getErrorMessage(e));
    }
  }

  function selectA(id: string) {
    setCaseIdA(id);
    loadCase(id, "a");
  }

  function selectB(id: string) {
    setCaseIdB(id);
    loadCase(id, "b");
  }

  // Fark hesaplama
  const diffs: string[] = [];
  if (dataA && dataB) {
    const dslA = dataA.content?.dsl || {};
    const dslB = dataB.content?.dsl || {};
    const catA = dataA.content?.lirads?.category;
    const catB = dataB.content?.lirads?.category;

    if (catA !== catB) diffs.push(`Kategori: ${catA} vs ${catB}`);
    if (dslA.lesion_size_mm !== dslB.lesion_size_mm)
      diffs.push(`Boyut: ${dslA.lesion_size_mm}mm vs ${dslB.lesion_size_mm}mm`);
    if (dslA.arterial_phase?.hyperenhancement !== dslB.arterial_phase?.hyperenhancement)
      diffs.push("APHE durumu farkli");
    if (dslA.portal_phase?.washout !== dslB.portal_phase?.washout)
      diffs.push("Washout durumu farkli");
    if (dslA.delayed_phase?.capsule !== dslB.delayed_phase?.capsule)
      diffs.push("Kapsul durumu farkli");
    if (dslA.cirrhosis !== dslB.cirrhosis)
      diffs.push("Siroz durumu farkli");
    if (dslA.rim_aphe !== dslB.rim_aphe)
      diffs.push("Rim APHE durumu farkli");
    if (dslA.tumor_in_vein !== dslB.tumor_in_vein)
      diffs.push("Tumor in Vein durumu farkli");
    if (dslA.infiltrative !== dslB.infiltrative)
      diffs.push("Infiltratif durum farkli");
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Breadcrumb items={[{ label: "Ana Sayfa", href: "/" }, { label: "Karsilastirma" }]} />
        <h1 className="text-2xl font-bold mt-2 dark:text-zinc-100 tracking-tight">Vaka Karsilastirma</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Iki vakayi yan yana karsilastirin</p>
      </div>

      {/* Secim */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="select-left" className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Sol Vaka</label>
          <Select
            id="select-left"
            value={caseIdA}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => selectA(e.target.value)}
          >
            <option value="">Secin...</option>
            {cases.map((c) => (
              <option key={c.case_id} value={c.case_id} disabled={c.case_id === caseIdB}>
                {c.case_id} {c.decision ? `(${c.decision})` : ""}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="select-right" className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Sag Vaka</label>
          <Select
            id="select-right"
            value={caseIdB}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => selectB(e.target.value)}
          >
            <option value="">Secin...</option>
            {cases.map((c) => (
              <option key={c.case_id} value={c.case_id} disabled={c.case_id === caseIdA}>
                {c.case_id} {c.decision ? `(${c.decision})` : ""}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {err && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2.5 flex items-center gap-2" role="alert">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {err}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* Fark ozeti */}
      {dataA && dataB && (
        <Card className={diffs.length === 0 ? "border-emerald-200/60 dark:border-emerald-800/40" : "border-amber-200/60 dark:border-amber-800/40"}>
          <CardHeader className={diffs.length === 0 ? "bg-emerald-50/30 dark:bg-emerald-900/10" : "bg-amber-50/30 dark:bg-amber-900/10"}>
            <CardTitle className="flex items-center gap-2">
              {diffs.length === 0 ? (
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
              {diffs.length === 0 ? "Fark Yok" : `${diffs.length} Fark Bulundu`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {diffs.length === 0 ? (
              <div className="text-sm text-emerald-700 dark:text-emerald-400">
                Her iki vaka ayni LI-RADS ozelliklerine sahip.
              </div>
            ) : (
              <ul className="space-y-1.5">
                {diffs.map((d, i) => (
                  <li key={i} className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                    </svg>
                    {d}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* Yan yana paneller */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CasePanel data={dataA} label="Sol vaka" />
        <CasePanel data={dataB} label="Sag vaka" />
      </div>
    </div>
  );
}
