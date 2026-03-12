"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { FormField, Input } from "@/components/ui/FormField";
import Breadcrumb from "@/components/Breadcrumb";
import { getToken, clearToken, authHeaders } from "@/lib/auth";
import { API_BASE } from "@/lib/constants";
import { getErrorMessage } from "@/lib/errors";

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
    if (fieldErrors[field]) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    }
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!form.case_id.trim()) {
      errors.case_id = "Case ID zorunlu.";
    }
    const size = parseInt(form.lesion_size_mm, 10);
    if (!form.lesion_size_mm.trim()) {
      errors.lesion_size_mm = "Lezyon boyutu zorunlu.";
    } else if (isNaN(size) || size < 0 || size > 200) {
      errors.lesion_size_mm = "Lezyon boyutu 0-200 mm arasinda olmali.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    const size = parseInt(form.lesion_size_mm, 10);
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
        `${API_BASE}/analyze/${encodeURIComponent(form.case_id.trim())}`,
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
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  if (!authed) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Breadcrumb items={[{ label: "Ana Sayfa", href: "/" }, { label: "Vakalar", href: "/cases" }, { label: "Yeni Vaka" }]} />
        <h1 className="text-2xl font-bold mt-2 dark:text-zinc-100 tracking-tight">Yeni Vaka</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">LI-RADS analizi icin yeni vaka olusturun</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni LI-RADS Analizi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-6" noValidate>
            {/* Case ID */}
            <FormField label="Case ID" required error={fieldErrors.case_id}>
              <Input
                type="text"
                value={form.case_id}
                onChange={(e) => handleText("case_id", e.target.value)}
                placeholder="Ornek: CASE1001"
                error={!!fieldErrors.case_id}
              />
            </FormField>

            {/* Lezyon boyutu */}
            <FormField label="Lezyon Boyutu (mm)" required error={fieldErrors.lesion_size_mm} hint="0 ile 200 mm arasinda bir deger girin">
              <Input
                type="number"
                min={0}
                max={200}
                value={form.lesion_size_mm}
                onChange={(e) => handleText("lesion_size_mm", e.target.value)}
                placeholder="Ornek: 22"
                error={!!fieldErrors.lesion_size_mm}
              />
            </FormField>

            {/* Klinik bulgular */}
            <fieldset>
              <legend className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Klinik Bulgular</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(
                  [
                    { field: "cirrhosis", label: "Siroz (Cirrhosis)", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
                    { field: "arterial_hyperenhancement", label: "Arteriyel hiperenhansman", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
                    { field: "portal_washout", label: "Portal/venoz washout", icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" },
                    { field: "delayed_capsule", label: "Kapsul (gec faz)", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
                  ] as { field: keyof FormState; label: string; icon: string }[]
                ).map(({ field, label, icon }) => (
                  <label
                    key={field}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      form[field]
                        ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-700"
                        : "bg-white border-zinc-200 hover:border-zinc-300 dark:bg-zinc-800/50 dark:border-zinc-700 dark:hover:border-zinc-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!form[field]}
                      onChange={() => handleCheck(field)}
                      className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 text-indigo-600"
                    />
                    <svg className={`w-4 h-4 flex-shrink-0 ${form[field] ? "text-indigo-500" : "text-zinc-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
                    </svg>
                    <span className={`text-sm ${form[field] ? "text-indigo-700 dark:text-indigo-300 font-medium" : "text-zinc-700 dark:text-zinc-300"}`}>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* LI-RADS kilavuzu */}
            <div className="rounded-xl bg-gradient-to-r from-zinc-50 to-slate-50 dark:from-zinc-800/50 dark:to-slate-800/50 border border-zinc-200 dark:border-zinc-700 p-4 text-xs text-zinc-500 dark:text-zinc-400 space-y-1.5">
              <div className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                LI-RADS Karar Ozeti
              </div>
              <div>LR-5 (Kesin HCC): Siroz + arteriyel + washout + kapsul + &ge;10 mm</div>
              <div>LR-4 (Muhtemel HCC): Siroz + arteriyel + washout + &ge;10 mm</div>
              <div>LR-3 (Ara): Siroz + arteriyel + &ge;10 mm veya arteriyel + &lt;10 mm</div>
              <div>LR-2 (Muhtemelen benign): Diger</div>
            </div>

            {error && (
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2.5 flex items-center gap-2" role="alert">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Analiz ediliyor...
                  </span>
                ) : "Analizi Baslat"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setForm(defaultForm); setError(null); setFieldErrors({}); }}
              >
                Sifirla
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
