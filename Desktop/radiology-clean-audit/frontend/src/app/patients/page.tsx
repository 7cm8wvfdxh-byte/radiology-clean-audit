"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { FormField, Input, Select } from "@/components/ui/FormField";
import Breadcrumb from "@/components/Breadcrumb";
import { SkeletonList } from "@/components/Skeleton";
import { getToken, clearToken, authHeaders } from "@/lib/auth";
import { API_BASE } from "@/lib/constants";
import { getErrorMessage } from "@/lib/errors";

type Patient = {
  patient_id: string;
  full_name: string;
  birth_date?: string;
  gender?: string;
  created_at?: string;
};

type CreateForm = {
  patient_id: string;
  full_name: string;
  birth_date: string;
  gender: string;
};

const defaultForm: CreateForm = {
  patient_id: "",
  full_name: "",
  birth_date: "",
  gender: "U",
};

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateForm>(defaultForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function fetchPatients() {
    const token = getToken();
    if (!token) { router.replace("/"); return; }
    try {
      setErr(null);
      setLoading(true);
      const res = await fetch(`${API_BASE}/patients`, { headers: authHeaders() });
      if (res.status === 401) { clearToken(); router.replace("/"); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPatients(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setErr(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchPatients(); }, []);

  function handleField(field: keyof CreateForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    }
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!form.patient_id.trim()) errors.patient_id = "Hasta ID zorunlu.";
    if (!form.full_name.trim()) errors.full_name = "Ad Soyad zorunlu.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormErr(null);
    if (!validate()) return;

    setFormLoading(true);
    try {
      const body: Record<string, string> = {
        patient_id: form.patient_id.trim(),
        full_name: form.full_name.trim(),
        gender: form.gender,
      };
      if (form.birth_date) body.birth_date = form.birth_date;

      const res = await fetch(`${API_BASE}/patients`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body),
      });
      if (res.status === 401) { clearToken(); router.replace("/"); return; }
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.detail ?? `HTTP ${res.status}`);
      }
      setForm(defaultForm);
      setFieldErrors({});
      setShowForm(false);
      fetchPatients();
    } catch (e: unknown) {
      setFormErr(getErrorMessage(e));
    } finally {
      setFormLoading(false);
    }
  }

  const genderLabel = (g?: string) =>
    g === "M" ? "Erkek" : g === "F" ? "Kadin" : "Belirtilmemis";

  const genderIcon = (g?: string) =>
    g === "M" ? "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" :
    g === "F" ? "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" :
    "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumb items={[{ label: "Ana Sayfa", href: "/" }, { label: "Hastalar" }]} />
          <h1 className="text-2xl font-bold mt-2 dark:text-zinc-100 tracking-tight">Hastalar</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Hasta kayitlarini yonetin</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setFormErr(null); setFieldErrors({}); }}>
          {showForm ? (
            <>
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Iptal
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Yeni Hasta
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <Card className="border-indigo-200/60 dark:border-indigo-800/40 animate-fade-in">
          <CardHeader className="bg-indigo-50/30 dark:bg-indigo-900/10">
            <CardTitle className="flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Yeni Hasta Ekle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4" noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Hasta ID" required error={fieldErrors.patient_id}>
                  <Input
                    type="text"
                    value={form.patient_id}
                    onChange={(e) => handleField("patient_id", e.target.value)}
                    placeholder="Ornek: P-00001"
                    error={!!fieldErrors.patient_id}
                  />
                </FormField>
                <FormField label="Ad Soyad" required error={fieldErrors.full_name}>
                  <Input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => handleField("full_name", e.target.value)}
                    placeholder="Ornek: Ahmet Yilmaz"
                    error={!!fieldErrors.full_name}
                  />
                </FormField>
                <FormField label="Dogum Tarihi">
                  <Input
                    type="date"
                    value={form.birth_date}
                    onChange={(e) => handleField("birth_date", e.target.value)}
                  />
                </FormField>
                <FormField label="Cinsiyet">
                  <Select
                    value={form.gender}
                    onChange={(e) => handleField("gender", e.target.value)}
                  >
                    <option value="U">Belirtilmemis</option>
                    <option value="M">Erkek</option>
                    <option value="F">Kadin</option>
                  </Select>
                </FormField>
              </div>

              {formErr && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2.5 flex items-center gap-2" role="alert">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formErr}
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Kaydediliyor...
                    </span>
                  ) : "Kaydet"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => { setForm(defaultForm); setFormErr(null); setFieldErrors({}); }}
                >
                  Sifirla
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Hasta Listesi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <SkeletonList rows={4} />}
          {err && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2.5 flex items-center gap-2" role="alert">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Hata: {err}
            </div>
          )}
          {!loading && !err && patients.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Henuz hasta yok.</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">&quot;+ Yeni Hasta&quot; ile ekleyin.</p>
            </div>
          )}
          {!loading && (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {patients.map((p) => (
                <li key={p.patient_id} className="py-3.5 flex items-center justify-between hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 -mx-5 px-5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
                      {p.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{p.full_name}</div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        {p.patient_id} · {genderLabel(p.gender)}
                        {p.birth_date ? ` · ${p.birth_date}` : ""}
                      </div>
                    </div>
                  </div>
                  <Link href={`/patients/${encodeURIComponent(p.patient_id)}`}>
                    <Button variant="secondary" className="text-xs">Ac</Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
