"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getToken, clearToken } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

// ── Tipler ────────────────────────────────────────────────────────────────────
type ClinicalForm = {
  region: "abdomen" | "brain" | "both";
  age: string;
  gender: string;
  indication: string;
  contrast: boolean;
  contrast_agent: string;
  risk_factors: string;
  notes: string;
};

const defaultForm: ClinicalForm = {
  region: "abdomen",
  age: "",
  gender: "",
  indication: "",
  contrast: true,
  contrast_agent: "",
  risk_factors: "",
  notes: "",
};

// ── DICOM Yükleme Alanı ───────────────────────────────────────────────────────
function DicomDropzone({
  files,
  onFiles,
}: {
  files: File[];
  onFiles: (f: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function add(incoming: FileList | null) {
    if (!incoming) return;
    const arr = Array.from(incoming);
    onFiles([...files, ...arr]);
  }

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      add(e.dataTransfer.files);
    },
    [files]
  );

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragging
            ? "border-zinc-500 bg-zinc-100"
            : "border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50"
        }`}
      >
        <div className="text-sm text-zinc-500">
          DICOM dosyalarını buraya sürükleyin veya tıklayın
        </div>
        <div className="text-xs text-zinc-400 mt-1">
          (.dcm, .dicom — birden fazla seçilebilir)
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".dcm,.dicom,application/dicom"
          className="hidden"
          onChange={(e) => add(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-2 space-y-1">
          {files.map((f, i) => (
            <li
              key={i}
              className="flex items-center justify-between text-xs bg-zinc-50 border border-zinc-200 rounded px-3 py-1"
            >
              <span className="font-mono truncate max-w-[80%]">{f.name}</span>
              <button
                type="button"
                onClick={() => onFiles(files.filter((_, j) => j !== i))}
                className="text-zinc-400 hover:text-red-500 ml-2 font-bold"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Streaming Rapor Görüntüleyici ─────────────────────────────────────────────
function ReportViewer({ text, loading }: { text: string; loading: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [text]);

  if (!text && !loading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Radyolog Ajan Raporu
          {loading && (
            <span className="inline-block w-2 h-4 bg-zinc-700 animate-pulse rounded-sm" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <pre
          className="whitespace-pre-wrap font-sans text-sm text-zinc-800 leading-relaxed"
          style={{ fontFamily: "inherit" }}
        >
          {text}
        </pre>
        <div ref={bottomRef} />
      </CardContent>
    </Card>
  );
}

// ── Ana Sayfa ─────────────────────────────────────────────────────────────────
export default function AgentPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  const [form, setForm] = useState<ClinicalForm>(defaultForm);
  const [dicomFiles, setDicomFiles] = useState<File[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
    } else {
      setAuthed(true);
    }
  }, []);

  function set<K extends keyof ClinicalForm>(key: K, val: ClinicalForm[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setReport("");

    if (!form.indication.trim()) {
      setError("Endikasyon alanı zorunludur.");
      return;
    }

    const token = getToken();
    if (!token) { clearToken(); router.replace("/"); return; }

    const body = new FormData();
    body.append("clinical_json", JSON.stringify(form));
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

        // Satırları ayır, "data: {...}" parse et
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";  // son yarım satır buffer'da kalsın

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
      alert("Rapor kopyalandı ✅");
    } catch {
      alert("Kopyalanamadı");
    }
  }

  if (!authed) return null;

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-zinc-600 hover:underline">
            ← Cases
          </Link>
          <h1 className="text-xl font-semibold mt-1">Radyolog Ajan</h1>
          <p className="text-sm text-zinc-500">
            MRI vakasını yapılandırılmış radyolog akıl yürütmesiyle analiz eder
          </p>
        </div>
        {report && (
          <Button variant="secondary" onClick={copyReport}>
            Raporu Kopyala
          </Button>
        )}
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Vaka Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Bölge */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                İnceleme Bölgesi <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                {(["abdomen", "brain", "both"] as const).map((r) => (
                  <label key={r} className="flex items-center gap-1.5 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="region"
                      value={r}
                      checked={form.region === r}
                      onChange={() => set("region", r)}
                      className="accent-zinc-700"
                    />
                    {r === "abdomen" ? "Abdomen" : r === "brain" ? "Beyin" : "Her ikisi"}
                  </label>
                ))}
              </div>
            </div>

            {/* Yaş + Cinsiyet */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Yaş</label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={form.age}
                  onChange={(e) => set("age", e.target.value)}
                  placeholder="Örnek: 58"
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
                  <option value="">Belirtilmemiş</option>
                  <option value="Erkek">Erkek</option>
                  <option value="Kadın">Kadın</option>
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
                placeholder="Örnek: Karaciğerde fokal lezyon – HCC ekarte edilmesi istenmiştir. Bilinen HCV(+) siroz."
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
                Kontrastlı çekim yapıldı
              </label>
              {form.contrast && (
                <input
                  type="text"
                  value={form.contrast_agent}
                  onChange={(e) => set("contrast_agent", e.target.value)}
                  placeholder="Kontrast ajanı (ör: Gadoxetate / Primovist, Gadobutrol)"
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              )}
            </div>

            {/* Risk faktörleri */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Risk Faktörleri
              </label>
              <input
                type="text"
                value={form.risk_factors}
                onChange={(e) => set("risk_factors", e.target.value)}
                placeholder="Örnek: Siroz (Child-A), HBsAg(+), AFP 42 ng/mL, DM, hipertansiyon"
                className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
            </div>

            {/* Ek notlar */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Ek Klinik Not / Önceki Tetkik
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={2}
                placeholder="Örnek: 6 ay önce çekilen MRI'da segment 6'da 12 mm lezyon izlenmişti."
                className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
            </div>

            {/* DICOM yükleme */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                DICOM Görüntüler{" "}
                <span className="text-zinc-400 font-normal">
                  (opsiyonel – T2, DWI, post-kontrast seriler önerilir)
                </span>
              </label>
              <DicomDropzone files={dicomFiles} onFiles={setDicomFiles} />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Ajan analiz ediyor…" : "Analizi Başlat"}
              </Button>
              {loading && (
                <span className="text-xs text-zinc-400 self-center">
                  Bu işlem 30-60 saniye sürebilir
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Streaming rapor */}
      <ReportViewer text={report} loading={loading} />
    </div>
  );
}
