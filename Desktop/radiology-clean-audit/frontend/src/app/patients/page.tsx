"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getToken, clearToken, authHeaders } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

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

  async function fetchPatients() {
    const token = getToken();
    if (!token) { router.replace("/"); return; }
    try {
      setErr(null);
      setLoading(true);
      const res = await fetch(`${API}/patients`, { headers: authHeaders() });
      if (res.status === 401) { clearToken(); router.replace("/"); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPatients(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErr(e?.message ?? "Yükleme hatası");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchPatients(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormErr(null);
    if (!form.patient_id.trim()) { setFormErr("Hasta ID zorunlu."); return; }
    if (!form.full_name.trim()) { setFormErr("Ad Soyad zorunlu."); return; }

    setFormLoading(true);
    try {
      const body: Record<string, string> = {
        patient_id: form.patient_id.trim(),
        full_name: form.full_name.trim(),
        gender: form.gender,
      };
      if (form.birth_date) body.birth_date = form.birth_date;

      const res = await fetch(`${API}/patients`, {
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
      setShowForm(false);
      fetchPatients();
    } catch (e: any) {
      setFormErr(e?.message ?? "Oluşturma hatası");
    } finally {
      setFormLoading(false);
    }
  }

  const genderLabel = (g?: string) =>
    g === "M" ? "Erkek" : g === "F" ? "Kadın" : "Belirtilmemiş";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-zinc-600 hover:underline">
            ← Cases
          </Link>
          <h1 className="text-xl font-semibold mt-1">Hastalar</h1>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setFormErr(null); }}>
          {showForm ? "İptal" : "+ Yeni Hasta"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Yeni Hasta Ekle</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Hasta ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.patient_id}
                    onChange={(e) => setForm((f) => ({ ...f, patient_id: e.target.value }))}
                    placeholder="Örnek: P-00001"
                    className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Ad Soyad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                    placeholder="Örnek: Ahmet Yılmaz"
                    className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Doğum Tarihi
                  </label>
                  <input
                    type="date"
                    value={form.birth_date}
                    onChange={(e) => setForm((f) => ({ ...f, birth_date: e.target.value }))}
                    className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Cinsiyet
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                    className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                  >
                    <option value="U">Belirtilmemiş</option>
                    <option value="M">Erkek</option>
                    <option value="F">Kadın</option>
                  </select>
                </div>
              </div>

              {formErr && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {formErr}
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? "Kaydediliyor…" : "Kaydet"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => { setForm(defaultForm); setFormErr(null); }}
                >
                  Sıfırla
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
          {loading && <div className="text-sm text-zinc-500">Yükleniyor…</div>}
          {err && <div className="text-sm text-red-600">Hata: {err}</div>}
          {!loading && !err && patients.length === 0 && (
            <div className="text-sm text-zinc-500">
              Henüz hasta yok. "+ Yeni Hasta" ile ekleyin.
            </div>
          )}
          <ul className="divide-y divide-zinc-200">
            {patients.map((p) => (
              <li key={p.patient_id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{p.full_name}</div>
                  <div className="text-sm text-zinc-500">
                    {p.patient_id} · {genderLabel(p.gender)}
                    {p.birth_date ? ` · ${p.birth_date}` : ""}
                  </div>
                </div>
                <Link href={`/patients/${encodeURIComponent(p.patient_id)}`}>
                  <Button variant="secondary">Aç</Button>
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
