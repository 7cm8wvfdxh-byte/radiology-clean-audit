/** Audit pack veri yapısı. */

export interface LiradsResult {
  category: string;
  label: string;
  applied_criteria: string[];
  ancillary_favor_hcc: string[];
  ancillary_favor_benign: string[];
}

export interface DslData {
  arterial_phase?: { hyperenhancement?: boolean };
  portal_phase?: { washout?: boolean };
  delayed_phase?: { capsule?: boolean };
  lesion_size_mm?: number;
  cirrhosis?: boolean;
  rim_aphe?: boolean;
  tumor_in_vein?: boolean;
  peripheral_washout?: boolean;
  delayed_central_enhancement?: boolean;
  infiltrative?: boolean;
  ancillary_features?: Record<string, boolean>;
}

export interface ClinicalSummary {
  region?: string;
  age?: string | number;
  gender?: string;
  indication?: string;
  risk_factors?: string;
}

export interface AuditPackContent {
  dsl: DslData;
  decision: string;
  lirads: LiradsResult;
  agent_report?: string;
  clinical_data?: ClinicalSummary;
}

export interface AuditPack {
  schema: string;
  case_id: string;
  version: number;
  generated_at: string;
  signature: string;
  verify_url: string;
  previous_hash?: string;
  content: AuditPackContent;
  hashes: Record<string, string>;
}
