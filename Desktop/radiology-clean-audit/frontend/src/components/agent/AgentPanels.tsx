"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { ConfidenceData, CriticalFinding, ChecklistItem, LabResult } from "@/types/agent";

// ── DICOM Yukleme Alani ───────────────────────────────────────────────────────
export function DicomDropzone({
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
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          dragging
            ? "border-zinc-500 bg-zinc-100"
            : "border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50"
        }`}
      >
        <div className="text-sm text-zinc-500">
          DICOM dosyalarini buraya surukleyin veya tiklayin
        </div>
        <div className="text-xs text-zinc-400 mt-1">
          (.dcm, .dicom — birden fazla secilebilir)
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
                x
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Sekans Secici ─────────────────────────────────────────────────────────────
export function SequenceSelector({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (s: string[]) => void;
}) {
  function toggle(seq: string) {
    if (selected.includes(seq)) {
      onChange(selected.filter((s) => s !== seq));
    } else {
      onChange([...selected, seq]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((seq) => (
        <label
          key={seq}
          className={`flex items-center gap-1.5 cursor-pointer text-xs px-2.5 py-1.5 rounded-md border transition-colors ${
            selected.includes(seq)
              ? "bg-zinc-800 text-white border-zinc-800"
              : "bg-white text-zinc-600 border-zinc-300 hover:border-zinc-400"
          }`}
        >
          <input
            type="checkbox"
            checked={selected.includes(seq)}
            onChange={() => toggle(seq)}
            className="hidden"
          />
          {seq}
        </label>
      ))}
    </div>
  );
}

// ── Streaming Rapor Goruntuleyici ─────────────────────────────────────────────
export function ReportViewer({ text, loading }: { text: string; loading: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [text]);

  if (!text && !loading) return null;

  const formatted = text.split("\n").map((line, i) => {
    if (line.startsWith("## ")) {
      return (
        <h2 key={i} className="text-base font-bold text-zinc-900 mt-5 mb-2 border-b border-zinc-200 pb-1">
          {line.slice(3)}
        </h2>
      );
    }
    if (line.startsWith("**") && line.endsWith("**")) {
      return (
        <p key={i} className="font-semibold text-zinc-800 mt-3 mb-1">
          {line.slice(2, -2)}
        </p>
      );
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      return (
        <li key={i} className="ml-4 text-sm text-zinc-700 list-disc">
          {line.slice(2)}
        </li>
      );
    }
    if (line.startsWith("| ")) {
      return (
        <p key={i} className="font-mono text-xs text-zinc-600 bg-zinc-50 px-2 py-0.5">
          {line}
        </p>
      );
    }
    if (line.trim() === "---") {
      return <hr key={i} className="my-3 border-zinc-200" />;
    }
    if (line.trim() === "") {
      return <br key={i} />;
    }
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className="text-sm text-zinc-700 leading-relaxed">
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={j} className="text-zinc-800">{part.slice(2, -2)}</strong>
          ) : (
            <span key={j}>{part}</span>
          )
        )}
      </p>
    );
  });

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
        <div className="space-y-0">{formatted}</div>
        <div ref={bottomRef} />
      </CardContent>
    </Card>
  );
}

// ── Guven Skoru Gosterici ─────────────────────────────────────────────────────
export function ConfidencePanel({ data }: { data: ConfidenceData | null }) {
  if (!data) return null;
  const score = data.overall_confidence ?? 0;
  const color = score >= 80 ? "text-green-700 bg-green-50 border-green-200" :
    score >= 50 ? "text-yellow-700 bg-yellow-50 border-yellow-200" :
    "text-red-700 bg-red-50 border-red-200";
  const barColor = score >= 80 ? "bg-green-500" : score >= 50 ? "bg-yellow-500" : "bg-red-500";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Guven Skoru & Aciklanabilirlik</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`flex items-center gap-4 p-3 rounded-lg border ${color}`}>
          <div className="text-3xl font-bold">{score}%</div>
          <div className="flex-1">
            <div className="text-sm font-medium mb-1">Genel Guven Skoru</div>
            <div className="w-full bg-zinc-200 rounded-full h-2.5">
              <div className={`h-2.5 rounded-full ${barColor}`} style={{ width: `${score}%` }} />
            </div>
          </div>
        </div>

        {data.diagnosis_confidence?.primary && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-zinc-700">Primer Tani</div>
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-zinc-800">
                  {data.diagnosis_confidence.primary.diagnosis}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  data.diagnosis_confidence.primary.confidence >= 80 ? "bg-green-100 text-green-800" :
                  data.diagnosis_confidence.primary.confidence >= 50 ? "bg-yellow-100 text-yellow-800" :
                  "bg-red-100 text-red-800"
                }`}>
                  {data.diagnosis_confidence.primary.confidence}%
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {data.diagnosis_confidence.primary.reasoning}
              </p>
            </div>
          </div>
        )}

        {data.diagnosis_confidence?.alternatives && data.diagnosis_confidence.alternatives.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-zinc-700">Alternatif Tanilar</div>
            {data.diagnosis_confidence.alternatives.map((alt, i) => (
              <div key={i} className="flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded px-3 py-2">
                <div>
                  <span className="text-sm text-zinc-700">{alt.diagnosis}</span>
                  <span className="text-xs text-zinc-400 ml-2">{alt.reasoning}</span>
                </div>
                <span className="text-xs font-bold text-zinc-500">{alt.confidence}%</span>
              </div>
            ))}
          </div>
        )}

        {data.data_quality && (
          <div className="space-y-1">
            <div className="text-sm font-semibold text-zinc-700">Veri Kalitesi: {data.data_quality.score}%</div>
            {data.data_quality.limiting_factors && data.data_quality.limiting_factors.length > 0 && (
              <ul className="text-xs text-zinc-500 list-disc ml-4">
                {data.data_quality.limiting_factors.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {data.key_findings && data.key_findings.length > 0 && (
          <div className="space-y-1">
            <div className="text-sm font-semibold text-zinc-700">Kilit Bulgular</div>
            {data.key_findings.map((kf, i) => (
              <div key={i} className={`text-xs px-2 py-1 rounded border ${
                kf.significance === "critical" ? "bg-red-50 border-red-200 text-red-700" :
                kf.significance === "significant" ? "bg-amber-50 border-amber-200 text-amber-700" :
                "bg-zinc-50 border-zinc-200 text-zinc-600"
              }`}>
                <strong>{kf.finding}</strong>
                <span className="text-zinc-400 ml-1">— {kf.supports}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Kritik Bulgu Alarm Banner ────────────────────────────────────────────────
export function CriticalAlertBanner({ findings }: { findings: CriticalFinding[] }) {
  if (!findings || findings.length === 0) return null;
  const hasCritical = findings.some(f => f.level === "critical");
  return (
    <div className={`rounded-lg border-2 p-4 space-y-3 ${
      hasCritical ? "bg-red-50 border-red-400" : "bg-amber-50 border-amber-400"
    }`}>
      <div className="flex items-center gap-2">
        <span className={`text-lg font-bold ${hasCritical ? "text-red-700" : "text-amber-700"}`}>
          {hasCritical ? "KRITIK BULGU ALARMI" : "ONEMLI BULGULAR"}
        </span>
      </div>
      {findings.map((f, i) => (
        <div key={i} className={`rounded-md p-3 ${
          f.level === "critical" ? "bg-red-100 border border-red-300" :
          f.level === "urgent" ? "bg-orange-100 border border-orange-300" :
          "bg-yellow-100 border border-yellow-300"
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold uppercase px-1.5 py-0.5 rounded ${
              f.level === "critical" ? "bg-red-600 text-white" :
              f.level === "urgent" ? "bg-orange-600 text-white" :
              "bg-yellow-600 text-white"
            }`}>{f.level}</span>
            <span className="text-sm font-semibold text-zinc-800">{f.message}</span>
          </div>
          <p className="text-xs text-zinc-600 ml-1">{f.action}</p>
        </div>
      ))}
    </div>
  );
}

// ── Sistematik Tarama Checklist ──────────────────────────────────────────────
export function ChecklistPanel({
  items, title, checked, onToggle,
}: {
  items: ChecklistItem[]; title: string;
  checked: Record<string, boolean>; onToggle: (id: string) => void;
}) {
  const total = items.length;
  const done = Object.values(checked).filter(Boolean).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const categories = [...new Set(items.map(it => it.category))];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <span className={`text-sm font-normal px-2 py-0.5 rounded-full ${
            pct === 100 ? "bg-green-100 text-green-700" :
            pct >= 50 ? "bg-yellow-100 text-yellow-700" :
            "bg-zinc-100 text-zinc-600"
          }`}>
            {done}/{total} ({pct}%)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="w-full bg-zinc-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${pct === 100 ? "bg-green-500" : "bg-zinc-600"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {categories.map(cat => (
          <div key={cat}>
            <div className="text-xs font-semibold text-zinc-500 mb-1">{cat}</div>
            {items.filter(it => it.category === cat).map(it => (
              <label key={it.id} className="flex items-center gap-2 cursor-pointer py-0.5">
                <input
                  type="checkbox"
                  checked={!!checked[it.id]}
                  onChange={() => onToggle(it.id)}
                  className="h-3.5 w-3.5 accent-green-600 rounded"
                />
                <span className={`text-xs ${checked[it.id] ? "text-zinc-400 line-through" : "text-zinc-700"}`}>
                  {it.label}
                </span>
              </label>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Lab Sonuclari Paneli ─────────────────────────────────────────────────────
const COMMON_TESTS = [
  { name: "AFP", unit: "ng/mL", ref: "0-10" },
  { name: "ALT (SGPT)", unit: "U/L", ref: "7-56" },
  { name: "AST (SGOT)", unit: "U/L", ref: "10-40" },
  { name: "GGT", unit: "U/L", ref: "9-48" },
  { name: "ALP", unit: "U/L", ref: "44-147" },
  { name: "Total Bilirubin", unit: "mg/dL", ref: "0.1-1.2" },
  { name: "Direkt Bilirubin", unit: "mg/dL", ref: "0-0.3" },
  { name: "Albumin", unit: "g/dL", ref: "3.5-5.5" },
  { name: "INR", unit: "", ref: "0.8-1.1" },
  { name: "Trombosit", unit: "x10\u00B3/\u00B5L", ref: "150-400" },
  { name: "Kreatinin", unit: "mg/dL", ref: "0.7-1.3" },
  { name: "PSA", unit: "ng/mL", ref: "0-4" },
  { name: "CA 19-9", unit: "U/mL", ref: "0-37" },
  { name: "CEA", unit: "ng/mL", ref: "0-5" },
  { name: "CA-125", unit: "U/mL", ref: "0-35" },
  { name: "HbA1c", unit: "%", ref: "4-5.6" },
  { name: "LDH", unit: "U/L", ref: "140-280" },
];

export function LabPanel({
  labs, onAdd, onRemove,
}: {
  labs: LabResult[];
  onAdd: (lab: LabResult) => void;
  onRemove: (idx: number) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newLab, setNewLab] = useState<LabResult>({
    patient_id: "", test_name: "", value: "", unit: "",
    reference_range: "", is_abnormal: "normal", test_date: "",
  });

  function selectCommon(name: string) {
    const tpl = COMMON_TESTS.find(t => t.name === name);
    if (tpl) {
      setNewLab(l => ({ ...l, test_name: tpl.name, unit: tpl.unit, reference_range: tpl.ref }));
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-zinc-700">Laboratuvar Sonuclari</span>
        <button type="button" onClick={() => setAdding(!adding)}
          className="text-xs text-zinc-500 hover:text-zinc-700 underline">
          {adding ? "Kapat" : "+ Lab Ekle"}
        </button>
      </div>

      {adding && (
        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 space-y-2">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Hizli Secim</label>
            <select onChange={(e) => selectCommon(e.target.value)}
              className="w-full border border-zinc-300 rounded-md px-2 py-1.5 text-sm">
              <option value="">Test secin...</option>
              {COMMON_TESTS.map(t => (
                <option key={t.name} value={t.name}>{t.name} ({t.ref} {t.unit})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-zinc-500 mb-0.5">Test Adi</label>
              <input type="text" value={newLab.test_name}
                onChange={(e) => setNewLab(l => ({ ...l, test_name: e.target.value }))}
                className="w-full border border-zinc-300 rounded px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-0.5">Deger</label>
              <input type="text" value={newLab.value}
                onChange={(e) => setNewLab(l => ({ ...l, value: e.target.value }))}
                className="w-full border border-zinc-300 rounded px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-0.5">Durum</label>
              <select value={newLab.is_abnormal}
                onChange={(e) => setNewLab(l => ({ ...l, is_abnormal: e.target.value }))}
                className="w-full border border-zinc-300 rounded px-2 py-1 text-sm">
                <option value="normal">Normal</option>
                <option value="high">Yuksek</option>
                <option value="low">Dusuk</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-zinc-500 mb-0.5">Birim</label>
              <input type="text" value={newLab.unit}
                onChange={(e) => setNewLab(l => ({ ...l, unit: e.target.value }))}
                className="w-full border border-zinc-300 rounded px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-0.5">Referans</label>
              <input type="text" value={newLab.reference_range}
                onChange={(e) => setNewLab(l => ({ ...l, reference_range: e.target.value }))}
                className="w-full border border-zinc-300 rounded px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-0.5">Tarih</label>
              <input type="date" value={newLab.test_date}
                onChange={(e) => setNewLab(l => ({ ...l, test_date: e.target.value }))}
                className="w-full border border-zinc-300 rounded px-2 py-1 text-sm" />
            </div>
          </div>
          <button type="button" onClick={() => {
            if (newLab.test_name && newLab.value) {
              onAdd(newLab);
              setNewLab({ patient_id: "", test_name: "", value: "", unit: "", reference_range: "", is_abnormal: "normal", test_date: "" });
            }
          }} className="text-xs bg-zinc-800 text-white px-3 py-1 rounded hover:bg-zinc-700">
            Ekle
          </button>
        </div>
      )}

      {labs.length > 0 && (
        <div className="space-y-1">
          {labs.map((lab, i) => (
            <div key={i} className={`flex items-center justify-between text-xs px-2 py-1 rounded border ${
              lab.is_abnormal === "high" ? "bg-red-50 border-red-200" :
              lab.is_abnormal === "low" ? "bg-blue-50 border-blue-200" :
              "bg-zinc-50 border-zinc-200"
            }`}>
              <span>
                <strong>{lab.test_name}</strong>: {lab.value} {lab.unit}
                {lab.is_abnormal === "high" && <span className="text-red-600 ml-1 font-bold">&uarr;</span>}
                {lab.is_abnormal === "low" && <span className="text-blue-600 ml-1 font-bold">&darr;</span>}
                {lab.reference_range && <span className="text-zinc-400 ml-1">(Ref: {lab.reference_range})</span>}
              </span>
              <button type="button" onClick={() => onRemove(i)}
                className="text-zinc-400 hover:text-red-500 ml-2">x</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Prior Vakalari Paneli ────────────────────────────────────────────────────
export function PriorCasesPanel({
  priorCases, onSelect,
}: {
  priorCases: PriorCase[];
  onSelect: (cases: PriorCase[]) => void;
}) {
  if (!priorCases || priorCases.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-zinc-700">Onceki Vakalar ({priorCases.length})</div>
      <div className="space-y-1">
        {priorCases.map((pc, i) => {
          const lirads = pc.content?.lirads || {};
          const dsl = pc.content?.dsl || {};
          return (
            <div key={i} className="flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-xs">
              <div>
                <span className="font-medium text-zinc-700">{pc.case_id}</span>
                <span className="text-zinc-400 ml-2">{pc.generated_at?.split("T")[0]}</span>
                {lirads.category && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-bold ${
                    lirads.category === "LR-5" ? "bg-red-100 text-red-800" :
                    lirads.category === "LR-4" ? "bg-orange-100 text-orange-800" :
                    "bg-zinc-100 text-zinc-700"
                  }`}>{lirads.category}</span>
                )}
                {dsl.lesion_size_mm > 0 && (
                  <span className="text-zinc-400 ml-2">{dsl.lesion_size_mm} mm</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <button type="button" onClick={() => onSelect(priorCases)}
        className="text-xs text-zinc-500 hover:text-zinc-700 underline">
        Karsilastirma icin AI analizine dahil et
      </button>
    </div>
  );
}

// ── LI-RADS Skor Badge ───────────────────────────────────────────────────────
const LIRADS_COLORS: Record<string, string> = {
  "LR-1": "bg-green-100 text-green-800 border-green-300",
  "LR-2": "bg-green-50 text-green-700 border-green-200",
  "LR-3": "bg-yellow-50 text-yellow-800 border-yellow-300",
  "LR-4": "bg-orange-50 text-orange-800 border-orange-300",
  "LR-5": "bg-red-50 text-red-800 border-red-300",
  "LR-M": "bg-purple-50 text-purple-800 border-purple-300",
  "LR-TIV": "bg-red-100 text-red-900 border-red-400",
};

export function AgentLiradsBadge({ category, label }: { category: string; label: string }) {
  const color = LIRADS_COLORS[category] || "bg-zinc-100 text-zinc-800 border-zinc-300";
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${color}`}>
      {label}
    </span>
  );
}

// ── Bolum Baslik Yardimcisi ──────────────────────────────────────────────────
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-zinc-800 border-b border-zinc-100 pb-1 mb-3">
      {children}
    </h3>
  );
}

// ── Tip tanimlari ────────────────────────────────────────────────────────────
export type PriorCase = {
  case_id: string;
  generated_at?: string;
  version?: number;
  content?: {
    lirads?: { category?: string };
    dsl?: { lesion_size_mm?: number };
    [key: string]: unknown;
  };
};
