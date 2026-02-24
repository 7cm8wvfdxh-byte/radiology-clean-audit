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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumb items={[{ label: "Ana Sayfa", href: "/" }, { label: "Hastalar" }]} />
          <h1 className="text-xl font-semibold mt-2 dark:text-zinc-100">Hastalar</h1>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setFormErr(null); setFieldErrors({}); }}>
          {showForm ? "Iptal" : "+ Yeni Hasta"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Yeni Hasta Ekle</CardTitle>
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
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-3 py-2" role="alert">
                  {formErr}
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? "Kaydediliyor..." : "Kaydet"}
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
          <CardTitle>Hasta Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <SkeletonList rows={4} />}
          {err && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-3 py-2" role="alert">
              Hata: {err}
            </div>
          )}
          {!loading && !err && patients.length === 0 && (
            <div className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">
              Henuz hasta yok. &quot;+ Yeni Hasta&quot; ile ekleyin.
            </div>
          )}
          {!loading && (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {patients.map((p) => (
                <li key={p.patient_id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium dark:text-zinc-100">{p.full_name}</div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      {p.patient_id} · {genderLabel(p.gender)}
                      {p.birth_date ? ` · ${p.birth_date}` : ""}
                    </div>
                  </div>
                  <Link href={`/patients/${encodeURIComponent(p.patient_id)}`}>
                    <Button variant="secondary">Ac</Button>
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
