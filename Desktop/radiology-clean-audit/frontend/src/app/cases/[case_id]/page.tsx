"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import LiradsBadge from "@/components/LiradsBadge";
import Breadcrumb from "@/components/Breadcrumb";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { SkeletonCard } from "@/components/Skeleton";
import { getToken, clearToken, authHeaders } from "@/lib/auth";
import { API_BASE } from "@/lib/constants";
import { getErrorMessage } from "@/lib/errors";
import type { AuditPack } from "@/types/audit";

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

  const [data, setData] = useState<AuditPack | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRaw, setShowRaw] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  // Audit trail
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [showVersions, setShowVersions] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace("/"); return; }

    (async () => {
      try {
        setErr(null);
        setLoading(true);
        const [caseRes, versionsRes] = await Promise.all([
          fetch(`${API_BASE}/cases/${encodeURIComponent(caseId)}`, { headers: authHeaders() }),
          fetch(`${API_BASE}/cases/${encodeURIComponent(caseId)}/versions`, { headers: authHeaders() }),
        ]);
        if (caseRes.status === 401) { clearToken(); router.replace("/"); return; }
        if (!caseRes.ok) throw new Error(`HTTP ${caseRes.status}`);
        setData(await caseRes.json());

        if (versionsRes.ok) {
          setVersions(await versionsRes.json());
        }
      } catch (e: unknown) {
        setErr(getErrorMessage(e));
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
      setCopyStatus("Kopyalandi!");
    } catch {
      setCopyStatus("Kopyalanamadi");
    }
    setTimeout(() => setCopyStatus(null), 2000);
  }

  async function openPdf() {
    const res = await fetch(`${API_BASE}/export/pdf/${encodeURIComponent(caseId)}`, {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <Breadcrumb items={[{ label: "Ana Sayfa", href: "/" }, { label: "Vakalar", href: "/cases" }, { label: caseId }]} />

        <div className="flex gap-2">
          <Button variant="secondary" onClick={copyJson} disabled={!data}>
            {copyStatus ?? "JSON Kopyala"}
          </Button>
          <Button variant="secondary" onClick={openVerify} disabled={!verifyUrl}>
            Verify
          </Button>
          <Button onClick={openPdf} disabled={!data}>PDF</Button>
        </div>
      </div>

      {loading && <><SkeletonCard /><SkeletonCard /></>}
      {err && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-3 py-2" role="alert">
          Hata: {err}
        </div>
      )}

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
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Karar</div>
                  <div className="text-sm font-medium dark:text-zinc-100">{decision ?? "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Olusturulma</div>
                  <div className="text-sm font-medium dark:text-zinc-100">{data.generated_at ?? "-"}</div>
                </div>
              </div>

              {/* Klinik bilgiler */}
              {clinicalData && (
                <div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Klinik Bilgiler</div>
                  <div className="grid grid-cols-2 gap-2 text-sm dark:text-zinc-300">
                    {clinicalData.region && (
                      <div><span className="text-zinc-500 dark:text-zinc-400">Bolge:</span> {clinicalData.region}</div>
                    )}
                    {clinicalData.age && (
                      <div><span className="text-zinc-500 dark:text-zinc-400">Yas:</span> {clinicalData.age}</div>
                    )}
                    {clinicalData.gender && (
                      <div><span className="text-zinc-500 dark:text-zinc-400">Cinsiyet:</span> {clinicalData.gender}</div>
                    )}
                    {clinicalData.indication && (
                      <div className="col-span-2">
                        <span className="text-zinc-500 dark:text-zinc-400">Endikasyon:</span> {clinicalData.indication}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* LI-RADS detay */}
              {lirads && (
                <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-md p-3 space-y-2">
                  <div className="text-xs font-medium text-zinc-600 dark:text-zinc-300">LI-RADS Detay</div>
                  {lirads.applied_criteria?.length > 0 && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      Uygulanan kriterler: {lirads.applied_criteria.join(", ")}
                    </div>
                  )}
                  {lirads.ancillary_favor_hcc?.length > 0 && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      HCC lehine: {lirads.ancillary_favor_hcc.join(", ")}
                    </div>
                  )}
                  {lirads.ancillary_favor_benign?.length > 0 && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      Benign lehine: {lirads.ancillary_favor_benign.join(", ")}
                    </div>
                  )}
                </div>
              )}

              {/* Imza */}
              <div className="text-xs text-zinc-400 dark:text-zinc-500">
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
                <MarkdownRenderer text={agentReport} />
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
                          <div className="absolute left-2 top-3 bottom-0 w-0.5 bg-zinc-200 dark:bg-zinc-700" />
                        )}
                        {/* Nokta */}
                        <div className={`absolute left-0.5 top-1.5 w-3 h-3 rounded-full border-2 ${
                          i === 0
                            ? "bg-zinc-800 border-zinc-800 dark:bg-zinc-200 dark:border-zinc-200"
                            : "bg-white border-zinc-300 dark:bg-zinc-900 dark:border-zinc-600"
                        }`} />

                        <div className={`rounded-md border p-3 ${
                          i === 0
                            ? "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-800"
                            : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50"
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                                v{v.version}
                              </span>
                              <LiradsBadge category={v.category} />
                              {i === 0 && (
                                <span className="text-xs bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-800 px-1.5 py-0.5 rounded">
                                  guncel
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-zinc-400 dark:text-zinc-500">
                              {v.created_at?.slice(0, 19).replace("T", " ")}
                            </span>
                          </div>
                          <div className="text-xs text-zinc-600 dark:text-zinc-400">{v.decision}</div>
                          <div className="flex gap-3 mt-1 text-xs text-zinc-400 dark:text-zinc-500">
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
                <pre className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-3 text-xs overflow-auto max-h-96 dark:text-zinc-300">
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
