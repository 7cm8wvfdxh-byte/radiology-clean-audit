import os, json, hmac, hashlib, datetime

AUDIT_SECRET = os.getenv("AUDIT_SECRET", "CHANGE_ME_SECRET")

def _now_iso():
    return datetime.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"

def _canon(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":")).encode("utf-8")

def _sha256_hex(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()

def _hmac_hex(secret: str, payload: bytes) -> str:
    return hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()

# -------- LI-RADS v2018 karar motoru --------
def run_lirads_decision(dsl: dict) -> dict:
    """
    LI-RADS v2018 kriterlerine göre HCC olasılık kategorisi döner.

    Dönüş:
        {
          "category": "LR-5",
          "label": "LR-5 (Definite HCC)",
          "applied_criteria": [...],
          "ancillary_features": {...},
        }
    """
    arterial   = bool((dsl.get("arterial_phase") or {}).get("hyperenhancement", False))
    washout    = bool((dsl.get("portal_phase") or {}).get("washout", False))
    capsule    = bool((dsl.get("delayed_phase") or {}).get("capsule", False))
    size       = int(dsl.get("lesion_size_mm", 0))
    cirrhosis  = bool(dsl.get("cirrhosis", False))

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

    # --- LR-5: Kesin HCC ---
    # Majör kriter: siroz + arteriyel + (washout VEYA kapsül) + ≥10 mm
    if cirrhosis and arterial and size >= 10:
        major_features = sum([washout, capsule])
        if major_features >= 2:
            return {
                "category": "LR-5",
                "label": "LR-5 (Definite HCC)",
                "applied_criteria": applied,
                "ancillary_favor_hcc": ancillary_favor_hcc,
                "ancillary_favor_benign": ancillary_favor_benign,
            }
        if major_features == 1 and size >= 20:
            # ≥20 mm + 1 majör kriter → LR-5
            return {
                "category": "LR-5",
                "label": "LR-5 (Definite HCC)",
                "applied_criteria": applied,
                "ancillary_favor_hcc": ancillary_favor_hcc,
                "ancillary_favor_benign": ancillary_favor_benign,
            }

    # --- LR-4: Muhtemel HCC ---
    # Siroz + arteriyel + ≥10 mm + 1 majör kriter veya ancillary
    if cirrhosis and arterial and size >= 10:
        if washout or capsule or ancillary_positive:
            return {
                "category": "LR-4",
                "label": "LR-4 (Probable HCC)",
                "applied_criteria": applied,
                "ancillary_favor_hcc": ancillary_favor_hcc,
                "ancillary_favor_benign": ancillary_favor_benign,
            }

    # --- LR-3: Orta olasılık ---
    if cirrhosis and arterial and size >= 10:
        return {
            "category": "LR-3",
            "label": "LR-3 (Intermediate probability)",
            "applied_criteria": applied,
            "ancillary_favor_hcc": ancillary_favor_hcc,
            "ancillary_favor_benign": ancillary_favor_benign,
        }
    if arterial and size < 10:
        return {
            "category": "LR-3",
            "label": "LR-3 (Intermediate probability)",
            "applied_criteria": applied,
            "ancillary_favor_hcc": ancillary_favor_hcc,
            "ancillary_favor_benign": ancillary_favor_benign,
        }
    if cirrhosis and arterial and ancillary_positive:
        return {
            "category": "LR-3",
            "label": "LR-3 (Intermediate probability)",
            "applied_criteria": applied,
            "ancillary_favor_hcc": ancillary_favor_hcc,
            "ancillary_favor_benign": ancillary_favor_benign,
        }

    # --- LR-2: Muhtemelen benign ---
    return {
        "category": "LR-2",
        "label": "LR-2 (Probably benign)",
        "applied_criteria": applied,
        "ancillary_favor_hcc": ancillary_favor_hcc,
        "ancillary_favor_benign": ancillary_favor_benign,
    }

# -------- BUILD PACK --------
def build_pack(case_id: str, dsl: dict, verify_base_url: str, previous_pack: dict = None) -> dict:
    """
    Audit pack oluşturur.

    previous_pack: Mevcut bir versiyon varsa, zincir (audit trail) için önceki
    paketin hash'i yeni pakete dahil edilir.
    """
    generated_at = _now_iso()
    lirads_result = run_lirads_decision(dsl)
    decision = lirads_result["label"]

    content = {"dsl": dsl, "decision": decision, "lirads": lirads_result}

    hashes = {
        "dsl_sha256": _sha256_hex(_canon(content["dsl"])),
        "decision_sha256": _sha256_hex(_canon({"decision": content["decision"]})),
    }

    # Versiyon zinciri: önceki pack varsa hash'ini ekle
    version = 1
    previous_hash = None
    if previous_pack:
        version = previous_pack.get("version", 1) + 1
        # İmza hariç önceki paketin canonical hash'i
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
