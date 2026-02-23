"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getToken, clearToken } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

// ── Tipler ────────────────────────────────────────────────────────────────────

type Lesion = {
  location: string;
  size_mm: string;
  t1_signal: string;
  t2_signal: string;
  dwi_restriction: boolean;
  arterial_enhancement: string;
  washout: boolean;
  capsule: boolean;
  peripheral_washout: boolean;
  delayed_central_enhancement: boolean;
  infiltrative: boolean;
  tumor_in_vein: boolean;
  additional: string;
};

type BrainLesion = {
  location: string;
  size_mm: string;
  t1_signal: string;
  t2_flair_signal: string;
  dwi_restriction: boolean;
  enhancement: string;
  perilesional_edema: boolean;
  mass_effect: boolean;
  hemorrhage: boolean;
  necrosis: boolean;
  calcification: boolean;
  midline_shift: boolean;
  additional: string;
};

type SpineLesion = {
  location: string;
  size_mm: string;
  t1_signal: string;
  t2_signal: string;
  dwi_restriction: boolean;
  enhancement: string;
  cord_compression: boolean;
  nerve_root_compression: boolean;
  canal_stenosis: boolean;
  vertebral_fracture: boolean;
  additional: string;
};

type ThoraxLesion = {
  location: string;
  size_mm: string;
  morphology: string;
  density: string;
  enhancement: string;
  cavitation: boolean;
  calcification: boolean;
  spiculation: boolean;
  pleural_contact: boolean;
  lymphadenopathy: boolean;
  additional: string;
};

type PelvisLesion = {
  location: string;
  size_mm: string;
  t1_signal: string;
  t2_signal: string;
  dwi_restriction: boolean;
  enhancement: string;
  invasion: string;
  lymph_nodes: boolean;
  additional: string;
};

type RegionType = "abdomen" | "brain" | "both" | "spine" | "thorax" | "pelvis";

type ClinicalForm = {
  region: RegionType;
  age: string;
  gender: string;
  indication: string;
  contrast: boolean;
  contrast_agent: string;
  risk_factors: string;
  notes: string;
  cirrhosis: boolean;
  // MRI sequences available
  sequences: string[];
  // Abdomen findings
  liver_parenchyma: string;
  lesions: Lesion[];
  other_organs: string;
  vascular: string;
  // Brain findings
  brain_general: string;
  brain_lesions: BrainLesion[];
  brain_other: string;
  // Spine findings
  spine_general: string;
  spine_lesions: SpineLesion[];
  spine_other: string;
  // Thorax findings
  thorax_general: string;
  thorax_lesions: ThoraxLesion[];
  thorax_other: string;
  // Pelvis findings
  pelvis_general: string;
  pelvis_lesions: PelvisLesion[];
  pelvis_other: string;
};

const emptyLesion: Lesion = {
  location: "",
  size_mm: "",
  t1_signal: "",
  t2_signal: "",
  dwi_restriction: false,
  arterial_enhancement: "",
  washout: false,
  capsule: false,
  peripheral_washout: false,
  delayed_central_enhancement: false,
  infiltrative: false,
  tumor_in_vein: false,
  additional: "",
};

const emptyBrainLesion: BrainLesion = {
  location: "",
  size_mm: "",
  t1_signal: "",
  t2_flair_signal: "",
  dwi_restriction: false,
  enhancement: "",
  perilesional_edema: false,
  mass_effect: false,
  hemorrhage: false,
  necrosis: false,
  calcification: false,
  midline_shift: false,
  additional: "",
};

const emptySpineLesion: SpineLesion = {
  location: "",
  size_mm: "",
  t1_signal: "",
  t2_signal: "",
  dwi_restriction: false,
  enhancement: "",
  cord_compression: false,
  nerve_root_compression: false,
  canal_stenosis: false,
  vertebral_fracture: false,
  additional: "",
};

const emptyThoraxLesion: ThoraxLesion = {
  location: "",
  size_mm: "",
  morphology: "",
  density: "",
  enhancement: "",
  cavitation: false,
  calcification: false,
  spiculation: false,
  pleural_contact: false,
  lymphadenopathy: false,
  additional: "",
};

const emptyPelvisLesion: PelvisLesion = {
  location: "",
  size_mm: "",
  t1_signal: "",
  t2_signal: "",
  dwi_restriction: false,
  enhancement: "",
  invasion: "",
  lymph_nodes: false,
  additional: "",
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

const ABDOMEN_SEQUENCES = [
  "T2 HASTE/TSE",
  "T2 Yag Baskilamali",
  "DWI / ADC",
  "T1 In/Out-of-Phase",
  "T1 Pre-kontrast",
  "Arteriyel Faz",
  "Portal Venoz Faz",
  "Gec / Ekuilibrium Faz",
  "Hepatobiliyer Faz (Primovist)",
];

const BRAIN_SEQUENCES = [
  "T1 SE/TSE",
  "T2 TSE",
  "FLAIR",
  "DWI / ADC",
  "SWI / GRE",
  "T1 Post-kontrast",
  "MRA (TOF/Kontrast)",
  "MRS",
  "Perfuzyon",
];

const LIVER_SEGMENTS = [
  "Segment I (kaudat)",
  "Segment II",
  "Segment III",
  "Segment IV",
  "Segment V",
  "Segment VI",
  "Segment VII",
  "Segment VIII",
];

const ABDOMEN_ORGANS = [
  { group: "Karaciger", options: [
    ...LIVER_SEGMENTS.map(s => s),
    "Sag lob (diffuz)",
    "Sol lob (diffuz)",
  ]},
  { group: "Bobrek", options: [
    "Sag bobrek - ust pol",
    "Sag bobrek - orta",
    "Sag bobrek - alt pol",
    "Sol bobrek - ust pol",
    "Sol bobrek - orta",
    "Sol bobrek - alt pol",
    "Sag bobrek - toplayici sistem/pelvis",
    "Sol bobrek - toplayici sistem/pelvis",
  ]},
  { group: "Pankreas", options: [
    "Pankreas basi (caput)",
    "Pankreas boyun (collum)",
    "Pankreas govde (corpus)",
    "Pankreas kuyruk (cauda)",
    "Uncinat proses",
    "Wirsung kanali",
  ]},
  { group: "Dalak", options: [
    "Dalak - ust pol",
    "Dalak - alt pol",
    "Dalak - hilus",
    "Dalak - diffuz",
  ]},
  { group: "Adrenal", options: [
    "Sag adrenal bez",
    "Sol adrenal bez",
  ]},
  { group: "Safra yollari", options: [
    "Safra kesesi",
    "Koledok (CBD)",
    "Intrahepatik safra yollari",
  ]},
  { group: "Diger", options: [
    "Periton",
    "Retroperiton",
    "Mezenter",
    "Lenf nodu",
    "Diger (notta belirtin)",
  ]},
];

const BRAIN_LOCATIONS = [
  { group: "Serebral loblar", options: [
    "Frontal lob",
    "Temporal lob",
    "Parietal lob",
    "Oksipital lob",
    "Insula",
  ]},
  { group: "Derin yapilar", options: [
    "Bazal ganglionlar",
    "Talamus",
    "Hipotalamus",
    "Internal kapsul",
    "Korpus kallozum",
  ]},
  { group: "Posterior fossa", options: [
    "Beyin sapi - mezensefalon",
    "Beyin sapi - pons",
    "Beyin sapi - bulbus",
    "Serebellum - hemisfer",
    "Serebellum - vermis",
    "Serebellopontin kose (CPK)",
  ]},
  { group: "Sellar / Pineal", options: [
    "Sella / Hipofiz",
    "Suprasellar sisterna",
    "Pineal bolge",
  ]},
  { group: "Ekstra-aksiyel", options: [
    "Ekstra-aksiyel (konveksite)",
    "Falks serebri",
    "Tentorium",
    "Intraventrikuler",
    "Epidural",
    "Subdural",
  ]},
  { group: "Diger", options: [
    "Orbita",
    "Kafa kaidesi",
    "Paranazal sinus",
    "Diger (notta belirtin)",
  ]},
];

const SPINE_SEQUENCES = [
  "T1 SE/TSE (sagittal)",
  "T2 TSE (sagittal)",
  "T2 TSE (aksiyel)",
  "STIR / T2 Yag Baskilamali",
  "T1 Post-kontrast (sagittal)",
  "T1 Post-kontrast (aksiyel)",
  "DWI / ADC",
  "T2* GRE / SWI",
  "3D T2 (CISS/FIESTA)",
];

const THORAX_SEQUENCES = [
  "BT (kontrastsiz)",
  "BT (kontrastli)",
  "BT Anjiyografi (pulmoner)",
  "BT Anjiyografi (aort)",
  "HRCT (yuksek cozunurluk)",
  "T2 HASTE",
  "DWI / ADC",
  "T1 Pre-kontrast",
  "T1 Post-kontrast",
  "Kardiyak MRI (sine/CINE)",
];

const PELVIS_SEQUENCES = [
  "T2 TSE (aksiyel)",
  "T2 TSE (sagittal)",
  "T2 TSE (koronal)",
  "T1 TSE (aksiyel)",
  "DWI / ADC",
  "T1 Post-kontrast (dinamik)",
  "T1 Post-kontrast (gec faz)",
  "STIR / T2 Yag Baskilamali",
  "MR Spektroskopi",
];

const SPINE_LOCATIONS = [
  { group: "Servikal", options: [
    "C1 (atlas)", "C2 (aksis)", "C3", "C4", "C5", "C6", "C7",
    "C2-C3 disk", "C3-C4 disk", "C4-C5 disk", "C5-C6 disk", "C6-C7 disk",
    "Servikal spinal kord",
  ]},
  { group: "Torakal", options: [
    "T1", "T2", "T3", "T4", "T5", "T6",
    "T7", "T8", "T9", "T10", "T11", "T12",
    "Torakal spinal kord",
  ]},
  { group: "Lomber", options: [
    "L1", "L2", "L3", "L4", "L5",
    "L1-L2 disk", "L2-L3 disk", "L3-L4 disk", "L4-L5 disk", "L5-S1 disk",
    "Kauda equina",
  ]},
  { group: "Sakral / Diger", options: [
    "Sakrum", "Koksiks",
    "Sakroiliak eklem",
    "Epidural alan",
    "Paravertebral alan",
    "Kraniovertikal biliske",
    "Diger (notta belirtin)",
  ]},
];

const THORAX_LOCATIONS = [
  { group: "Akciger", options: [
    "Sag ust lob",
    "Sag orta lob",
    "Sag alt lob",
    "Sol ust lob",
    "Lingula",
    "Sol alt lob",
    "Bilateral / diffuz",
  ]},
  { group: "Mediasten", options: [
    "Anterior mediasten",
    "Orta mediasten",
    "Posterior mediasten",
    "Hiler (sag)",
    "Hiler (sol)",
    "Subkarinal",
  ]},
  { group: "Plevra / Diger", options: [
    "Sag plevra",
    "Sol plevra",
    "Perikard",
    "Gogus duvari",
    "Trakea / bronş",
    "Aort / buyuk damar",
    "Pulmoner arter",
    "Diger (notta belirtin)",
  ]},
];

const PELVIS_LOCATIONS_MALE = [
  { group: "Prostat", options: [
    "Prostat - periferik zon (sag)",
    "Prostat - periferik zon (sol)",
    "Prostat - transisyonel zon",
    "Prostat - santral zon",
    "Prostat - anterior fibromuskuler stroma",
    "Seminal vezikul (sag)",
    "Seminal vezikul (sol)",
  ]},
  { group: "Mesane / Rektum", options: [
    "Mesane",
    "Rektum",
    "Anal kanal",
  ]},
  { group: "Diger", options: [
    "Pelvik lenf nodu",
    "Pelvik kemik",
    "Sakrum",
    "Femur basi",
    "Diger (notta belirtin)",
  ]},
];

const PELVIS_LOCATIONS_FEMALE = [
  { group: "Uterus", options: [
    "Uterus - endometrium",
    "Uterus - myometrium",
    "Uterus - junctional zone",
    "Serviks",
    "Uterus - fundus",
    "Uterus - korpus",
  ]},
  { group: "Over / Tuba", options: [
    "Sag over",
    "Sol over",
    "Sag tuba",
    "Sol tuba",
    "Douglas boslugu",
  ]},
  { group: "Mesane / Rektum", options: [
    "Mesane",
    "Rektum",
    "Anal kanal",
  ]},
  { group: "Diger", options: [
    "Pelvik lenf nodu",
    "Pelvik kemik",
    "Sakrum",
    "Femur basi",
    "Diger (notta belirtin)",
  ]},
];

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

// ── Sekans secici ─────────────────────────────────────────────────────────────
function SequenceSelector({
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

// ── Abdomen Lezyon Formu ──────────────────────────────────────────────────────
function AbdomenLesionForm({
  lesion,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  lesion: Lesion;
  index: number;
  onChange: (l: Lesion) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  function set<K extends keyof Lesion>(key: K, val: Lesion[K]) {
    onChange({ ...lesion, [key]: val });
  }

  return (
    <div className="border border-zinc-200 rounded-lg p-3 space-y-3 bg-zinc-50/50">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700">
          Lezyon {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-zinc-400 hover:text-red-500"
          >
            Kaldir
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Lokalizasyon</label>
          <select
            value={lesion.location}
            onChange={(e) => set("location", e.target.value)}
            className="w-full border border-zinc-300 rounded-md px-2 py-1.5 text-sm"
          >
            <option value="">Secin...</option>
            {ABDOMEN_ORGANS.map((group) => (
              <optgroup key={group.group} label={group.group}>
                {group.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Boyut (mm)</label>
          <input
            type="number"
            min={0}
            max={300}
            value={lesion.size_mm}
            onChange={(e) => set("size_mm", e.target.value)}
            placeholder="orn: 22"
            className="w-full border border-zinc-300 rounded-md px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">T1 Sinyal</label>
          <select
            value={lesion.t1_signal}
            onChange={(e) => set("t1_signal", e.target.value)}
            className="w-full border border-zinc-300 rounded-md px-2 py-1.5 text-sm"
          >
            <option value="">Belirtilmemis</option>
            <option value="hipointens">Hipointens</option>
            <option value="izointens">Izointens</option>
            <option value="hiperintens">Hiperintens</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">T2 Sinyal</label>
          <select
            value={lesion.t2_signal}
            onChange={(e) => set("t2_signal", e.target.value)}
            className="w-full border border-zinc-300 rounded-md px-2 py-1.5 text-sm"
          >
            <option value="">Belirtilmemis</option>
            <option value="hipointens">Hipointens</option>
            <option value="izointens">Izointens</option>
            <option value="hafif hiperintens">Hafif hiperintens</option>
            <option value="belirgin hiperintens">Belirgin hiperintens (sivi benzeri)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Arteriyel Faz</label>
          <select
            value={lesion.arterial_enhancement}
            onChange={(e) => set("arterial_enhancement", e.target.value)}
            className="w-full border border-zinc-300 rounded-md px-2 py-1.5 text-sm"
          >
            <option value="">Belirtilmemis</option>
            <option value="hiperenhansman (non-rim APHE)">Hiperenhansman (non-rim APHE)</option>
            <option value="rim enhansman">Rim enhansman</option>
            <option value="hipoenhansman">Hipoenhansman</option>
            <option value="izoenhansman">Izoenhansman</option>
          </select>
        </div>
        <div className="flex flex-col justify-end gap-1.5">
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={lesion.dwi_restriction}
              onChange={(e) => set("dwi_restriction", e.target.checked)}
              className="h-3.5 w-3.5 accent-zinc-700"
            />
            <span className="text-xs text-zinc-600">DWI Kisitlanmasi</span>
          </label>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <label className="flex items-center gap-1.5 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={lesion.washout}
            onChange={(e) => set("washout", e.target.checked)}
            className="h-3.5 w-3.5 accent-zinc-700"
          />
          <span className="text-xs text-zinc-600">Washout (portal/gec fazda)</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={lesion.capsule}
            onChange={(e) => set("capsule", e.target.checked)}
            className="h-3.5 w-3.5 accent-zinc-700"
          />
          <span className="text-xs text-zinc-600">Kapsul gorunumu</span>
        </label>
      </div>

      {/* LR-M / LR-TIV Ozellikleri */}
      <div className="border-t border-zinc-200 pt-3 space-y-2">
        <div className="text-xs font-medium text-zinc-500">LR-M / LR-TIV Ozellikleri</div>
        <div className="flex gap-4 flex-wrap">
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={lesion.peripheral_washout}
              onChange={(e) => set("peripheral_washout", e.target.checked)}
              className="h-3.5 w-3.5 accent-purple-700"
            />
            <span className="text-xs text-zinc-600">Periferal washout (targetoid)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={lesion.delayed_central_enhancement}
              onChange={(e) => set("delayed_central_enhancement", e.target.checked)}
              className="h-3.5 w-3.5 accent-purple-700"
            />
            <span className="text-xs text-zinc-600">Gecikmiş santral tutulum (targetoid)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={lesion.infiltrative}
              onChange={(e) => set("infiltrative", e.target.checked)}
              className="h-3.5 w-3.5 accent-purple-700"
            />
            <span className="text-xs text-zinc-600">Infiltratif gorunum</span>
          </label>
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={lesion.tumor_in_vein}
            onChange={(e) => set("tumor_in_vein", e.target.checked)}
            className="h-3.5 w-3.5 accent-red-700"
          />
          <span className="text-xs text-red-700 font-medium">Tumor in Vein (LR-TIV)</span>
        </label>
        {lesion.tumor_in_vein && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
            LR-TIV: Vende tumor invazyonu tum diger LI-RADS kategorilerini gecersiz kilar.
          </p>
        )}
        {(lesion.peripheral_washout || lesion.delayed_central_enhancement || lesion.infiltrative ||
          lesion.arterial_enhancement === "rim enhansman") && !lesion.tumor_in_vein && (
          <p className="text-xs text-purple-600 bg-purple-50 border border-purple-200 rounded px-2 py-1">
            LR-M: Targetoid/infiltratif ozellikler HCC-disi maligniteyi dusundurur (orn: iCCA).
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs text-zinc-500 mb-1">Ek Bulgular</label>
        <input
          type="text"
          value={lesion.additional}
          onChange={(e) => set("additional", e.target.value)}
          placeholder="orn: Mozaik patern, nodul-icinde-nodul, yag icerigi..."
          className="w-full border border-zinc-300 rounded-md px-2 py-1.5 text-sm"
        />
      </div>
    </div>
  );
}

// ── Beyin Lezyon Formu ────────────────────────────────────────────────────────
function BrainLesionForm({
  lesion,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  lesion: BrainLesion;
  index: number;
  onChange: (l: BrainLesion) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  function set<K extends keyof BrainLesion>(key: K, val: BrainLesion[K]) {
    onChange({ ...lesion, [key]: val });
  }

  return (
    <div className="border border-zinc-200 rounded-lg p-3 space-y-3 bg-zinc-50/50">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700">
          Lezyon {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-zinc-400 hover:text-red-500"
          >
            Kaldir
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Lokalizasyon</label>
          <select
            value={lesion.location}
            onChange={(e) => set("location", e.target.value)}
            className="w-full border border-zinc-300 rounded-md px-2 py-1.5 text-sm"
          >
            <option value="">Secin...</option>
            {BRAIN_LOCATIONS.map((group) => (
              <optgroup key={group.group} label={group.group}>
                {group.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Boyut (mm)</label>
          <input
            type="number"
            min={0}
            max={200}
            value={lesion.size_mm}
            onChange={(e) => set("size_mm", e.target.value)}
            placeholder="orn: 15"
            className="w-full border border-zinc-300 rounded-md px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">T1 Sinyal</label>
          <select
            value={lesion.t1_signal}
            onChange={(e) => set("t1_signal", e.target.value)}
            className="w-full border border-zinc-300 rounded-md px-2 py-1.5 text-sm"
          >
            <option value="">Belirtilmemis</option>
            <option value="hipointens">Hipointens</option>
            <option value="izointens">Izointens</option>
            <option value="hiperintens">Hiperintens</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">T2 / FLAIR Sinyal</label>
          <select
            value={lesion.t2_flair_signal}
            onChange={(e) => set("t2_flair_signal", e.target.value)}
            className="w-full border border-zinc-300 rounded-md px-2 py-1.5 text-sm"
          >
            <option value="">Belirtilmemis</option>
            <option value="hipointens">Hipointens</option>
            <option value="izointens">Izointens</option>
            <option value="hiperintens">Hiperintens</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Kontrast Tutulumu</label>
          <select
            value={lesion.enhancement}
            onChange={(e) => set("enhancement", e.target.value)}
            className="w-full border border-zinc-300 rounded-md px-2 py-1.5 text-sm"
          >
            <option value="">Belirtilmemis</option>
            <option value="homojen tutulum">Homojen tutulum</option>
            <option value="heterojen tutulum">Heterojen tutulum</option>
            <option value="rim tutulum">Rim (halka) tutulum</option>
            <option value="tutulum yok">Tutulum yok</option>
          </select>
        </div>
        <div className="flex flex-col justify-end gap-1.5">
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={lesion.dwi_restriction}
              onChange={(e) => set("dwi_restriction", e.target.checked)}
              className="h-3.5 w-3.5 accent-zinc-700"
            />
            <span className="text-xs text-zinc-600">DWI Kisitlanmasi</span>
          </label>
        </div>
      </div>

      {/* Ek ozellikler */}
      <div className="border-t border-zinc-200 pt-3 space-y-2">
        <div className="text-xs font-medium text-zinc-500">Ek Ozellikler</div>
        <div className="flex gap-4 flex-wrap">
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={lesion.perilesional_edema}
              onChange={(e) => set("perilesional_edema", e.target.checked)}
              className="h-3.5 w-3.5 accent-zinc-700"
            />
            <span className="text-xs text-zinc-600">Perilesyonel odem</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={lesion.mass_effect}
              onChange={(e) => set("mass_effect", e.target.checked)}
              className="h-3.5 w-3.5 accent-zinc-700"
            />
            <span className="text-xs text-zinc-600">Kitle etkisi</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={lesion.hemorrhage}
              onChange={(e) => set("hemorrhage", e.target.checked)}
              className="h-3.5 w-3.5 accent-red-700"
            />
            <span className="text-xs text-zinc-600">Kanama / hemosiderin</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={lesion.necrosis}
              onChange={(e) => set("necrosis", e.target.checked)}
              className="h-3.5 w-3.5 accent-zinc-700"
            />
            <span className="text-xs text-zinc-600">Nekroz / kistik alan</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={lesion.calcification}
              onChange={(e) => set("calcification", e.target.checked)}
              className="h-3.5 w-3.5 accent-zinc-700"
            />
            <span className="text-xs text-zinc-600">Kalsifikasyon</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={lesion.midline_shift}
              onChange={(e) => set("midline_shift", e.target.checked)}
              className="h-3.5 w-3.5 accent-red-700"
            />
            <span className="text-xs text-red-700 font-medium">Orta hat kaymasi</span>
          </label>
        </div>
        {lesion.midline_shift && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
            Orta hat kaymasi: Acil norolojik degerlendirme gerekebilir.
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs text-zinc-500 mb-1">Ek Bulgular (serbest metin)</label>
        <input
          type="text"
          value={lesion.additional}
          onChange={(e) => set("additional", e.target.value)}
          placeholder="orn: Dural kuyruk isareti, hemosiderin halkasi, hidrosefali..."
          className="w-full border border-zinc-300 rounded-md px-2 py-1.5 text-sm"
        />
      </div>
    </div>
  );
}

// ── Spinal Lezyon Formu ──────────────────────────────────────────────────────
function SpineLesionForm({
  lesion, index, onChange, onRemove, canRemove,
}: {
  lesion: SpineLesion; index: number;
  onChange: (l: SpineLesion) => void; onRemove: () => void; canRemove: boolean;
}) {
  function set<K extends keyof SpineLesion>(key: K, val: SpineLesion[K]) {
    onChange({ ...lesion, [key]: val });
  }
  return (
    <div className="border border-zinc-200 rounded-lg p-3 space-y-3 bg-zinc-50/50">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700">Lezyon {index + 1}</span>
        {canRemove && (
          <button type="button" onClick={onRemove} className="text-xs text-zinc-400 hover:text-red-500">Kaldir</button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Lokalizasyon</label>
          <select value={lesion.location} onChange={(e) => set("location", e.target.value)}
            className="w-full border border-zinc-300 rounded-md px-2 py-1.5 text-sm">
            <option value="">Secin...</option>
            {SPINE_LOCATIONS.map((group) => (
              <optgroup key={group.group} label={group.group}>
                {group.options.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Boyut (mm)</label>
          <input type="number" min={0} max={300} value={lesion.size_mm}
            onChange={(e) => set("size_mm", e.target.value)} placeholder="orn: 12"
            className="w-full border border-zinc-300 rounded-md px-2 py-1.5 text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">T1 Sinyal</label>
          <select value={lesion.t1_signal} onChange={(e) => set("t1_signal", e.target.value)}
            className="w-full border border-zinc-300 rounded-md px-2 py-1.5 text-sm">
            <option value="">Belirtilmemis</option>
            <option value="hipointens">Hipointens</option>
            <option value="izointens">Izointens</option>
            <option value="hiperintens">Hiperintens</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">T2 Sinyal</label>
          <select value={lesion.t2_signal} onChange={(e) => set("t2_signal", e.target.value)}
            className="w-full border border-zinc-300 rounded-md px-2 py-1.5 text-sm">
            <option value="">Belirtilmemis</option>
            <option value="hipointens">Hipointens</option>
            <option value="izointens">Izointens</option>
            <option value="hiperintens">Hiperintens</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Kontrast Tutulumu</label>
          <select value={lesion.enhancement} onChange={(e) => set("enhancement", e.target.value)}
            className="w-full border border-zinc-300 rounded-md px-2 py-1.5 text-sm">
            <option value="">Belirtilmemis</option>
            <option value="homojen tutulum">Homojen tutulum</option>
            <option value="heterojen tutulum">Heterojen tutulum</option>
            <option value="rim tutulum">Rim tutulum</option>
            <option value="tutulum yok">Tutulum yok</option>
          </select>
        </div>
        <div className="flex flex-col justify-end gap-1.5">
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={lesion.dwi_restriction}
              onChange={(e) => set("dwi_restriction", e.target.checked)}
              className="h-3.5 w-3.5 accent-zinc-700" />
            <span className="text-xs text-zinc-600">DWI Kisitlanmasi</span>
          </label>
        </div>
      </div>
      <div className="border-t border-zinc-200 pt-3 space-y-2">
        <div className="text-xs font-medium text-zinc-500">Kritik Bulgular</div>
        <div className="flex gap-4 flex-wrap">
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={lesion.cord_compression}
              onChange={(e) => set("cord_compression", e.target.checked)}
              className="h-3.5 w-3.5 accent-red-700" />
            <span className="text-xs text-red-700 font-medium">Spinal kord kompresyonu</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={lesion.nerve_root_compression}
              onChange={(e) => set("nerve_root_compression", e.target.checked)}
              className="h-3.5 w-3.5 accent-zinc-700" />
            <span className="text-xs text-zinc-600">Sinir koku kompresyonu</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={lesion.canal_stenosis}
              onChange={(e) => set("canal_stenosis", e.target.checked)}
              className="h-3.5 w-3.5 accent-zinc-700" />
            <span className="text-xs text-zinc-600">Kanal stenozu</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={lesion.vertebral_fracture}
              onChange={(e) => set("vertebral_fracture", e.target.checked)}
              className="h-3.5 w-3.5 accent-red-700" />
            <span className="text-xs text-red-700 font-medium">Vertebra kirigi</span>
          </label>
        </div>
        {lesion.cord_compression && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
            Spinal kord kompresyonu: Acil norolojik degerlendirme gerekebilir!
          </p>
        )}
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Ek Bulgular</label>
        <input type="text" value={lesion.additional} onChange={(e) => set("additional", e.target.value)}
          placeholder="orn: Modic tip I degisiklik, disk sekestrasyon, epidural abse..."
          className="w-full border border-zinc-300 rounded-md px-2 py-1.5 text-sm" />
      </div>
    </div>
  );
}

// ── Toraks Lezyon Formu ─────────────────────────────────────────────────────
function ThoraxLesionForm({
  lesion, index, onChange, onRemove, canRemove,
}: {
  lesion: ThoraxLesion; index: number;
  onChange: (l: ThoraxLesion) => void; onRemove: () => void; canRemove: boolean;
}) {
  function set<K extends keyof ThoraxLesion>(key: K, val: ThoraxLesion[K]) {
    onChange({ ...lesion, [key]: val });
  }
  return (
    <div className="border border-zinc-200 rounded-lg p-3 space-y-3 bg-zinc-50/50">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700">Lezyon {index + 1}</span>
        {canRemove && (
          <button type="button" onClick={onRemove} className="text-xs text-zinc-400 hover:text-red-500">Kaldir</button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Lokalizasyon</label>
          <select value={lesion.location} onChange={(e) => set("location", e.target.value)}
            className="w-full border border-zinc-300 rounded-md px-2 py-1.5 text-sm">
            <option value="">Secin...</option>
            {THORAX_LOCATIONS.map((group) => (
              <optgroup key={group.group} label={group.group}>
                {group.options.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Boyut (mm)</label>
          <input type="number" min={0} max={300} value={lesion.size_mm}
            onChange={(e) => set("size_mm", e.target.value)} placeholder="orn: 18"
            className="w-full border border-zinc-300 rounded-md px-2 py-1.5 text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Morfoloji</label>
          <select value={lesion.morphology} onChange={(e) => set("morphology", e.target.value)}
            className="w-full border border-zinc-300 rounded-md px-2 py-1.5 text-sm">
            <option value="">Belirtilmemis</option>
            <option value="solid nodul">Solid nodul</option>
            <option value="subsolid (buzlu cam)">Subsolid (buzlu cam)</option>
            <option value="kismen solid">Kismen solid (miks)</option>
            <option value="konsolidasyon">Konsolidasyon</option>
            <option value="kitle">Kitle (&gt;3cm)</option>
            <option value="kaviter lezyon">Kaviter lezyon</option>
            <option value="interstisyel patern">Interstisyel patern</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Dansite / Sinyal</label>
          <select value={lesion.density} onChange={(e) => set("density", e.target.value)}
            className="w-full border border-zinc-300 rounded-md px-2 py-1.5 text-sm">
            <option value="">Belirtilmemis</option>
            <option value="yumusak doku">Yumusak doku dansitesinde</option>
            <option value="buzlu cam">Buzlu cam (ground-glass)</option>
            <option value="kalsifiye">Kalsifiye</option>
            <option value="yag iceren">Yag iceren</option>
            <option value="sivi dansitesinde">Sivi dansitesinde</option>
            <option value="hava iceren">Hava iceren</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Kontrast Tutulumu</label>
          <select value={lesion.enhancement} onChange={(e) => set("enhancement", e.target.value)}
            className="w-full border border-zinc-300 rounded-md px-2 py-1.5 text-sm">
            <option value="">Belirtilmemis</option>
            <option value="homojen tutulum">Homojen tutulum</option>
            <option value="heterojen tutulum">Heterojen tutulum</option>
            <option value="rim tutulum">Rim tutulum</option>
            <option value="minimal tutulum">Minimal tutulum</option>
            <option value="tutulum yok">Tutulum yok</option>
          </select>
        </div>
        <div />
      </div>
      <div className="border-t border-zinc-200 pt-3 space-y-2">
        <div className="text-xs font-medium text-zinc-500">Ek Ozellikler</div>
        <div className="flex gap-4 flex-wrap">
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={lesion.spiculation}
              onChange={(e) => set("spiculation", e.target.checked)}
              className="h-3.5 w-3.5 accent-red-700" />
            <span className="text-xs text-red-700 font-medium">Spikülasyon</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={lesion.cavitation}
              onChange={(e) => set("cavitation", e.target.checked)}
              className="h-3.5 w-3.5 accent-zinc-700" />
            <span className="text-xs text-zinc-600">Kavitasyon</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={lesion.calcification}
              onChange={(e) => set("calcification", e.target.checked)}
              className="h-3.5 w-3.5 accent-zinc-700" />
            <span className="text-xs text-zinc-600">Kalsifikasyon</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={lesion.pleural_contact}
              onChange={(e) => set("pleural_contact", e.target.checked)}
              className="h-3.5 w-3.5 accent-zinc-700" />
            <span className="text-xs text-zinc-600">Plevral temas / invazyon</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={lesion.lymphadenopathy}
              onChange={(e) => set("lymphadenopathy", e.target.checked)}
              className="h-3.5 w-3.5 accent-zinc-700" />
            <span className="text-xs text-zinc-600">Lenfadenopati</span>
          </label>
        </div>
        {lesion.spiculation && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
            Spikülasyon: Malignite lehine onemli bir morfolojik bulgu.
          </p>
        )}
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Ek Bulgular</label>
        <input type="text" value={lesion.additional} onChange={(e) => set("additional", e.target.value)}
          placeholder="orn: Tree-in-bud, plevral efuzyon, perikardial efuzyon..."
          className="w-full border border-zinc-300 rounded-md px-2 py-1.5 text-sm" />
      </div>
    </div>
  );
}

// ── Pelvik Lezyon Formu ─────────────────────────────────────────────────────
function PelvisLesionForm({
  lesion, index, onChange, onRemove, canRemove, gender,
}: {
  lesion: PelvisLesion; index: number;
  onChange: (l: PelvisLesion) => void; onRemove: () => void; canRemove: boolean;
  gender: string;
}) {
  function set<K extends keyof PelvisLesion>(key: K, val: PelvisLesion[K]) {
    onChange({ ...lesion, [key]: val });
  }
  const locations = gender === "Kadin" ? PELVIS_LOCATIONS_FEMALE : PELVIS_LOCATIONS_MALE;
  return (
    <div className="border border-zinc-200 rounded-lg p-3 space-y-3 bg-zinc-50/50">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700">Lezyon {index + 1}</span>
        {canRemove && (
          <button type="button" onClick={onRemove} className="text-xs text-zinc-400 hover:text-red-500">Kaldir</button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Lokalizasyon</label>
          <select value={lesion.location} onChange={(e) => set("location", e.target.value)}
            className="w-full border border-zinc-300 rounded-md px-2 py-1.5 text-sm">
            <option value="">Secin...</option>
            {locations.map((group) => (
              <optgroup key={group.group} label={group.group}>
                {group.options.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Boyut (mm)</label>
          <input type="number" min={0} max={300} value={lesion.size_mm}
            onChange={(e) => set("size_mm", e.target.value)} placeholder="orn: 25"
            className="w-full border border-zinc-300 rounded-md px-2 py-1.5 text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">T1 Sinyal</label>
          <select value={lesion.t1_signal} onChange={(e) => set("t1_signal", e.target.value)}
            className="w-full border border-zinc-300 rounded-md px-2 py-1.5 text-sm">
            <option value="">Belirtilmemis</option>
            <option value="hipointens">Hipointens</option>
            <option value="izointens">Izointens</option>
            <option value="hiperintens">Hiperintens</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">T2 Sinyal</label>
          <select value={lesion.t2_signal} onChange={(e) => set("t2_signal", e.target.value)}
            className="w-full border border-zinc-300 rounded-md px-2 py-1.5 text-sm">
            <option value="">Belirtilmemis</option>
            <option value="hipointens">Hipointens</option>
            <option value="izointens">Izointens</option>
            <option value="hiperintens">Hiperintens</option>
            <option value="belirgin hiperintens">Belirgin hiperintens</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Kontrast Tutulumu</label>
          <select value={lesion.enhancement} onChange={(e) => set("enhancement", e.target.value)}
            className="w-full border border-zinc-300 rounded-md px-2 py-1.5 text-sm">
            <option value="">Belirtilmemis</option>
            <option value="erken dinamik tutulum">Erken dinamik tutulum</option>
            <option value="homojen tutulum">Homojen tutulum</option>
            <option value="heterojen tutulum">Heterojen tutulum</option>
            <option value="rim tutulum">Rim tutulum</option>
            <option value="tutulum yok">Tutulum yok</option>
          </select>
        </div>
        <div className="flex flex-col justify-end gap-1.5">
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={lesion.dwi_restriction}
              onChange={(e) => set("dwi_restriction", e.target.checked)}
              className="h-3.5 w-3.5 accent-zinc-700" />
            <span className="text-xs text-zinc-600">DWI Kisitlanmasi</span>
          </label>
        </div>
      </div>
      <div className="border-t border-zinc-200 pt-3 space-y-2">
        <div className="text-xs font-medium text-zinc-500">Invazyon & Lenf Nodu</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Invazyon</label>
            <select value={lesion.invasion} onChange={(e) => set("invasion", e.target.value)}
              className="w-full border border-zinc-300 rounded-md px-2 py-1.5 text-sm">
              <option value="">Yok / Belirtilmemis</option>
              <option value="organa sinirli">Organa sinirli</option>
              <option value="ekstraorganik uzanim">Ekstraorganik uzanim</option>
              <option value="komsu organ invazyonu">Komsu organ invazyonu</option>
            </select>
          </div>
          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-1.5 cursor-pointer text-sm">
              <input type="checkbox" checked={lesion.lymph_nodes}
                onChange={(e) => set("lymph_nodes", e.target.checked)}
                className="h-3.5 w-3.5 accent-zinc-700" />
              <span className="text-xs text-zinc-600">Patolojik lenf nodu</span>
            </label>
          </div>
        </div>
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Ek Bulgular</label>
        <input type="text" value={lesion.additional} onChange={(e) => set("additional", e.target.value)}
          placeholder="orn: PI-RADS 4, EPE (+), endometrioma, dermoid..."
          className="w-full border border-zinc-300 rounded-md px-2 py-1.5 text-sm" />
      </div>
    </div>
  );
}

// ── Streaming Rapor Goruntuleici ─────────────────────────────────────────────
function ReportViewer({ text, loading }: { text: string; loading: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [text]);

  if (!text && !loading) return null;

  // Basic markdown-like formatting for section headers
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
    // Inline bold
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

function LiradsBadge({ category, label }: { category: string; label: string }) {
  const color = LIRADS_COLORS[category] || "bg-zinc-100 text-zinc-800 border-zinc-300";
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${color}`}>
      {label}
    </span>
  );
}

// ── Bolum Baslik Yardimcisi ──────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-zinc-800 border-b border-zinc-100 pb-1 mb-3">
      {children}
    </h3>
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
        {report && (
          <Button variant="secondary" onClick={copyReport}>
            Raporu Kopyala
          </Button>
        )}
      </div>

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
