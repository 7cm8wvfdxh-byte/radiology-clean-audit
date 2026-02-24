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

function LiradsBadge({ category, label }: { category: string; label?: string }) {
  const color = LIRADS_COLORS[category] || "bg-zinc-100 text-zinc-800 border-zinc-300";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${color}`}>
      {label ?? category}
    </span>
  );
}

type CaseItem = {
  case_id: string;
  created_at?: string;
  decision?: string;
};

function CasePanel({ data, label }: { data: any; label: string }) {
  if (!data) {
    return (
      <Card className="flex-1">
        <CardContent className="pt-4">
          <div className="text-sm text-zinc-400 text-center py-8">
            {label} secilmedi
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
      <CardContent className="space-y-3">
        {/* Karar */}
        <div>
          <div className="text-xs text-zinc-500">Karar</div>
          <div className="text-sm font-medium">{content.decision ?? "-"}</div>
        </div>

        {/* Tarih & versiyon */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-xs text-zinc-500">Tarih</div>
            <div className="text-xs font-mono">{data.generated_at?.slice(0, 19)}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500">Versiyon</div>
            <div className="text-xs">v{data.version ?? 1}</div>
          </div>
        </div>

        {/* DSL ozellikleri */}
        <div>
          <div className="text-xs text-zinc-500 mb-1">Lezyon Ozellikleri</div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">APHE:</span>
              <span className={dsl.arterial_phase?.hyperenhancement ? "text-red-600 font-medium" : "text-zinc-400"}>
                {dsl.arterial_phase?.hyperenhancement ? "Var" : "Yok"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Washout:</span>
              <span className={dsl.portal_phase?.washout ? "text-red-600 font-medium" : "text-zinc-400"}>
                {dsl.portal_phase?.washout ? "Var" : "Yok"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Kapsul:</span>
              <span className={dsl.delayed_phase?.capsule ? "text-red-600 font-medium" : "text-zinc-400"}>
                {dsl.delayed_phase?.capsule ? "Var" : "Yok"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Boyut:</span>
              <span className="font-medium">{dsl.lesion_size_mm ?? 0} mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Siroz:</span>
              <span className={dsl.cirrhosis ? "text-amber-600 font-medium" : "text-zinc-400"}>
                {dsl.cirrhosis ? "Var" : "Yok"}
              </span>
            </div>
            {dsl.rim_aphe && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Rim APHE:</span>
                <span className="text-purple-600 font-medium">Var</span>
              </div>
            )}
            {dsl.tumor_in_vein && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Tumor in Vein:</span>
                <span className="text-red-700 font-medium">Var</span>
              </div>
            )}
            {dsl.infiltrative && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Infiltratif:</span>
                <span className="text-purple-600 font-medium">Var</span>
              </div>
            )}
          </div>
        </div>

        {/* Uygulanan kriterler */}
        {lirads.applied_criteria?.length > 0 && (
          <div>
            <div className="text-xs text-zinc-500 mb-1">Uygulanan Kriterler</div>
            <div className="flex flex-wrap gap-1">
              {lirads.applied_criteria.map((c: string) => (
                <span key={c} className="text-xs bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Klinik bilgiler */}
        {clinicalData && (
          <div>
            <div className="text-xs text-zinc-500 mb-1">Klinik</div>
            <div className="text-xs text-zinc-600 space-y-0.5">
              {clinicalData.age && <div>Yas: {clinicalData.age}</div>}
              {clinicalData.gender && <div>Cinsiyet: {clinicalData.gender}</div>}
              {clinicalData.indication && <div>Endikasyon: {clinicalData.indication}</div>}
            </div>
          </div>
        )}

        {/* Imza */}
        <div className="text-xs text-zinc-400 font-mono">
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
  const [dataA, setDataA] = useState<any>(null);
  const [dataB, setDataB] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace("/"); return; }

    (async () => {
      try {
        const res = await fetch(`${API}/cases?limit=100`, { headers: authHeaders() });
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
      const res = await fetch(`${API}/cases/${encodeURIComponent(caseId)}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (side === "a") setDataA(data);
      else setDataB(data);
    } catch (e: any) {
      setErr(e?.message ?? "Yuklenemedi");
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
    <div className="space-y-5">
      <div>
        <Link href="/" className="text-sm text-zinc-600 hover:underline">
          &larr; Ana Sayfa
        </Link>
        <h1 className="text-xl font-semibold mt-1">Vaka Karsilastirma</h1>
        <p className="text-sm text-zinc-500">Iki vakayi yan yana karsilastirin</p>
      </div>

      {/* Secim */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Sol Vaka</label>
          <select
            value={caseIdA}
            onChange={(e) => selectA(e.target.value)}
            className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Secin...</option>
            {cases.map((c) => (
              <option key={c.case_id} value={c.case_id} disabled={c.case_id === caseIdB}>
                {c.case_id} {c.decision ? `(${c.decision})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Sag Vaka</label>
          <select
            value={caseIdB}
            onChange={(e) => selectB(e.target.value)}
            className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Secin...</option>
            {cases.map((c) => (
              <option key={c.case_id} value={c.case_id} disabled={c.case_id === caseIdA}>
                {c.case_id} {c.decision ? `(${c.decision})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {err && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {err}
        </div>
      )}

      {/* Fark ozeti */}
      {dataA && dataB && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {diffs.length === 0 ? "Fark Yok" : `${diffs.length} Fark Bulundu`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {diffs.length === 0 ? (
              <div className="text-sm text-green-700">
                Her iki vaka aynı LI-RADS ozelliklerine sahip.
              </div>
            ) : (
              <ul className="space-y-1">
                {diffs.map((d, i) => (
                  <li key={i} className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                    {d}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* Yan yana paneller */}
      <div className="grid grid-cols-2 gap-4">
        <CasePanel data={dataA} label="Sol vaka" />
        <CasePanel data={dataB} label="Sag vaka" />
      </div>

      {loading && <div className="text-sm text-zinc-500">Vakalar yukleniyor...</div>}
    </div>
  );
}
