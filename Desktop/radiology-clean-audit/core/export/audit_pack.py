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

# -------- LI-RADS (basit) --------
def run_lirads_decision(dsl: dict) -> str:
    arterial = bool((dsl.get("arterial_phase") or {}).get("hyperenhancement", False))
    washout  = bool((dsl.get("portal_phase") or {}).get("washout", False))
    capsule  = bool((dsl.get("delayed_phase") or {}).get("capsule", False))
    size     = int(dsl.get("lesion_size_mm", 0))
    cirrhosis= bool(dsl.get("cirrhosis", False))

    if cirrhosis and arterial and washout and size >= 10:
        return "LR-5 (Definite HCC)" if capsule else "LR-4 (Probable HCC)"
    if cirrhosis and arterial and size >= 10 and not washout:
        return "LR-3 (Intermediate probability)"
    if arterial and size < 10:
        return "LR-3 (Intermediate probability)"
    return "LR-2 (Probably benign)"

# -------- BUILD PACK --------
def build_pack(case_id: str, dsl: dict, verify_base_url: str) -> dict:
    generated_at = _now_iso()
    decision = run_lirads_decision(dsl)

    content = {"dsl": dsl, "decision": decision}

    hashes = {
        "dsl_sha256": _sha256_hex(_canon(content["dsl"])),
        "decision_sha256": _sha256_hex(_canon({"decision": content["decision"]})),
    }

    sign_payload = {
        "schema": "radiology-clean.audit-pack.v2",
        "case_id": case_id,
        "generated_at": generated_at,
        "hashes": hashes,
    }

    signature = _hmac_hex(AUDIT_SECRET, _canon(sign_payload))
    verify_url = f"{verify_base_url}/verify?case_id={case_id}&sig={signature}"

    return {
        "schema": "radiology-clean.audit-pack.v2",
        "generated_at": generated_at,
        "case_id": case_id,
        "content": content,
        "hashes": hashes,
        "signature": signature,
        "verify_url": verify_url,
    }

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
        "hashes": stored_hashes,
    }
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
