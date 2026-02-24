"use client";

import { use, useEffect, useMemo, useState } from "react";
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
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border ${color}`}>
      {label ?? category}
    </span>
  );
}

function SmallBadge({ category }: { category: string }) {
  const color = LIRADS_COLORS[category] || "bg-zinc-100 text-zinc-800 border-zinc-300";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      {category}
    </span>
  );
}

function AgentReportViewer({ text }: { text: string }) {
  const formatted = text.split("\n").map((line, i) => {
    if (line.startsWith("## ")) {
      return (
        <h2 key={i} className="text-base font-bold text-zinc-900 mt-5 mb-2 border-b border-zinc-200 pb-1">
          {line.slice(3)}
        </h2>
      );
    }
    if (line.startsWith("**") && line.endsWith("**")) {
      return (
        <p key={i} className="font-semibold text-zinc-800 mt-3 mb-1">
          {line.slice(2, -2)}
        </p>
      );
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      return (
        <li key={i} className="ml-4 text-sm text-zinc-700 list-disc">
          {line.slice(2)}
        </li>
      );
    }
    if (line.trim() === "---") {
      return <hr key={i} className="my-3 border-zinc-200" />;
    }
    if (line.trim() === "") {
      return <br key={i} />;
    }
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className="text-sm text-zinc-700 leading-relaxed">
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={j} className="text-zinc-800">{part.slice(2, -2)}</strong>
          ) : (
            <span key={j}>{part}</span>
          )
        )}
      </p>
    );
  });

  return <div className="space-y-0">{formatted}</div>;
}

type VersionEntry = {
  version: number;
  created_at: string;
  created_by: string;
  category: string;
  decision: string;
  previous_hash: string | null;
  signature: string;
};

export default function CaseDetail({ params }: { params: Promise<{ case_id: string }> }) {
  const router = useRouter();
  const { case_id } = use(params);
  const caseId = useMemo(() => decodeURIComponent(case_id), [case_id]);

  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRaw, setShowRaw] = useState(false);

  // Audit trail
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [showVersions, setShowVersions] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace("/login"); return; }

    (async () => {
      try {
        setErr(null);
        setLoading(true);
        const [caseRes, versionsRes] = await Promise.all([
          fetch(`${API}/cases/${encodeURIComponent(caseId)}`, { headers: authHeaders() }),
          fetch(`${API}/cases/${encodeURIComponent(caseId)}/versions`, { headers: authHeaders() }),
        ]);
        if (caseRes.status === 401) { clearToken(); router.replace("/login"); return; }
        if (!caseRes.ok) throw new Error(`HTTP ${caseRes.status}`);
        setData(await caseRes.json());

        if (versionsRes.ok) {
          setVersions(await versionsRes.json());
        }
      } catch (e: any) {
        setErr(e?.message ?? "Fetch error");
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [caseId]);

  const verifyUrl = data?.verify_url as string | undefined;
  const lirads = data?.content?.lirads;
  const agentReport = data?.content?.agent_report as string | undefined;
  const clinicalData = data?.content?.clinical_data;
  const decision = data?.content?.decision;

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    } catch {}
  }

  async function openPdf() {
    const res = await fetch(`${API}/export/pdf/${encodeURIComponent(caseId)}`, {
      headers: authHeaders(),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }

  function openVerify() {
    if (!verifyUrl) return;
    window.open(verifyUrl, "_blank");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-zinc-600 hover:underline">
          &larr; Cases
        </Link>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={copyJson} disabled={!data}>
            JSON Kopyala
          </Button>
          <Button variant="secondary" onClick={openVerify} disabled={!verifyUrl}>
            Verify
          </Button>
          <Button onClick={openPdf} disabled={!data}>PDF</Button>
        </div>
      </div>

      {loading && <div className="text-sm text-zinc-500">Yukleniyor...</div>}
      {err && <div className="text-sm text-red-600">Hata: {err}</div>}

      {!loading && !err && data && (
        <>
          {/* Ozet karti */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Vaka: {caseId}</span>
                {lirads && (
                  <LiradsBadge category={lirads.category} label={lirads.label} />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Karar + meta */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-zinc-500">Karar</div>
                  <div className="text-sm font-medium">{decision ?? "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Olusturulma</div>
                  <div className="text-sm font-medium">{data.generated_at ?? "-"}</div>
                </div>
              </div>

              {/* Klinik bilgiler */}
              {clinicalData && (
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Klinik Bilgiler</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {clinicalData.region && (
                      <div><span className="text-zinc-500">Bolge:</span> {clinicalData.region}</div>
                    )}
                    {clinicalData.age && (
                      <div><span className="text-zinc-500">Yas:</span> {clinicalData.age}</div>
                    )}
                    {clinicalData.gender && (
                      <div><span className="text-zinc-500">Cinsiyet:</span> {clinicalData.gender}</div>
                    )}
                    {clinicalData.indication && (
                      <div className="col-span-2">
                        <span className="text-zinc-500">Endikasyon:</span> {clinicalData.indication}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* LI-RADS detay */}
              {lirads && (
                <div className="bg-zinc-50 border border-zinc-200 rounded-md p-3 space-y-2">
                  <div className="text-xs font-medium text-zinc-600">LI-RADS Detay</div>
                  {lirads.applied_criteria?.length > 0 && (
                    <div className="text-xs text-zinc-500">
                      Uygulanan kriterler: {lirads.applied_criteria.join(", ")}
                    </div>
                  )}
                  {lirads.ancillary_favor_hcc?.length > 0 && (
                    <div className="text-xs text-zinc-500">
                      HCC lehine: {lirads.ancillary_favor_hcc.join(", ")}
                    </div>
                  )}
                  {lirads.ancillary_favor_benign?.length > 0 && (
                    <div className="text-xs text-zinc-500">
                      Benign lehine: {lirads.ancillary_favor_benign.join(", ")}
                    </div>
                  )}
                </div>
              )}

              {/* Imza */}
              <div className="text-xs text-zinc-400">
                Imza: {data.signature?.slice(0, 24)}... | v{data.version ?? 1} | {data.schema}
              </div>
            </CardContent>
          </Card>

          {/* Ajan raporu */}
          {agentReport && (
            <Card>
              <CardHeader>
                <CardTitle>Radyolog Ajan Raporu</CardTitle>
              </CardHeader>
              <CardContent>
                <AgentReportViewer text={agentReport} />
              </CardContent>
            </Card>
          )}

          {/* Audit Trail / Versiyon Gecmisi */}
          {versions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Audit Trail ({versions.length} versiyon)</span>
                  <Button
                    variant="ghost"
                    className="text-xs"
                    onClick={() => setShowVersions(!showVersions)}
                  >
                    {showVersions ? "Gizle" : "Goster"}
                  </Button>
                </CardTitle>
              </CardHeader>
              {showVersions && (
                <CardContent>
                  <div className="space-y-0">
                    {versions.map((v, i) => (
                      <div key={v.version} className="relative pl-6 pb-4">
                        {/* Zincir cizgisi */}
                        {i < versions.length - 1 && (
                          <div className="absolute left-2 top-3 bottom-0 w-0.5 bg-zinc-200" />
                        )}
                        {/* Nokta */}
                        <div className={`absolute left-0.5 top-1.5 w-3 h-3 rounded-full border-2 ${
                          i === 0
                            ? "bg-zinc-800 border-zinc-800"
                            : "bg-white border-zinc-300"
                        }`} />

                        <div className={`rounded-md border p-3 ${
                          i === 0 ? "border-zinc-300 bg-white" : "border-zinc-200 bg-zinc-50"
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-zinc-800">
                                v{v.version}
                              </span>
                              <SmallBadge category={v.category} />
                              {i === 0 && (
                                <span className="text-xs bg-zinc-800 text-white px-1.5 py-0.5 rounded">
                                  guncel
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-zinc-400">
                              {v.created_at?.slice(0, 19).replace("T", " ")}
                            </span>
                          </div>
                          <div className="text-xs text-zinc-600">{v.decision}</div>
                          <div className="flex gap-3 mt-1 text-xs text-zinc-400">
                            {v.created_by && <span>Olusturan: {v.created_by}</span>}
                            <span>Imza: {v.signature}...</span>
                            {v.previous_hash && (
                              <span title={v.previous_hash}>
                                Onceki hash: {v.previous_hash.slice(0, 12)}...
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Raw JSON (toggle) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Ham Veri</span>
                <Button
                  variant="ghost"
                  className="text-xs"
                  onClick={() => setShowRaw(!showRaw)}
                >
                  {showRaw ? "Gizle" : "Goster"}
                </Button>
              </CardTitle>
            </CardHeader>
            {showRaw && (
              <CardContent>
                <pre className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs overflow-auto max-h-96">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </CardContent>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
