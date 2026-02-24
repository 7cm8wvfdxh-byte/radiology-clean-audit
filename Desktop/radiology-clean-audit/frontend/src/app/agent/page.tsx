"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getToken, clearToken } from "@/lib/auth";
import { API_BASE } from "@/lib/constants";
import type {
  LabResult,
  ConfidenceData,
  CriticalFinding,
  Lesion,
  BrainLesion,
  SpineLesion,
  ThoraxLesion,
  PelvisLesion,
  RegionType,
  ClinicalForm,
} from "@/types/agent";
import {
  emptyLesion,
  emptyBrainLesion,
  emptySpineLesion,
  emptyThoraxLesion,
  emptyPelvisLesion,
} from "@/types/agent";
import {
  AbdomenLesionForm,
  BrainLesionForm,
  SpineLesionForm,
  ThoraxLesionForm,
  PelvisLesionForm,
  DicomDropzone,
  SequenceSelector,
  ReportViewer,
  ConfidencePanel,
  CriticalAlertBanner,
  ChecklistPanel,
  LabPanel,
  PriorCasesPanel,
  AgentLiradsBadge,
  SectionLabel,
  ABDOMEN_SEQUENCES,
  BRAIN_SEQUENCES,
  SPINE_SEQUENCES,
  THORAX_SEQUENCES,
  PELVIS_SEQUENCES,
} from "@/components/agent";

const API = API_BASE;

const defaultForm: ClinicalForm = {
  region: "abdomen",
  age: "",
  gender: "",
  indication: "",
  contrast: true,
  contrast_agent: "",
  risk_factors: "",
  notes: "",
  cirrhosis: false,
  sequences: [],
  liver_parenchyma: "",
  lesions: [{ ...emptyLesion }],
  other_organs: "",
  vascular: "",
  brain_general: "",
  brain_lesions: [{ ...emptyBrainLesion }],
  brain_other: "",
  spine_general: "",
  spine_lesions: [{ ...emptySpineLesion }],
  spine_other: "",
  thorax_general: "",
  thorax_lesions: [{ ...emptyThoraxLesion }],
  thorax_other: "",
  pelvis_general: "",
  pelvis_lesions: [{ ...emptyPelvisLesion }],
  pelvis_other: "",
};

// Sekans ve lokalizasyon sabitleri, lezyon formlari ve panel komponentleri
// @/components/agent altindaki dosyalara tasindi.

// Yerel LiradsBadge alias (kayit panelinde kullaniliyor)
const LiradsBadge = AgentLiradsBadge;
export default function AgentPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  const [form, setForm] = useState<ClinicalForm>(defaultForm);
  const [dicomFiles, setDicomFiles] = useState<File[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState("");

  // Multi-turn conversation
  const [followups, setFollowups] = useState<{ role: string; content: string }[]>([]);
  const [followupQ, setFollowupQ] = useState("");
  const [followupLoading, setFollowupLoading] = useState(false);
  const [followupStream, setFollowupStream] = useState("");

  // Save state
  const [caseId, setCaseId] = useState("");
  const [patientId, setPatientId] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedPack, setSavedPack] = useState<any>(null);

  // ── Yeni Özellikler State ──
  const [educationMode, setEducationMode] = useState(false);
  const [confidenceData, setConfidenceData] = useState<ConfidenceData | null>(null);
  const [criticalFindings, setCriticalFindings] = useState<CriticalFinding[]>([]);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [checklistTitle, setChecklistTitle] = useState("");
  const [checklistChecked, setChecklistChecked] = useState<Record<string, boolean>>({});
  const [priorCases, setPriorCases] = useState<any[]>([]);
  const [priorIncluded, setPriorIncluded] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
    } else {
      setAuthed(true);
    }
  }, []);

  // Checklist yükle (bölge değiştiğinde)
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const region = form.region === "both" ? "abdomen" : form.region;
    fetch(`${API}/checklist/${region}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setChecklistItems(data.items || []);
          setChecklistTitle(data.title || "Sistematik Tarama");
          setChecklistChecked({});
        }
      })
      .catch(() => {});
  }, [form.region]);

  // Prior vakaları yükle (patient ID değiştiğinde)
  useEffect(() => {
    const token = getToken();
    if (!token || !patientId.trim()) { setPriorCases([]); return; }
    fetch(`${API}/patients/${patientId.trim()}/prior-cases`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setPriorCases(Array.isArray(data) ? data : []))
      .catch(() => setPriorCases([]));
  }, [patientId]);

  // Confidence verisi parse et (rapor tamamlandığında)
  useEffect(() => {
    if (!report || loading) return;
    const match = report.match(/```confidence\s*\n([\s\S]*?)\n```/);
    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        setConfidenceData(parsed);
        // Critical alert from AI response
        if (parsed.critical_alert) {
          setCriticalFindings(prev => {
            const aiAlert: CriticalFinding = {
              level: "critical", code: "AI_ALERT",
              message: parsed.critical_message || "AI kritik bulgu tespit etti",
              action: "Klinik degerlendirme yapilmalidir.",
            };
            return prev.some(f => f.code === "AI_ALERT") ? prev : [...prev, aiAlert];
          });
        }
      } catch {}
    }
  }, [report, loading]);

  function set<K extends keyof ClinicalForm>(key: K, val: ClinicalForm[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  // Lesion management
  function updateLesion(idx: number, lesion: Lesion) {
    setForm((f) => ({
      ...f,
      lesions: f.lesions.map((l, i) => (i === idx ? lesion : l)),
    }));
  }
  function addLesion() {
    setForm((f) => ({ ...f, lesions: [...f.lesions, { ...emptyLesion }] }));
  }
  function removeLesion(idx: number) {
    setForm((f) => ({
      ...f,
      lesions: f.lesions.filter((_, i) => i !== idx),
    }));
  }

  // Brain lesion management
  function updateBrainLesion(idx: number, lesion: BrainLesion) {
    setForm((f) => ({ ...f, brain_lesions: f.brain_lesions.map((l, i) => (i === idx ? lesion : l)) }));
  }
  function addBrainLesion() {
    setForm((f) => ({ ...f, brain_lesions: [...f.brain_lesions, { ...emptyBrainLesion }] }));
  }
  function removeBrainLesion(idx: number) {
    setForm((f) => ({ ...f, brain_lesions: f.brain_lesions.filter((_, i) => i !== idx) }));
  }

  // Spine lesion management
  function updateSpineLesion(idx: number, lesion: SpineLesion) {
    setForm((f) => ({ ...f, spine_lesions: f.spine_lesions.map((l, i) => (i === idx ? lesion : l)) }));
  }
  function addSpineLesion() {
    setForm((f) => ({ ...f, spine_lesions: [...f.spine_lesions, { ...emptySpineLesion }] }));
  }
  function removeSpineLesion(idx: number) {
    setForm((f) => ({ ...f, spine_lesions: f.spine_lesions.filter((_, i) => i !== idx) }));
  }

  // Thorax lesion management
  function updateThoraxLesion(idx: number, lesion: ThoraxLesion) {
    setForm((f) => ({ ...f, thorax_lesions: f.thorax_lesions.map((l, i) => (i === idx ? lesion : l)) }));
  }
  function addThoraxLesion() {
    setForm((f) => ({ ...f, thorax_lesions: [...f.thorax_lesions, { ...emptyThoraxLesion }] }));
  }
  function removeThoraxLesion(idx: number) {
    setForm((f) => ({ ...f, thorax_lesions: f.thorax_lesions.filter((_, i) => i !== idx) }));
  }

  // Pelvis lesion management
  function updatePelvisLesion(idx: number, lesion: PelvisLesion) {
    setForm((f) => ({ ...f, pelvis_lesions: f.pelvis_lesions.map((l, i) => (i === idx ? lesion : l)) }));
  }
  function addPelvisLesion() {
    setForm((f) => ({ ...f, pelvis_lesions: [...f.pelvis_lesions, { ...emptyPelvisLesion }] }));
  }
  function removePelvisLesion(idx: number) {
    setForm((f) => ({ ...f, pelvis_lesions: f.pelvis_lesions.filter((_, i) => i !== idx) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setReport("");

    if (!form.indication.trim()) {
      setError("Endikasyon alani zorunludur.");
      return;
    }

    const token = getToken();
    if (!token) { clearToken(); router.replace("/"); return; }

    // Lab ve prior bilgilerini clinical_data'ya ekle
    const enrichedForm = {
      ...form,
      lab_results: labResults,
      prior_cases: priorIncluded ? priorCases : [],
    };

    const body = new FormData();
    body.append("clinical_json", JSON.stringify(enrichedForm));
    body.append("education_mode", educationMode ? "true" : "false");
    for (const f of dicomFiles) {
      body.append("dicoms", f, f.name);
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/agent/analyze`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });

      if (res.status === 401) { clearToken(); router.replace("/"); return; }
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.detail ?? `HTTP ${res.status}`);
      }

      // SSE stream oku
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.text) {
              setReport((prev) => prev + payload.text);
            }
            if (payload.done) {
              setLoading(false);
            }
          } catch {}
        }
      }
    } catch (err: any) {
      setError(err?.message ?? "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(report);
    } catch {}
  }

  async function handleSave() {
    if (!caseId.trim()) {
      setError("Kaydetmek icin Vaka ID zorunludur.");
      return;
    }
    const token = getToken();
    if (!token) { clearToken(); router.replace("/"); return; }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API}/agent/save`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          case_id: caseId.trim(),
          clinical_data: form,
          agent_report: report,
          patient_id: patientId.trim() || null,
        }),
      });
      if (res.status === 401) { clearToken(); router.replace("/"); return; }
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.detail ?? `HTTP ${res.status}`);
      }
      const pack = await res.json();
      setSavedPack(pack);
    } catch (err: any) {
      setError(err?.message ?? "Kaydetme hatasi");
    } finally {
      setSaving(false);
    }
  }

  async function handleFollowup(e: React.FormEvent) {
    e.preventDefault();
    if (!followupQ.trim() || followupLoading) return;
    const token = getToken();
    if (!token) { clearToken(); router.replace("/"); return; }

    const question = followupQ.trim();
    setFollowupQ("");
    setFollowupStream("");
    setFollowupLoading(true);
    setError(null);

    // Build conversation history for API
    const history = [
      { role: "user", content: `[Initial analysis request for: ${form.indication}]` },
      { role: "assistant", content: report },
      ...followups,
    ];

    try {
      const res = await fetch(`${API}/agent/followup`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ history, question }),
      });
      if (res.status === 401) { clearToken(); router.replace("/"); return; }
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.detail ?? `HTTP ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.text) {
              fullResponse += payload.text;
              setFollowupStream(fullResponse);
            }
          } catch {}
        }
      }

      // Stream bitti, followups listesine ekle
      setFollowups((prev) => [
        ...prev,
        { role: "user", content: question },
        { role: "assistant", content: fullResponse },
      ]);
      setFollowupStream("");
    } catch (err: any) {
      setError(err?.message ?? "Takip sorusu hatasi");
    } finally {
      setFollowupLoading(false);
    }
  }

  if (!authed) return null;

  const showAbdomen = form.region === "abdomen" || form.region === "both";
  const showBrain = form.region === "brain" || form.region === "both";
  const showSpine = form.region === "spine";
  const showThorax = form.region === "thorax";
  const showPelvis = form.region === "pelvis";
  const seqOptions = (() => {
    const seqs: string[] = [];
    if (showAbdomen) seqs.push(...ABDOMEN_SEQUENCES);
    if (showBrain) seqs.push(...BRAIN_SEQUENCES);
    if (showSpine) seqs.push(...SPINE_SEQUENCES);
    if (showThorax) seqs.push(...THORAX_SEQUENCES);
    if (showPelvis) seqs.push(...PELVIS_SEQUENCES);
    if (seqs.length === 0) seqs.push(...ABDOMEN_SEQUENCES);
    return [...new Set(seqs)];
  })();

  return (
    <div className="space-y-6">
      {/* Baslik */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-zinc-600 hover:underline">
            &larr; Cases
          </Link>
          <h1 className="text-xl font-semibold mt-1">Radyolog Ajan</h1>
          <p className="text-sm text-zinc-500">
            MRI vakasini yapilandirilmis radyolog akil yurutmesiyle analiz eder
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Egitim Modu Toggle */}
          <label className="flex items-center gap-2 cursor-pointer bg-zinc-100 border border-zinc-200 rounded-lg px-3 py-2">
            <input
              type="checkbox"
              checked={educationMode}
              onChange={(e) => setEducationMode(e.target.checked)}
              className="h-4 w-4 accent-indigo-600 rounded"
            />
            <span className="text-sm font-medium text-zinc-700">Egitim Modu</span>
          </label>
          {report && (
            <Button variant="secondary" onClick={copyReport}>
              Raporu Kopyala
            </Button>
          )}
        </div>
      </div>

      {/* Kritik Bulgu Alarm Banner - en üstte */}
      <CriticalAlertBanner findings={criticalFindings} />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ─── 1. Klinik Bilgiler ──────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>1. Klinik Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Bolge */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Inceleme Bolgesi <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3 flex-wrap">
                {([
                  ["abdomen", "Abdomen"],
                  ["brain", "Beyin"],
                  ["spine", "Omurga"],
                  ["thorax", "Toraks"],
                  ["pelvis", "Pelvis"],
                  ["both", "Abdomen + Beyin"],
                ] as [RegionType, string][]).map(([r, label]) => (
                  <label key={r} className="flex items-center gap-1.5 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="region"
                      value={r}
                      checked={form.region === r}
                      onChange={() => set("region", r)}
                      className="accent-zinc-700"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* Yas + Cinsiyet */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Yas</label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={form.age}
                  onChange={(e) => set("age", e.target.value)}
                  placeholder="Ornek: 58"
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Cinsiyet</label>
                <select
                  value={form.gender}
                  onChange={(e) => set("gender", e.target.value)}
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                >
                  <option value="">Belirtilmemis</option>
                  <option value="Erkek">Erkek</option>
                  <option value="Kadin">Kadin</option>
                </select>
              </div>
            </div>

            {/* Endikasyon */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Endikasyon / Klinik Soru <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.indication}
                onChange={(e) => set("indication", e.target.value)}
                rows={2}
                placeholder="Ornek: Karacigerde fokal lezyon – HCC ekarte edilmesi istenmistir. Bilinen HCV(+) siroz."
                className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
            </div>

            {/* Kontrast */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-zinc-700 mb-2">
                <input
                  type="checkbox"
                  checked={form.contrast}
                  onChange={(e) => set("contrast", e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 accent-zinc-700"
                />
                Kontrastli cekim yapildi
              </label>
              {form.contrast && (
                <input
                  type="text"
                  value={form.contrast_agent}
                  onChange={(e) => set("contrast_agent", e.target.value)}
                  placeholder="Kontrast ajani (orn: Gadoxetate / Primovist, Gadobutrol)"
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              )}
            </div>

            {/* Siroz + Risk faktorleri */}
            {showAbdomen && (
              <div>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-zinc-700 mb-2">
                  <input
                    type="checkbox"
                    checked={form.cirrhosis}
                    onChange={(e) => set("cirrhosis", e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 accent-zinc-700"
                  />
                  Siroz / Kronik karaciger hastaligi mevcut
                </label>
                {form.cirrhosis && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                    Siroz varliginda LI-RADS skorlamasi aktif olur. Lezyon ozellikleri kritik onem tasir.
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Risk Faktorleri
              </label>
              <input
                type="text"
                value={form.risk_factors}
                onChange={(e) => set("risk_factors", e.target.value)}
                placeholder="Ornek: HBsAg(+), AFP 42 ng/mL, DM, hipertansiyon, alkol"
                className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
            </div>

            {/* Ek notlar */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Ek Klinik Not / Onceki Tetkik
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={2}
                placeholder="Ornek: 6 ay once cekilen MRI'da segment 6'da 12 mm lezyon izlenmisti."
                className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
            </div>

            {/* Lab Sonuçları */}
            <div className="border-t border-zinc-200 pt-4">
              <LabPanel
                labs={labResults}
                onAdd={(lab) => setLabResults(prev => [...prev, lab])}
                onRemove={(idx) => setLabResults(prev => prev.filter((_, i) => i !== idx))}
              />
            </div>

            {/* Prior Karşılaştırma */}
            {priorCases.length > 0 && (
              <div className="border-t border-zinc-200 pt-4">
                <PriorCasesPanel
                  priorCases={priorCases}
                  onSelect={() => setPriorIncluded(true)}
                />
                {priorIncluded && (
                  <p className="text-xs text-green-600 mt-1">Onceki vakalar AI analizine dahil edildi.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── 2. Teknik Bilgiler (MRI Sekanslari) ─────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>2. Teknik Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Mevcut MRI Sekanslari
              </label>
              <SequenceSelector
                options={seqOptions}
                selected={form.sequences}
                onChange={(s) => set("sequences", s)}
              />
              <p className="text-xs text-zinc-400 mt-1">Mevcut sekans(lar)i secin</p>
            </div>
          </CardContent>
        </Card>

        {/* ─── 3. Goruntuleme Bulgulari ─────────────────────────────────── */}
        {showAbdomen && (
          <Card>
            <CardHeader>
              <CardTitle>3. Abdomen MRI Bulgulari</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Karaciger parankimi */}
              <div>
                <SectionLabel>Karaciger Parankimi</SectionLabel>
                <textarea
                  value={form.liver_parenchyma}
                  onChange={(e) => set("liver_parenchyma", e.target.value)}
                  rows={2}
                  placeholder="orn: Boyut normal (~15 cm). Parankim homojen / noduler siroz paterni. Steato yok. Portal ven acik."
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>

              {/* Fokal lezyonlar */}
              <div>
                <SectionLabel>Fokal Lezyon(lar)</SectionLabel>
                <div className="space-y-3">
                  {form.lesions.map((lesion, idx) => (
                    <AbdomenLesionForm
                      key={idx}
                      lesion={lesion}
                      index={idx}
                      onChange={(l) => updateLesion(idx, l)}
                      onRemove={() => removeLesion(idx)}
                      canRemove={form.lesions.length > 1}
                    />
                  ))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-2 text-xs"
                  onClick={addLesion}
                >
                  + Lezyon Ekle
                </Button>
              </div>

              {/* Diger organlar */}
              <div>
                <SectionLabel>Diger Organlar</SectionLabel>
                <textarea
                  value={form.other_organs}
                  onChange={(e) => set("other_organs", e.target.value)}
                  rows={3}
                  placeholder={"Safra kesesi: Normal / Tas(+) / Duvar kalinlasmasi\nPankreas: Normal boyut, Wirsung normal\nDalak: 11 cm, homojen\nBobrekler: Bilateral normal boyut, kist(-)\nAdrenal: Normal"}
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>

              {/* Vaskuler */}
              <div>
                <SectionLabel>Vaskuler Yapilar & Periton</SectionLabel>
                <textarea
                  value={form.vascular}
                  onChange={(e) => set("vascular", e.target.value)}
                  rows={2}
                  placeholder="orn: Portal ven acik, hepatik venler normal. Asit yok. LAP yok."
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {showBrain && (
          <Card>
            <CardHeader>
              <CardTitle>
                {showAbdomen ? "4" : "3"}. Beyin MRI Bulgulari
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Genel degerlendirme */}
              <div>
                <SectionLabel>Genel Degerlendirme</SectionLabel>
                <textarea
                  value={form.brain_general}
                  onChange={(e) => set("brain_general", e.target.value)}
                  rows={3}
                  placeholder={"orn: Serebral hemisferler simetrik. Gri-beyaz madde farklilasma normal.\nVentrikuler sistem normal boyutta, simetrik.\nOrta hat yapilarinda kayma yok."}
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>

              {/* Fokal lezyonlar */}
              <div>
                <SectionLabel>Fokal Lezyon(lar)</SectionLabel>
                <div className="space-y-3">
                  {form.brain_lesions.map((lesion, idx) => (
                    <BrainLesionForm
                      key={idx}
                      lesion={lesion}
                      index={idx}
                      onChange={(l) => updateBrainLesion(idx, l)}
                      onRemove={() => removeBrainLesion(idx)}
                      canRemove={form.brain_lesions.length > 1}
                    />
                  ))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-2 text-xs"
                  onClick={addBrainLesion}
                >
                  + Lezyon Ekle
                </Button>
              </div>

              {/* Diger bulgular */}
              <div>
                <SectionLabel>Diger Bulgular</SectionLabel>
                <textarea
                  value={form.brain_other}
                  onChange={(e) => set("brain_other", e.target.value)}
                  rows={2}
                  placeholder="orn: Beyaz cevherde T2/FLAIR hiperintens odaklar. SWI'da mikrokanama. Sinuslerde retansiyon kisti."
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Spinal MRI Bulgulari ─────────────────────────────────── */}
        {showSpine && (
          <Card>
            <CardHeader>
              <CardTitle>3. Spinal MRI Bulgulari</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <SectionLabel>Genel Degerlendirme</SectionLabel>
                <textarea
                  value={form.spine_general}
                  onChange={(e) => set("spine_general", e.target.value)}
                  rows={3}
                  placeholder={"orn: Lomber lordoz duzlesmis. L4-L5 ve L5-S1 disk yukseklikleri azalmis.\nSpinal kord normal kalibre ve sinyal ozelliklerinde.\nKonus medullaris L1 seviyesinde sonlaniyor."}
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>
              <div>
                <SectionLabel>Fokal Lezyon(lar)</SectionLabel>
                <div className="space-y-3">
                  {form.spine_lesions.map((lesion, idx) => (
                    <SpineLesionForm
                      key={idx} lesion={lesion} index={idx}
                      onChange={(l) => updateSpineLesion(idx, l)}
                      onRemove={() => removeSpineLesion(idx)}
                      canRemove={form.spine_lesions.length > 1}
                    />
                  ))}
                </div>
                <Button type="button" variant="ghost" className="mt-2 text-xs" onClick={addSpineLesion}>
                  + Lezyon Ekle
                </Button>
              </div>
              <div>
                <SectionLabel>Diger Bulgular</SectionLabel>
                <textarea
                  value={form.spine_other}
                  onChange={(e) => set("spine_other", e.target.value)}
                  rows={2}
                  placeholder="orn: Faset artropati, ligamentum flavum hipertrofisi, sakroiliit bulgulari..."
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Toraks Bulgulari ───────────────────────────────────────── */}
        {showThorax && (
          <Card>
            <CardHeader>
              <CardTitle>3. Toraks Goruntuleme Bulgulari</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <SectionLabel>Genel Degerlendirme</SectionLabel>
                <textarea
                  value={form.thorax_general}
                  onChange={(e) => set("thorax_general", e.target.value)}
                  rows={3}
                  placeholder={"orn: Akciger parankim penceresi: bilateral buzlu cam alanlari.\nMediasten: patolojik LAP yok.\nPlevra: bilateral minimal efuzyon.\nKardiyak siluet normal."}
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>
              <div>
                <SectionLabel>Fokal Lezyon(lar)</SectionLabel>
                <div className="space-y-3">
                  {form.thorax_lesions.map((lesion, idx) => (
                    <ThoraxLesionForm
                      key={idx} lesion={lesion} index={idx}
                      onChange={(l) => updateThoraxLesion(idx, l)}
                      onRemove={() => removeThoraxLesion(idx)}
                      canRemove={form.thorax_lesions.length > 1}
                    />
                  ))}
                </div>
                <Button type="button" variant="ghost" className="mt-2 text-xs" onClick={addThoraxLesion}>
                  + Lezyon Ekle
                </Button>
              </div>
              <div>
                <SectionLabel>Diger Bulgular</SectionLabel>
                <textarea
                  value={form.thorax_other}
                  onChange={(e) => set("thorax_other", e.target.value)}
                  rows={2}
                  placeholder="orn: Plevral efuzyon, perikardial efuzyon, pulmoner emboli, aort anevrizmas..."
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Pelvik MRI Bulgulari ───────────────────────────────────── */}
        {showPelvis && (
          <Card>
            <CardHeader>
              <CardTitle>3. Pelvik MRI Bulgulari</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <SectionLabel>Genel Degerlendirme</SectionLabel>
                <textarea
                  value={form.pelvis_general}
                  onChange={(e) => set("pelvis_general", e.target.value)}
                  rows={3}
                  placeholder={form.gender === "Kadin"
                    ? "orn: Uterus antever pozisyonda, normal boyutta. Overler bilateral normal.\nEndometrium kalinligi 8mm, homojen.\nDouglas'ta minimal sivi."
                    : "orn: Prostat boyut: 45cc. Periferik zon homojen.\nSeminal vezikuller simetrik.\nMesane duvari duzgun."}
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>
              <div>
                <SectionLabel>Fokal Lezyon(lar)</SectionLabel>
                <div className="space-y-3">
                  {form.pelvis_lesions.map((lesion, idx) => (
                    <PelvisLesionForm
                      key={idx} lesion={lesion} index={idx}
                      onChange={(l) => updatePelvisLesion(idx, l)}
                      onRemove={() => removePelvisLesion(idx)}
                      canRemove={form.pelvis_lesions.length > 1}
                      gender={form.gender}
                    />
                  ))}
                </div>
                <Button type="button" variant="ghost" className="mt-2 text-xs" onClick={addPelvisLesion}>
                  + Lezyon Ekle
                </Button>
              </div>
              <div>
                <SectionLabel>Diger Bulgular</SectionLabel>
                <textarea
                  value={form.pelvis_other}
                  onChange={(e) => set("pelvis_other", e.target.value)}
                  rows={2}
                  placeholder="orn: Pelvik LAP, kemik metastazi, asit, endometriozis implantlari..."
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── DICOM (Opsiyonel) ──────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>DICOM Goruntuleri (Opsiyonel)</CardTitle>
          </CardHeader>
          <CardContent>
            <DicomDropzone files={dicomFiles} onFiles={setDicomFiles} />
            <p className="text-xs text-zinc-400 mt-2">
              Goruntu yuklerseniz ajan hem metin bulgularini hem de goruntuyu birlikte degerlendirir.
            </p>
          </CardContent>
        </Card>

        {/* ─── Dogrulama Uyarilari ──────────────────────────────────── */}
        {showAbdomen && (() => {
          const warnings: string[] = [];
          const hasLesion = form.lesions.some(l => l.location || l.size_mm);
          if (hasLesion && !form.cirrhosis && form.indication.toLowerCase().includes("hcc")) {
            warnings.push("Siroz isareti secilmedi - LI-RADS skorlamasi dogrulugundan emin olun");
          }
          if (hasLesion) {
            const noArterial = form.lesions.some(l => (l.location || l.size_mm) && !l.arterial_enhancement);
            if (noArterial) {
              warnings.push("Arteriyel faz bilgisi eksik - LI-RADS APHE kriteri degerlendirilemez");
            }
          }
          if (form.cirrhosis && !hasLesion) {
            warnings.push("Siroz mevcut ama fokal lezyon tanimlanmamis");
          }
          if (form.sequences.length === 0 && hasLesion) {
            warnings.push("MRI sekanslari secilmedi - teknik degerlendirme eksik kalabilir");
          }
          if (warnings.length === 0) return null;
          return (
            <div className="space-y-1">
              {warnings.map((w, i) => (
                <div key={i} className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5">
                  {w}
                </div>
              ))}
            </div>
          );
        })()}

        {/* ─── Hata & Submit ──────────────────────────────────────────── */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Ajan analiz ediyor..." : "Analizi Baslat"}
          </Button>
          {loading && (
            <span className="text-xs text-zinc-400 self-center">
              Bu islem 30-60 saniye surebilir
            </span>
          )}
        </div>
      </form>

      {/* Streaming rapor */}
      <ReportViewer text={report} loading={loading} />

      {/* Güven Skoru & Açıklanabilirlik (rapor tamamlandığında) */}
      {!loading && confidenceData && (
        <ConfidencePanel data={confidenceData} />
      )}

      {/* Sistematik Tarama Checklist */}
      {checklistItems.length > 0 && (
        <ChecklistPanel
          items={checklistItems}
          title={checklistTitle}
          checked={checklistChecked}
          onToggle={(id) => setChecklistChecked(prev => ({ ...prev, [id]: !prev[id] }))}
        />
      )}

      {/* Takip sorulari */}
      {report && !loading && (
        <Card>
          <CardHeader>
            <CardTitle>Takip Sorusu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Onceki takip mesajlari */}
            {followups.map((msg, i) => (
              <div
                key={i}
                className={`text-sm rounded-md px-3 py-2 ${
                  msg.role === "user"
                    ? "bg-zinc-100 text-zinc-800 ml-8"
                    : "bg-white border border-zinc-200 mr-4"
                }`}
              >
                <div className="text-xs text-zinc-400 mb-1">
                  {msg.role === "user" ? "Siz" : "Radyolog Ajan"}
                </div>
                {msg.role === "assistant" ? (
                  <ReportViewer text={msg.content} loading={false} />
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            ))}

            {/* Aktif streaming yanit */}
            {followupStream && (
              <div className="text-sm bg-white border border-zinc-200 rounded-md px-3 py-2 mr-4">
                <div className="text-xs text-zinc-400 mb-1">
                  Radyolog Ajan
                  <span className="inline-block w-1.5 h-3 bg-zinc-700 animate-pulse rounded-sm ml-1" />
                </div>
                <ReportViewer text={followupStream} loading={true} />
              </div>
            )}

            {/* Soru girisi */}
            <form onSubmit={handleFollowup} className="flex gap-2">
              <input
                type="text"
                value={followupQ}
                onChange={(e) => setFollowupQ(e.target.value)}
                placeholder="Takip sorusu sorun... (orn: Bu lezyon FNH olabilir mi?)"
                disabled={followupLoading}
                className="flex-1 border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
              <Button type="submit" disabled={followupLoading || !followupQ.trim()}>
                {followupLoading ? "..." : "Sor"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Kaydetme + LI-RADS paneli */}
      {report && !loading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Raporu Kaydet</span>
              {savedPack?.content?.lirads && (
                <LiradsBadge
                  category={savedPack.content.lirads.category}
                  label={savedPack.content.lirads.label}
                />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {savedPack ? (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-md px-3 py-2 text-sm text-green-800">
                  Vaka <strong>{savedPack.case_id}</strong> basariyla kaydedildi.
                </div>

                {savedPack.content?.lirads && showAbdomen && (
                  <div className="bg-zinc-50 border border-zinc-200 rounded-md p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-700">LI-RADS Skoru:</span>
                      <LiradsBadge
                        category={savedPack.content.lirads.category}
                        label={savedPack.content.lirads.label}
                      />
                    </div>
                    {savedPack.content.lirads.applied_criteria?.length > 0 && (
                      <div className="text-xs text-zinc-500">
                        Uygulanan kriterler: {savedPack.content.lirads.applied_criteria.join(", ")}
                      </div>
                    )}
                    {savedPack.content.lirads.ancillary_favor_hcc?.length > 0 && (
                      <div className="text-xs text-zinc-500">
                        HCC lehine yardimci: {savedPack.content.lirads.ancillary_favor_hcc.join(", ")}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 text-xs">
                  <span className="text-zinc-400">Imza: {savedPack.signature?.slice(0, 16)}...</span>
                  <span className="text-zinc-400">|</span>
                  <Link
                    href={`/cases/${savedPack.case_id}`}
                    className="text-zinc-600 hover:underline"
                  >
                    Vakaya git &rarr;
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">
                      Vaka ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={caseId}
                      onChange={(e) => setCaseId(e.target.value)}
                      placeholder="orn: CASE-1001"
                      className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">
                      Hasta ID (opsiyonel)
                    </label>
                    <input
                      type="text"
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                      placeholder="orn: P-00001"
                      className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? "Kaydediliyor..." : "Kaydet & LI-RADS Skorla"}
                  </Button>
                  <span className="text-xs text-zinc-400">
                    Ajan raporu + LI-RADS skoru + imzali audit pack olusturulur
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
