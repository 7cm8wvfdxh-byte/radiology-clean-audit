"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getToken, clearToken, authHeaders } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export default function CaseDetail({ params }: { params: Promise<{ case_id: string }> }) {
  const router = useRouter();
  const { case_id } = use(params);
  const caseId = useMemo(() => decodeURIComponent(case_id), [case_id]);

  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace("/login"); return; }

    (async () => {
      try {
        setErr(null);
        setLoading(true);
        const res = await fetch(`${API}/cases/${encodeURIComponent(caseId)}`, {
          headers: authHeaders(),
        });
        if (res.status === 401) { clearToken(); router.replace("/login"); return; }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (e: any) {
        setErr(e?.message ?? "Fetch error");
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [caseId]);

  const verifyUrl = data?.verify_url as string | undefined;

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      alert("JSON kopyalandı ✅");
    } catch {
      alert("Kopyalanamadı (clipboard izni?)");
    }
  }

  async function openPdf() {
    const res = await fetch(`${API}/export/pdf/${encodeURIComponent(caseId)}`, {
      headers: authHeaders(),
    });
    if (!res.ok) { alert("PDF alınamadı"); return; }
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
          ← Back
        </Link>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={copyJson} disabled={!data}>
            JSON Kopyala
          </Button>
          <Button variant="secondary" onClick={openVerify} disabled={!verifyUrl}>
            Verify
          </Button>
          <Button onClick={openPdf}>PDF Aç</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Case: {caseId}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-sm text-zinc-500">Loading…</div>}
          {err && <div className="text-sm text-red-600">Error: {err}</div>}

          {!loading && !err && (
            <div className="space-y-3">
              <div className="text-sm">
                <div className="text-zinc-500">Decision</div>
                <div className="font-medium">{data?.decision ?? "-"}</div>
              </div>

              <div className="text-sm">
                <div className="text-zinc-500">Verify URL</div>
                <div className="font-mono break-all text-xs">{verifyUrl ?? "-"}</div>
              </div>

              <div>
                <div className="text-sm text-zinc-500 mb-2">Raw JSON</div>
                <pre className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs overflow-auto">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}