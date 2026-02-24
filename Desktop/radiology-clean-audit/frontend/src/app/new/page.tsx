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
    <div className="space-y-4">
      <div>
        <Breadcrumb items={[{ label: "Ana Sayfa", href: "/" }, { label: "Vakalar", href: "/cases" }, { label: "Yeni Vaka" }]} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Yeni LI-RADS Analizi</CardTitle>
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
              <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Klinik Bulgular</legend>
              <div className="space-y-2">
                {(
                  [
                    { field: "cirrhosis", label: "Siroz (Cirrhosis)" },
                    { field: "arterial_hyperenhancement", label: "Arteriyel hiperenhansman" },
                    { field: "portal_washout", label: "Portal/venoz washout" },
                    { field: "delayed_capsule", label: "Kapsul (gec faz)" },
                  ] as { field: keyof FormState; label: string }[]
                ).map(({ field, label }) => (
                  <label key={field} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!form[field]}
                      onChange={() => handleCheck(field)}
                      className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
                    />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* LI-RADS kilavuzu */}
            <div className="rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 p-3 text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
              <div className="font-medium text-zinc-600 dark:text-zinc-300">LI-RADS Karar Ozeti</div>
              <div>LR-5 (Kesin HCC): Siroz + arteriyel + washout + kapsul + &ge;10 mm</div>
              <div>LR-4 (Muhtemel HCC): Siroz + arteriyel + washout + &ge;10 mm</div>
              <div>LR-3 (Ara): Siroz + arteriyel + &ge;10 mm veya arteriyel + &lt;10 mm</div>
              <div>LR-2 (Muhtemelen benign): Diger</div>
            </div>

            {error && (
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-3 py-2" role="alert">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Analiz ediliyor..." : "Analizi Baslat"}
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
