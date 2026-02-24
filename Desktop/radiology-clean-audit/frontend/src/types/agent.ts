/**
 * Radyolog Ajan sayfasi icin tip tanimlari.
 *
 * Bu dosya agent/page.tsx icerisindeki tum tip tanimlarini
 * merkezi bir yerde toplar. Boylece hem agent sayfasi hem de
 * gelecekte olusturulacak alt komponentler bu tipleri import edebilir.
 */

// ---------------------------------------------------------------------------
// Lab & Checklist
// ---------------------------------------------------------------------------

export type LabResult = {
  id?: number;
  patient_id: string;
  test_name: string;
  value: string;
  unit: string;
  reference_range: string;
  is_abnormal: string;
  test_date: string;
};

export type ChecklistItem = { id: string; label: string; category: string };

// ---------------------------------------------------------------------------
// Confidence & Critical Findings
// ---------------------------------------------------------------------------

export type ConfidenceData = {
  overall_confidence: number;
  diagnosis_confidence?: {
    primary?: { diagnosis: string; confidence: number; reasoning: string };
    alternatives?: { diagnosis: string; confidence: number; reasoning: string }[];
  };
  data_quality?: { score: number; limiting_factors?: string[] };
  key_findings?: { finding: string; significance: string; supports: string }[];
  critical_alert?: boolean;
  critical_message?: string;
};

export type CriticalFinding = {
  level: string;
  code: string;
  message: string;
  action: string;
};

// ---------------------------------------------------------------------------
// Region-specific Lesion Types
// ---------------------------------------------------------------------------

export type Lesion = {
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

export type BrainLesion = {
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

export type SpineLesion = {
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

export type ThoraxLesion = {
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

export type PelvisLesion = {
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

export type RegionType = "abdomen" | "brain" | "both" | "spine" | "thorax" | "pelvis";

export type ClinicalForm = {
  region: RegionType;
  age: string;
  gender: string;
  indication: string;
  contrast: boolean;
  contrast_agent: string;
  risk_factors: string;
  notes: string;
  cirrhosis: boolean;
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

// ---------------------------------------------------------------------------
// Empty defaults (fabrika fonksiyonlari)
// ---------------------------------------------------------------------------

export const emptyLesion: Lesion = {
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

export const emptyBrainLesion: BrainLesion = {
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

export const emptySpineLesion: SpineLesion = {
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

export const emptyThoraxLesion: ThoraxLesion = {
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

export const emptyPelvisLesion: PelvisLesion = {
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
