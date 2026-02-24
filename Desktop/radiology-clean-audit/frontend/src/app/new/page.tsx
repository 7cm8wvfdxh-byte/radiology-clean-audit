"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getToken, clearToken, authHeaders } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

type FormState = {
  case_id: string;
  lesion_size_mm: string;
  cirrhosis: boolean;
  arterial_hyperenhancement: boolean;
  portal_washout: boolean;
  delayed_capsule: boolean;
};

const defaultForm: FormState = {
  case_id: "",
  lesion_size_mm: "",
  cirrhosis: false,
  arterial_hyperenhancement: false,
  portal_washout: false,
  delayed_capsule: false,
};

export default function NewCase() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
    } else {
      setAuthed(true);
    }
  }, []);

  function handleCheck(field: keyof FormState) {
    setForm((f) => ({ ...f, [field]: !f[field] }));
  }

  function handleText(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.case_id.trim()) {
      setError("Case ID zorunlu.");
      return;
    }
    const size = parseInt(form.lesion_size_mm, 10);
    if (isNaN(size) || size < 0 || size > 200) {
      setError("Lezyon boyutu 0-200 mm arasında olmalı.");
      return;
    }

    const body = {
      arterial_phase: { hyperenhancement: form.arterial_hyperenhancement },
      portal_phase: { washout: form.portal_washout },
      delayed_phase: { capsule: form.delayed_capsule },
      lesion_size_mm: size,
      cirrhosis: form.cirrhosis,
    };

    setLoading(true);
    try {
      const res = await fetch(
        `${API}/analyze/${encodeURIComponent(form.case_id.trim())}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify(body),
        }
      );
      if (res.status === 401) { clearToken(); router.replace("/"); return; }
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.detail ?? `HTTP ${res.status}`);
      }
      router.push(`/cases/${encodeURIComponent(form.case_id.trim())}`);
    } catch (e: any) {
      setError(e?.message ?? "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }

  if (!authed) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/" className="text-sm text-zinc-600 hover:underline">
          ← Cases
        </Link>
        <span className="text-zinc-300">/</span>
        <span className="text-sm font-medium">Yeni Vaka</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Yeni LI-RADS Analizi</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-6">
            {/* Case ID */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Case ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.case_id}
                onChange={(e) => handleText("case_id", e.target.value)}
                placeholder="Örnek: CASE1001"
                className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
            </div>

            {/* Lezyon boyutu */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Lezyon Boyutu (mm) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                max={200}
                value={form.lesion_size_mm}
                onChange={(e) => handleText("lesion_size_mm", e.target.value)}
                placeholder="Örnek: 22"
                className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
            </div>

            {/* Klinik bulgular */}
            <div>
              <div className="text-sm font-medium text-zinc-700 mb-2">Klinik Bulgular</div>
              <div className="space-y-2">
                {(
                  [
                    { field: "cirrhosis", label: "Siroz (Cirrhosis)" },
                    { field: "arterial_hyperenhancement", label: "Arteriyel hiperenhansman" },
                    { field: "portal_washout", label: "Portal/venöz washout" },
                    { field: "delayed_capsule", label: "Kapsül (geç faz)" },
                  ] as { field: keyof FormState; label: string }[]
                ).map(({ field, label }) => (
                  <label key={field} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!form[field]}
                      onChange={() => handleCheck(field)}
                      className="h-4 w-4 rounded border-zinc-300"
                    />
                    <span className="text-sm text-zinc-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* LI-RADS kılavuzu */}
            <div className="rounded-md bg-zinc-50 border border-zinc-200 p-3 text-xs text-zinc-500 space-y-1">
              <div className="font-medium text-zinc-600">LI-RADS Karar Özeti</div>
              <div>LR-5 (Kesin HCC): Siroz + arteriyel + washout + kapsül + ≥10 mm</div>
              <div>LR-4 (Muhtemel HCC): Siroz + arteriyel + washout + ≥10 mm</div>
              <div>LR-3 (Ara): Siroz + arteriyel + ≥10 mm veya arteriyel + &lt;10 mm</div>
              <div>LR-2 (Muhtemelen benign): Diğer</div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Analiz ediliyor…" : "Analizi Başlat"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setForm(defaultForm); setError(null); }}
              >
                Sıfırla
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
