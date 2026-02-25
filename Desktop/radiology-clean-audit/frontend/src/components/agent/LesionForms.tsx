"use client";

import type { Lesion, BrainLesion, SpineLesion, ThoraxLesion, PelvisLesion } from "@/types/agent";
import {
  ABDOMEN_ORGANS,
  BRAIN_LOCATIONS,
  SPINE_LOCATIONS,
  THORAX_LOCATIONS,
  PELVIS_LOCATIONS_MALE,
  PELVIS_LOCATIONS_FEMALE,
} from "./constants";

// ── Abdomen Lezyon Formu ──────────────────────────────────────────────────────
export function AbdomenLesionForm({
  lesion, index, onChange, onRemove, canRemove,
}: {
  lesion: Lesion; index: number;
  onChange: (l: Lesion) => void; onRemove: () => void; canRemove: boolean;
}) {
  function set<K extends keyof Lesion>(key: K, val: Lesion[K]) {
    onChange({ ...lesion, [key]: val });
  }

  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 space-y-3 bg-zinc-50/50 dark:bg-zinc-800/50">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Lezyon {index + 1}</span>
        {canRemove && (
          <button type="button" onClick={onRemove} className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-red-500">Kaldir</button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Lokalizasyon</label>
          <select value={lesion.location} onChange={(e) => set("location", e.target.value)}
            className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-zinc-100">
            <option value="">Secin...</option>
            {ABDOMEN_ORGANS.map((group) => (
              <optgroup key={group.group} label={group.group}>
                {group.options.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Boyut (mm)</label>
          <input type="number" min={0} max={300} value={lesion.size_mm}
            onChange={(e) => set("size_mm", e.target.value)} placeholder="orn: 22"
            className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-zinc-100" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">T1 Sinyal</label>
          <select value={lesion.t1_signal} onChange={(e) => set("t1_signal", e.target.value)}
            className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-zinc-100">
            <option value="">Belirtilmemis</option>
            <option value="hipointens">Hipointens</option>
            <option value="izointens">Izointens</option>
            <option value="hiperintens">Hiperintens</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">T2 Sinyal</label>
          <select value={lesion.t2_signal} onChange={(e) => set("t2_signal", e.target.value)}
            className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-zinc-100">
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
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Arteriyel Faz</label>
          <select value={lesion.arterial_enhancement} onChange={(e) => set("arterial_enhancement", e.target.value)}
            className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-zinc-100">
            <option value="">Belirtilmemis</option>
            <option value="hiperenhansman (non-rim APHE)">Hiperenhansman (non-rim APHE)</option>
            <option value="rim enhansman">Rim enhansman</option>
            <option value="hipoenhansman">Hipoenhansman</option>
            <option value="izoenhansman">Izoenhansman</option>
          </select>
        </div>
        <div className="flex flex-col justify-end gap-1.5">
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={lesion.dwi_restriction}
              onChange={(e) => set("dwi_restriction", e.target.checked)}
              className="h-3.5 w-3.5 accent-zinc-700" />
            <span className="text-xs text-zinc-600 dark:text-zinc-400">DWI Kisitlanmasi</span>
          </label>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <label className="flex items-center gap-1.5 cursor-pointer text-sm">
          <input type="checkbox" checked={lesion.washout}
            onChange={(e) => set("washout", e.target.checked)}
            className="h-3.5 w-3.5 accent-zinc-700" />
          <span className="text-xs text-zinc-600 dark:text-zinc-400">Washout (portal/gec fazda)</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer text-sm">
          <input type="checkbox" checked={lesion.capsule}
            onChange={(e) => set("capsule", e.target.checked)}
            className="h-3.5 w-3.5 accent-zinc-700" />
          <span className="text-xs text-zinc-600 dark:text-zinc-400">Kapsul gorunumu</span>
        </label>
      </div>

      {/* LR-M / LR-TIV Ozellikleri */}
      <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3 space-y-2">
        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">LR-M / LR-TIV Ozellikleri</div>
        <div className="flex gap-4 flex-wrap">
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={lesion.peripheral_washout}
              onChange={(e) => set("peripheral_washout", e.target.checked)}
              className="h-3.5 w-3.5 accent-purple-700" />
            <span className="text-xs text-zinc-600 dark:text-zinc-400">Periferal washout (targetoid)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={lesion.delayed_central_enhancement}
              onChange={(e) => set("delayed_central_enhancement", e.target.checked)}
              className="h-3.5 w-3.5 accent-purple-700" />
            <span className="text-xs text-zinc-600 dark:text-zinc-400">Gecikmiş santral tutulum (targetoid)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={lesion.infiltrative}
              onChange={(e) => set("infiltrative", e.target.checked)}
              className="h-3.5 w-3.5 accent-purple-700" />
            <span className="text-xs text-zinc-600 dark:text-zinc-400">Infiltratif gorunum</span>
          </label>
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer text-sm">
          <input type="checkbox" checked={lesion.tumor_in_vein}
            onChange={(e) => set("tumor_in_vein", e.target.checked)}
            className="h-3.5 w-3.5 accent-red-700" />
          <span className="text-xs text-red-700 dark:text-red-400 font-medium">Tumor in Vein (LR-TIV)</span>
        </label>
        {lesion.tumor_in_vein && (
          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded px-2 py-1">
            LR-TIV: Vende tumor invazyonu tum diger LI-RADS kategorilerini gecersiz kilar.
          </p>
        )}
        {(lesion.peripheral_washout || lesion.delayed_central_enhancement || lesion.infiltrative ||
          lesion.arterial_enhancement === "rim enhansman") && !lesion.tumor_in_vein && (
          <p className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 rounded px-2 py-1">
            LR-M: Targetoid/infiltratif ozellikler HCC-disi maligniteyi dusundurur (orn: iCCA).
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Ek Bulgular</label>
        <input type="text" value={lesion.additional}
          onChange={(e) => set("additional", e.target.value)}
          placeholder="orn: Mozaik patern, nodul-icinde-nodul, yag icerigi..."
          className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-zinc-100" />
      </div>
    </div>
  );
}

// ── Beyin Lezyon Formu ────────────────────────────────────────────────────────
export function BrainLesionForm({
  lesion, index, onChange, onRemove, canRemove,
}: {
  lesion: BrainLesion; index: number;
  onChange: (l: BrainLesion) => void; onRemove: () => void; canRemove: boolean;
}) {
  function set<K extends keyof BrainLesion>(key: K, val: BrainLesion[K]) {
    onChange({ ...lesion, [key]: val });
  }

  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 space-y-3 bg-zinc-50/50 dark:bg-zinc-800/50">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Lezyon {index + 1}</span>
        {canRemove && (
          <button type="button" onClick={onRemove} className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-red-500">Kaldir</button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Lokalizasyon</label>
          <select value={lesion.location} onChange={(e) => set("location", e.target.value)}
            className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-zinc-100">
            <option value="">Secin...</option>
            {BRAIN_LOCATIONS.map((group) => (
              <optgroup key={group.group} label={group.group}>
                {group.options.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Boyut (mm)</label>
          <input type="number" min={0} max={200} value={lesion.size_mm}
            onChange={(e) => set("size_mm", e.target.value)} placeholder="orn: 15"
            className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-zinc-100" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">T1 Sinyal</label>
          <select value={lesion.t1_signal} onChange={(e) => set("t1_signal", e.target.value)}
            className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-zinc-100">
            <option value="">Belirtilmemis</option>
            <option value="hipointens">Hipointens</option>
            <option value="izointens">Izointens</option>
            <option value="hiperintens">Hiperintens</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">T2 / FLAIR Sinyal</label>
          <select value={lesion.t2_flair_signal} onChange={(e) => set("t2_flair_signal", e.target.value)}
            className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-zinc-100">
            <option value="">Belirtilmemis</option>
            <option value="hipointens">Hipointens</option>
            <option value="izointens">Izointens</option>
            <option value="hiperintens">Hiperintens</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Kontrast Tutulumu</label>
          <select value={lesion.enhancement} onChange={(e) => set("enhancement", e.target.value)}
            className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-zinc-100">
            <option value="">Belirtilmemis</option>
            <option value="homojen tutulum">Homojen tutulum</option>
            <option value="heterojen tutulum">Heterojen tutulum</option>
            <option value="rim tutulum">Rim (halka) tutulum</option>
            <option value="tutulum yok">Tutulum yok</option>
          </select>
        </div>
        <div className="flex flex-col justify-end gap-1.5">
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={lesion.dwi_restriction}
              onChange={(e) => set("dwi_restriction", e.target.checked)}
              className="h-3.5 w-3.5 accent-zinc-700" />
            <span className="text-xs text-zinc-600 dark:text-zinc-400">DWI Kisitlanmasi</span>
          </label>
        </div>
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3 space-y-2">
        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Ek Ozellikler</div>
        <div className="flex gap-4 flex-wrap">
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={lesion.perilesional_edema}
              onChange={(e) => set("perilesional_edema", e.target.checked)}
              className="h-3.5 w-3.5 accent-zinc-700" />
            <span className="text-xs text-zinc-600 dark:text-zinc-400">Perilesyonel odem</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={lesion.mass_effect}
              onChange={(e) => set("mass_effect", e.target.checked)}
              className="h-3.5 w-3.5 accent-zinc-700" />
            <span className="text-xs text-zinc-600 dark:text-zinc-400">Kitle etkisi</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={lesion.hemorrhage}
              onChange={(e) => set("hemorrhage", e.target.checked)}
              className="h-3.5 w-3.5 accent-red-700" />
            <span className="text-xs text-zinc-600 dark:text-zinc-400">Kanama / hemosiderin</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={lesion.necrosis}
              onChange={(e) => set("necrosis", e.target.checked)}
              className="h-3.5 w-3.5 accent-zinc-700" />
            <span className="text-xs text-zinc-600 dark:text-zinc-400">Nekroz / kistik alan</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={lesion.calcification}
              onChange={(e) => set("calcification", e.target.checked)}
              className="h-3.5 w-3.5 accent-zinc-700" />
            <span className="text-xs text-zinc-600 dark:text-zinc-400">Kalsifikasyon</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={lesion.midline_shift}
              onChange={(e) => set("midline_shift", e.target.checked)}
              className="h-3.5 w-3.5 accent-red-700" />
            <span className="text-xs text-red-700 dark:text-red-400 font-medium">Orta hat kaymasi</span>
          </label>
        </div>
        {lesion.midline_shift && (
          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded px-2 py-1">
            Orta hat kaymasi: Acil norolojik degerlendirme gerekebilir.
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Ek Bulgular (serbest metin)</label>
        <input type="text" value={lesion.additional}
          onChange={(e) => set("additional", e.target.value)}
          placeholder="orn: Dural kuyruk isareti, hemosiderin halkasi, hidrosefali..."
          className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-zinc-100" />
      </div>
    </div>
  );
}

// ── Spinal Lezyon Formu ──────────────────────────────────────────────────────
export function SpineLesionForm({
  lesion, index, onChange, onRemove, canRemove,
}: {
  lesion: SpineLesion; index: number;
  onChange: (l: SpineLesion) => void; onRemove: () => void; canRemove: boolean;
}) {
  function set<K extends keyof SpineLesion>(key: K, val: SpineLesion[K]) {
    onChange({ ...lesion, [key]: val });
  }
  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 space-y-3 bg-zinc-50/50 dark:bg-zinc-800/50">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Lezyon {index + 1}</span>
        {canRemove && (
          <button type="button" onClick={onRemove} className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-red-500">Kaldir</button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Lokalizasyon</label>
          <select value={lesion.location} onChange={(e) => set("location", e.target.value)}
            className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-zinc-100">
            <option value="">Secin...</option>
            {SPINE_LOCATIONS.map((group) => (
              <optgroup key={group.group} label={group.group}>
                {group.options.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Boyut (mm)</label>
          <input type="number" min={0} max={300} value={lesion.size_mm}
            onChange={(e) => set("size_mm", e.target.value)} placeholder="orn: 12"
            className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-zinc-100" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">T1 Sinyal</label>
          <select value={lesion.t1_signal} onChange={(e) => set("t1_signal", e.target.value)}
            className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-zinc-100">
            <option value="">Belirtilmemis</option>
            <option value="hipointens">Hipointens</option>
            <option value="izointens">Izointens</option>
            <option value="hiperintens">Hiperintens</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">T2 Sinyal</label>
          <select value={lesion.t2_signal} onChange={(e) => set("t2_signal", e.target.value)}
            className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-zinc-100">
            <option value="">Belirtilmemis</option>
            <option value="hipointens">Hipointens</option>
            <option value="izointens">Izointens</option>
            <option value="hiperintens">Hiperintens</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Kontrast Tutulumu</label>
          <select value={lesion.enhancement} onChange={(e) => set("enhancement", e.target.value)}
            className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-zinc-100">
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
            <span className="text-xs text-zinc-600 dark:text-zinc-400">DWI Kisitlanmasi</span>
          </label>
        </div>
      </div>
      <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3 space-y-2">
        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Kritik Bulgular</div>
        <div className="flex gap-4 flex-wrap">
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={lesion.cord_compression}
              onChange={(e) => set("cord_compression", e.target.checked)}
              className="h-3.5 w-3.5 accent-red-700" />
            <span className="text-xs text-red-700 dark:text-red-400 font-medium">Spinal kord kompresyonu</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={lesion.nerve_root_compression}
              onChange={(e) => set("nerve_root_compression", e.target.checked)}
              className="h-3.5 w-3.5 accent-zinc-700" />
            <span className="text-xs text-zinc-600 dark:text-zinc-400">Sinir koku kompresyonu</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={lesion.canal_stenosis}
              onChange={(e) => set("canal_stenosis", e.target.checked)}
              className="h-3.5 w-3.5 accent-zinc-700" />
            <span className="text-xs text-zinc-600 dark:text-zinc-400">Kanal stenozu</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={lesion.vertebral_fracture}
              onChange={(e) => set("vertebral_fracture", e.target.checked)}
              className="h-3.5 w-3.5 accent-red-700" />
            <span className="text-xs text-red-700 dark:text-red-400 font-medium">Vertebra kirigi</span>
          </label>
        </div>
        {lesion.cord_compression && (
          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded px-2 py-1">
            Spinal kord kompresyonu: Acil norolojik degerlendirme gerekebilir!
          </p>
        )}
      </div>
      <div>
        <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Ek Bulgular</label>
        <input type="text" value={lesion.additional} onChange={(e) => set("additional", e.target.value)}
          placeholder="orn: Modic tip I degisiklik, disk sekestrasyon, epidural abse..."
          className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-zinc-100" />
      </div>
    </div>
  );
}

// ── Toraks Lezyon Formu ─────────────────────────────────────────────────────
export function ThoraxLesionForm({
  lesion, index, onChange, onRemove, canRemove,
}: {
  lesion: ThoraxLesion; index: number;
  onChange: (l: ThoraxLesion) => void; onRemove: () => void; canRemove: boolean;
}) {
  function set<K extends keyof ThoraxLesion>(key: K, val: ThoraxLesion[K]) {
    onChange({ ...lesion, [key]: val });
  }
  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 space-y-3 bg-zinc-50/50 dark:bg-zinc-800/50">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Lezyon {index + 1}</span>
        {canRemove && (
          <button type="button" onClick={onRemove} className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-red-500">Kaldir</button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Lokalizasyon</label>
          <select value={lesion.location} onChange={(e) => set("location", e.target.value)}
            className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-zinc-100">
            <option value="">Secin...</option>
            {THORAX_LOCATIONS.map((group) => (
              <optgroup key={group.group} label={group.group}>
                {group.options.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Boyut (mm)</label>
          <input type="number" min={0} max={300} value={lesion.size_mm}
            onChange={(e) => set("size_mm", e.target.value)} placeholder="orn: 18"
            className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-zinc-100" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Morfoloji</label>
          <select value={lesion.morphology} onChange={(e) => set("morphology", e.target.value)}
            className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-zinc-100">
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
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Dansite / Sinyal</label>
          <select value={lesion.density} onChange={(e) => set("density", e.target.value)}
            className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-zinc-100">
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
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Kontrast Tutulumu</label>
          <select value={lesion.enhancement} onChange={(e) => set("enhancement", e.target.value)}
            className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-zinc-100">
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
      <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3 space-y-2">
        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Ek Ozellikler</div>
        <div className="flex gap-4 flex-wrap">
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={lesion.spiculation}
              onChange={(e) => set("spiculation", e.target.checked)}
              className="h-3.5 w-3.5 accent-red-700" />
            <span className="text-xs text-red-700 dark:text-red-400 font-medium">Spikülasyon</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={lesion.cavitation}
              onChange={(e) => set("cavitation", e.target.checked)}
              className="h-3.5 w-3.5 accent-zinc-700" />
            <span className="text-xs text-zinc-600 dark:text-zinc-400">Kavitasyon</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={lesion.calcification}
              onChange={(e) => set("calcification", e.target.checked)}
              className="h-3.5 w-3.5 accent-zinc-700" />
            <span className="text-xs text-zinc-600 dark:text-zinc-400">Kalsifikasyon</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={lesion.pleural_contact}
              onChange={(e) => set("pleural_contact", e.target.checked)}
              className="h-3.5 w-3.5 accent-zinc-700" />
            <span className="text-xs text-zinc-600 dark:text-zinc-400">Plevral temas / invazyon</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={lesion.lymphadenopathy}
              onChange={(e) => set("lymphadenopathy", e.target.checked)}
              className="h-3.5 w-3.5 accent-zinc-700" />
            <span className="text-xs text-zinc-600 dark:text-zinc-400">Lenfadenopati</span>
          </label>
        </div>
        {lesion.spiculation && (
          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded px-2 py-1">
            Spikülasyon: Malignite lehine onemli bir morfolojik bulgu.
          </p>
        )}
      </div>
      <div>
        <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Ek Bulgular</label>
        <input type="text" value={lesion.additional} onChange={(e) => set("additional", e.target.value)}
          placeholder="orn: Tree-in-bud, plevral efuzyon, perikardial efuzyon..."
          className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-zinc-100" />
      </div>
    </div>
  );
}

// ── Pelvik Lezyon Formu ─────────────────────────────────────────────────────
export function PelvisLesionForm({
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
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 space-y-3 bg-zinc-50/50 dark:bg-zinc-800/50">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Lezyon {index + 1}</span>
        {canRemove && (
          <button type="button" onClick={onRemove} className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-red-500">Kaldir</button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Lokalizasyon</label>
          <select value={lesion.location} onChange={(e) => set("location", e.target.value)}
            className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-zinc-100">
            <option value="">Secin...</option>
            {locations.map((group) => (
              <optgroup key={group.group} label={group.group}>
                {group.options.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Boyut (mm)</label>
          <input type="number" min={0} max={300} value={lesion.size_mm}
            onChange={(e) => set("size_mm", e.target.value)} placeholder="orn: 25"
            className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-zinc-100" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">T1 Sinyal</label>
          <select value={lesion.t1_signal} onChange={(e) => set("t1_signal", e.target.value)}
            className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-zinc-100">
            <option value="">Belirtilmemis</option>
            <option value="hipointens">Hipointens</option>
            <option value="izointens">Izointens</option>
            <option value="hiperintens">Hiperintens</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">T2 Sinyal</label>
          <select value={lesion.t2_signal} onChange={(e) => set("t2_signal", e.target.value)}
            className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-zinc-100">
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
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Kontrast Tutulumu</label>
          <select value={lesion.enhancement} onChange={(e) => set("enhancement", e.target.value)}
            className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-zinc-100">
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
            <span className="text-xs text-zinc-600 dark:text-zinc-400">DWI Kisitlanmasi</span>
          </label>
        </div>
      </div>
      <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3 space-y-2">
        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Invazyon & Lenf Nodu</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Invazyon</label>
            <select value={lesion.invasion} onChange={(e) => set("invasion", e.target.value)}
              className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-zinc-100">
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
              <span className="text-xs text-zinc-600 dark:text-zinc-400">Patolojik lenf nodu</span>
            </label>
          </div>
        </div>
      </div>
      <div>
        <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Ek Bulgular</label>
        <input type="text" value={lesion.additional} onChange={(e) => set("additional", e.target.value)}
          placeholder="orn: PI-RADS 4, EPE (+), endometrioma, dermoid..."
          className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-zinc-100" />
      </div>
    </div>
  );
}
