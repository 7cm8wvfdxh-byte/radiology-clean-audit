import os, json, hmac, hashlib, datetime, logging
from typing import Optional

logger = logging.getLogger(__name__)

_audit_secret_raw = os.getenv("AUDIT_SECRET", "")
if not _audit_secret_raw or _audit_secret_raw in ("CHANGE_ME_SECRET", "CHANGE_ME_STRONG_SECRET_HERE"):
    logger.warning(
        "AUDIT_SECRET ortam değişkeni tanımlı değil veya varsayılan bırakılmış! "
        "Production ortamında güçlü bir secret kullanın."
    )
    _audit_secret_raw = _audit_secret_raw or "DEV_ONLY_AUDIT_FALLBACK"

AUDIT_SECRET = _audit_secret_raw

def _now_iso():
    return datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

def _canon(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":")).encode("utf-8")

def _sha256_hex(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()

def _hmac_hex(secret: str, payload: bytes) -> str:
    return hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()

# -------- LI-RADS v2018 karar motoru --------
def _lirads_result(category, label, applied, ancillary_favor_hcc, ancillary_favor_benign):
    """Standart LI-RADS sonuç dict'i oluşturur."""
    return {
        "category": category,
        "label": label,
        "applied_criteria": applied,
        "ancillary_favor_hcc": ancillary_favor_hcc,
        "ancillary_favor_benign": ancillary_favor_benign,
    }


def run_lirads_decision(dsl: dict) -> dict:
    """
    LI-RADS v2018 kriterlerine göre HCC olasılık kategorisi döner.

    Desteklenen kategoriler: LR-1, LR-2, LR-3, LR-4, LR-5, LR-M, LR-TIV.

    Dönüş:
        {
          "category": "LR-5",
          "label": "LR-5 (Definite HCC)",
          "applied_criteria": [...],
          "ancillary_favor_hcc": [...],
          "ancillary_favor_benign": [...],
        }
    """
    arterial   = bool((dsl.get("arterial_phase") or {}).get("hyperenhancement", False))
    washout    = bool((dsl.get("portal_phase") or {}).get("washout", False))
    capsule    = bool((dsl.get("delayed_phase") or {}).get("capsule", False))
    size       = int(dsl.get("lesion_size_mm", 0))
    cirrhosis  = bool(dsl.get("cirrhosis", False))

    # LR-TIV ve LR-M özellikleri
    tumor_in_vein          = bool(dsl.get("tumor_in_vein", False))
    rim_aphe               = bool(dsl.get("rim_aphe", False))
    peripheral_washout     = bool(dsl.get("peripheral_washout", False))
    delayed_central        = bool(dsl.get("delayed_central_enhancement", False))
    infiltrative           = bool(dsl.get("infiltrative", False))

    # Ancillary features (yardımcı bulgular)
    ancillary  = dsl.get("ancillary_features") or {}
    fat_sparing       = bool(ancillary.get("fat_sparing_in_solid_mass", False))
    blood_products    = bool(ancillary.get("blood_products_in_mass", False))
    corona_enhancement= bool(ancillary.get("corona_enhancement", False))
    mild_hypointensity= bool(ancillary.get("mild_hbp_hypointensity", False))  # hepatobiliary phase

    applied = []
    ancillary_favor_hcc = []
    ancillary_favor_benign = []

    if cirrhosis:
        applied.append("cirrhosis")
    if arterial:
        applied.append("arterial_hyperenhancement")
    if washout:
        applied.append("washout")
    if capsule:
        applied.append("capsule_appearance")

    # Yardımcı bulgular değerlendirme
    if fat_sparing:
        ancillary_favor_hcc.append("fat_sparing_in_solid_mass")
    if blood_products:
        ancillary_favor_hcc.append("blood_products_in_mass")
    if corona_enhancement:
        ancillary_favor_hcc.append("corona_enhancement")
    if mild_hypointensity:
        ancillary_favor_hcc.append("mild_hbp_hypointensity")

    ancillary_positive = len(ancillary_favor_hcc) > 0

    # --- LR-TIV: Tümör İçinde Ven (tüm kategorileri geçersiz kılar) ---
    if tumor_in_vein:
        applied.append("tumor_in_vein")
        return _lirads_result(
            "LR-TIV", "LR-TIV (Tumor in Vein)",
            applied, ancillary_favor_hcc, ancillary_favor_benign,
        )

    # --- LR-M: Malign, muhtemelen HCC değil ---
    # Targetoid kitle: rim APHE, periferal washout veya gecikmiş santral tutulum
    # Veya infiltratif görünüm
    targetoid = rim_aphe or peripheral_washout or delayed_central
    if targetoid or infiltrative:
        if rim_aphe:
            applied.append("rim_aphe")
        if peripheral_washout:
            applied.append("peripheral_washout")
        if delayed_central:
            applied.append("delayed_central_enhancement")
        if infiltrative:
            applied.append("infiltrative_appearance")
        return _lirads_result(
            "LR-M", "LR-M (Malignant, not HCC specific)",
            applied, ancillary_favor_hcc, ancillary_favor_benign,
        )

    # --- LR-5: Kesin HCC ---
    # Majör kriter: siroz + arteriyel + (washout VEYA kapsül) + ≥10 mm
    if cirrhosis and arterial and size >= 10:
        major_features = sum([washout, capsule])
        if major_features >= 2:
            return _lirads_result(
                "LR-5", "LR-5 (Definite HCC)",
                applied, ancillary_favor_hcc, ancillary_favor_benign,
            )
        if major_features == 1 and size >= 20:
            # ≥20 mm + 1 majör kriter → LR-5
            return _lirads_result(
                "LR-5", "LR-5 (Definite HCC)",
                applied, ancillary_favor_hcc, ancillary_favor_benign,
            )

    # --- LR-4: Muhtemel HCC ---
    # Siroz + arteriyel + ≥10 mm + 1 majör kriter veya ancillary
    if cirrhosis and arterial and size >= 10:
        if washout or capsule or ancillary_positive:
            return _lirads_result(
                "LR-4", "LR-4 (Probable HCC)",
                applied, ancillary_favor_hcc, ancillary_favor_benign,
            )

    # --- LR-3: Orta olasılık ---
    if cirrhosis and arterial and size >= 10:
        return _lirads_result(
            "LR-3", "LR-3 (Intermediate probability)",
            applied, ancillary_favor_hcc, ancillary_favor_benign,
        )
    if arterial and size < 10:
        return _lirads_result(
            "LR-3", "LR-3 (Intermediate probability)",
            applied, ancillary_favor_hcc, ancillary_favor_benign,
        )
    if cirrhosis and arterial and ancillary_positive:
        return _lirads_result(
            "LR-3", "LR-3 (Intermediate probability)",
            applied, ancillary_favor_hcc, ancillary_favor_benign,
        )

    # --- LR-2: Muhtemelen benign ---
    return _lirads_result(
        "LR-2", "LR-2 (Probably benign)",
        applied, ancillary_favor_hcc, ancillary_favor_benign,
    )

# -------- PACK ASSEMBLY (shared) --------
def _assemble_pack(
    case_id: str,
    content: dict,
    verify_base_url: str,
    previous_pack: Optional[dict] = None,
) -> dict:
    """Ortak pack oluşturma mantığı — hash, imza, versiyon zinciri."""
    generated_at = _now_iso()

    hashes = {
        "dsl_sha256": _sha256_hex(_canon(content["dsl"])),
        "decision_sha256": _sha256_hex(_canon({"decision": content["decision"]})),
    }

    version = 1
    previous_hash = None
    if previous_pack:
        version = previous_pack.get("version", 1) + 1
        prev_canonical = {k: v for k, v in previous_pack.items() if k != "verify_url"}
        previous_hash = _sha256_hex(_canon(prev_canonical))

    sign_payload = {
        "schema": "radiology-clean.audit-pack.v2",
        "case_id": case_id,
        "generated_at": generated_at,
        "version": version,
        "hashes": hashes,
    }
    if previous_hash:
        sign_payload["previous_hash"] = previous_hash

    signature = _hmac_hex(AUDIT_SECRET, _canon(sign_payload))
    verify_url = f"{verify_base_url}/verify/{case_id}?sig={signature}"

    pack = {
        "schema": "radiology-clean.audit-pack.v2",
        "generated_at": generated_at,
        "case_id": case_id,
        "version": version,
        "content": content,
        "hashes": hashes,
        "signature": signature,
        "verify_url": verify_url,
    }
    if previous_hash:
        pack["previous_hash"] = previous_hash

    return pack


# -------- BUILD PACK --------
def build_pack(case_id: str, dsl: dict, verify_base_url: str, previous_pack: dict = None) -> dict:
    """
    Audit pack oluşturur.

    previous_pack: Mevcut bir versiyon varsa, zincir (audit trail) için önceki
    paketin hash'i yeni pakete dahil edilir.
    """
    lirads_result = run_lirads_decision(dsl)
    decision = lirads_result["label"]
    content = {"dsl": dsl, "decision": decision, "lirads": lirads_result}
    return _assemble_pack(case_id, content, verify_base_url, previous_pack)

# -------- VERIFY FULL --------
def verify_pack_full(pack: dict) -> dict:
    reasons = []
    mismatches = {}

    if pack.get("schema") != "radiology-clean.audit-pack.v2":
        reasons.append("schema_mismatch")

    content = pack.get("content") or {}
    dsl = content.get("dsl") or {}
    decision = content.get("decision", None)

    recomputed_hashes = {
        "dsl_sha256": _sha256_hex(_canon(dsl)),
        "decision_sha256": _sha256_hex(_canon({"decision": decision})),
    }
    stored_hashes = pack.get("hashes") or {}

    for k, v in recomputed_hashes.items():
        if stored_hashes.get(k) != v:
            mismatches[k] = {"stored": stored_hashes.get(k), "computed": v}

    if mismatches:
        reasons.append("hash_mismatch")

    sign_payload = {
        "schema": pack.get("schema"),
        "case_id": pack.get("case_id"),
        "generated_at": pack.get("generated_at"),
        "version": pack.get("version", 1),
        "hashes": stored_hashes,
    }
    if pack.get("previous_hash"):
        sign_payload["previous_hash"] = pack["previous_hash"]
    expected_sig = _hmac_hex(AUDIT_SECRET, _canon(sign_payload))
    stored_sig = pack.get("signature")

    if not stored_sig:
        reasons.append("signature_missing")
    elif not hmac.compare_digest(stored_sig, expected_sig):
        reasons.append("signature_mismatch")

    ok = len(reasons) == 0
    return {
        "status": "VALID" if ok else "TAMPERED",
        "reasons": reasons,
        "hash_mismatches": mismatches,
    }


# -------- FORM → DSL BRIDGE --------
def extract_dsl_from_findings(clinical_data: dict) -> dict:
    """
    Ajan formundaki yapılandırılmış lezyon verisini LI-RADS DSL formatına çevirir.

    Birden fazla lezyon varsa, en yüksek risk taşıyan lezyon seçilir
    (en büyük boyut + en çok major kriter).
    """
    lesions = clinical_data.get("lesions", [])
    cirrhosis = bool(clinical_data.get("cirrhosis", False))

    if not lesions:
        return {
            "arterial_phase": {"hyperenhancement": False},
            "portal_phase": {"washout": False},
            "delayed_phase": {"capsule": False},
            "lesion_size_mm": 0,
            "cirrhosis": cirrhosis,
        }

    # Her lezyon için DSL üret, en yüksek risk skoru olanı seç
    best_dsl = None
    best_score = -1

    for les in lesions:
        arterial_text = (les.get("arterial_enhancement") or "").lower()
        # "rim enhansman" → LR-M yönünde, APHE sayılmaz
        # "hiperenhansman (non-rim APHE)" → gerçek APHE
        is_rim_only = arterial_text.startswith("rim ")
        aphe = ("aphe" in arterial_text or "hiperenhansman" in arterial_text) and not is_rim_only

        washout = bool(les.get("washout", False))
        capsule = bool(les.get("capsule", False))

        size_str = str(les.get("size_mm", "0")).strip()
        try:
            size = round(float(size_str))
        except (ValueError, TypeError):
            size = 0

        # LR-M: rim APHE + targetoid özellikler
        peripheral_washout = bool(les.get("peripheral_washout", False))
        delayed_central = bool(les.get("delayed_central_enhancement", False))
        infiltrative = bool(les.get("infiltrative", False))

        # LR-TIV: tümör-içi ven
        tumor_in_vein = bool(les.get("tumor_in_vein", False))

        dsl = {
            "arterial_phase": {"hyperenhancement": aphe},
            "portal_phase": {"washout": washout},
            "delayed_phase": {"capsule": capsule},
            "lesion_size_mm": size,
            "cirrhosis": cirrhosis,
            "rim_aphe": is_rim_only,
            "peripheral_washout": peripheral_washout,
            "delayed_central_enhancement": delayed_central,
            "infiltrative": infiltrative,
            "tumor_in_vein": tumor_in_vein,
        }

        # Ancillary features from DWI
        ancillary = {}
        if les.get("dwi_restriction"):
            ancillary["restricted_diffusion"] = True
        if les.get("additional"):
            add_lower = les["additional"].lower()
            if "mozaik" in add_lower or "mosaic" in add_lower:
                ancillary["mosaic_architecture"] = True
            if "nodül-içinde-nodül" in add_lower or "nodul-icinde-nodul" in add_lower:
                ancillary["nodule_in_nodule"] = True
        if ancillary:
            dsl["ancillary_features"] = ancillary

        # Risk skoru: LR-TIV ve LR-M en yüksek önceliğe sahip
        # Sonra major kriterler + boyut
        lr_m_score = 100 if (is_rim_only or peripheral_washout or delayed_central or infiltrative) else 0
        lr_tiv_score = 200 if tumor_in_vein else 0
        score = lr_tiv_score + lr_m_score + sum([aphe, washout, capsule]) * 10 + size
        if score > best_score:
            best_score = score
            best_dsl = dsl

    return best_dsl or {
        "arterial_phase": {"hyperenhancement": False},
        "portal_phase": {"washout": False},
        "delayed_phase": {"capsule": False},
        "lesion_size_mm": 0,
        "cirrhosis": cirrhosis,
    }


def build_agent_pack(
    case_id: str,
    clinical_data: dict,
    agent_report: str,
    verify_base_url: str,
    previous_pack: Optional[dict] = None,
) -> dict:
    """
    Ajan raporunu + otomatik LI-RADS skorunu birlikte içeren audit pack oluşturur.
    """
    dsl = extract_dsl_from_findings(clinical_data)
    lirads_result = run_lirads_decision(dsl)
    decision = lirads_result["label"]

    content = {
        "dsl": dsl,
        "decision": decision,
        "lirads": lirads_result,
        "agent_report": agent_report,
        "clinical_data": {
            "region": clinical_data.get("region"),
            "age": clinical_data.get("age"),
            "gender": clinical_data.get("gender"),
            "indication": clinical_data.get("indication"),
            "risk_factors": clinical_data.get("risk_factors"),
        },
    }
    return _assemble_pack(case_id, content, verify_base_url, previous_pack)
