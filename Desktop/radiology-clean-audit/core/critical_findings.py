"""Kritik bulgu algılama ve alarm sistemi."""

# Kritik bulgu kuralları: her biri bir dict döner
# { "level": "critical"|"urgent"|"significant", "code": str, "message": str }


def detect_critical_findings(clinical_data: dict, lirads_result: dict = None) -> list[dict]:
    """Klinik verilerden kritik bulguları algıla."""
    findings = []

    region = clinical_data.get("region", "abdomen")

    # --- LI-RADS Kritik Bulgular ---
    if lirads_result:
        cat = lirads_result.get("category", "")
        if cat == "LR-5":
            findings.append({
                "level": "critical",
                "code": "LIRADS_5",
                "message": "LR-5: Kesin HCC — acil multidisipliner tümör konseyi önerilir",
                "action": "MDK toplantısına yönlendirin. Cerrahi/TACE/RFA değerlendirmesi gereklidir.",
            })
        elif cat == "LR-TIV":
            findings.append({
                "level": "critical",
                "code": "LIRADS_TIV",
                "message": "LR-TIV: Tümör içinde vasküler invazyon — çok yüksek risk",
                "action": "ACİL onkoloji konsültasyonu. Portal ven trombozu/tümör değerlendirilmeli.",
            })
        elif cat == "LR-M":
            findings.append({
                "level": "urgent",
                "code": "LIRADS_M",
                "message": "LR-M: HCC dışı malignite şüphesi — biyopsi düşünülmeli",
                "action": "Biyopsi planlanması önerilir. iCCA veya metastaz ekarte edilmeli.",
            })
        elif cat == "LR-4":
            findings.append({
                "level": "significant",
                "code": "LIRADS_4",
                "message": "LR-4: Muhtemel HCC — yakın takip veya biyopsi",
                "action": "3 ay içinde kontrol MRI veya biyopsi planlanmalı.",
            })
        elif cat == "LR-3":
            findings.append({
                "level": "significant",
                "code": "LIRADS_3",
                "message": "LR-3: Orta olasılık — 6 aylık sürveyans önerilir",
                "action": "6 ay içinde kontrol MRI planlanmalı. Lezyon büyümesi veya yeni majör kriter gelişimi takip edilmeli.",
            })

    # --- Abdomen Kritik Bulgular ---
    for les in clinical_data.get("lesions", []):
        if les.get("tumor_in_vein"):
            if not any(f["code"] == "LIRADS_TIV" for f in findings):
                findings.append({
                    "level": "critical",
                    "code": "TUMOR_IN_VEIN",
                    "message": "Vende tümör invazyonu saptandı",
                    "action": "Acil vasküler cerrahi/onkoloji değerlendirmesi.",
                })

    # --- Beyin Kritik Bulgular ---
    for les in clinical_data.get("brain_lesions", []):
        if les.get("midline_shift"):
            findings.append({
                "level": "critical",
                "code": "MIDLINE_SHIFT",
                "message": "Orta hat kayması — acil nörolojik değerlendirme gerekli",
                "action": "ACİL beyin cerrahisi konsültasyonu. Herniasyon riski değerlendirilmeli.",
            })
        if les.get("mass_effect") and les.get("perilesional_edema"):
            findings.append({
                "level": "urgent",
                "code": "MASS_EFFECT_EDEMA",
                "message": "Kitle etkisi + perilesyonel ödem — artmış intrakraniyal basınç riski",
                "action": "Steroid tedavisi ve nörocerrahi konsültasyonu düşünülmeli.",
            })

    # --- Spinal Kritik Bulgular ---
    for les in clinical_data.get("spine_lesions", []):
        if les.get("cord_compression"):
            findings.append({
                "level": "critical",
                "code": "CORD_COMPRESSION",
                "message": "Spinal kord kompresyonu — acil müdahale gerekebilir",
                "action": "ACİL nörocerrahi/ortopedi konsültasyonu. Kauda equina sendromu ekarte edilmeli.",
            })
        if les.get("vertebral_fracture") and les.get("cord_compression"):
            findings.append({
                "level": "critical",
                "code": "UNSTABLE_FRACTURE",
                "message": "Vertebra kırığı + kord kompresyonu — instabil kırık riski",
                "action": "Spinal stabilizasyon acil değerlendirilmeli.",
            })

    # --- Toraks Kritik Bulgular ---
    for les in clinical_data.get("thorax_lesions", []):
        if les.get("spiculation") and les.get("lymphadenopathy"):
            findings.append({
                "level": "urgent",
                "code": "LUNG_MALIGNANCY_SUSPECT",
                "message": "Spikülasyon + lenfadenopati — akciğer malignitesi yüksek şüphe",
                "action": "PET-CT ve biyopsi planlanmalı. Göğüs cerrahisi/onkoloji konsültasyonu.",
            })

    # Duplikatları kaldır
    seen_codes = set()
    unique = []
    for f in findings:
        if f["code"] not in seen_codes:
            seen_codes.add(f["code"])
            unique.append(f)

    # Önceliğe göre sırala: critical > urgent > significant
    priority = {"critical": 0, "urgent": 1, "significant": 2}
    unique.sort(key=lambda x: priority.get(x["level"], 99))

    return unique


# --- Sistematik Tarama Checklist Şablonları ---
CHECKLISTS = {
    "abdomen": {
        "title": "Abdomen MRI Sistematik Tarama",
        "items": [
            {"id": "liver_size", "label": "Karaciğer boyutu değerlendirildi", "category": "Karaciğer"},
            {"id": "liver_parenchyma", "label": "Karaciğer parankim homojenitesi", "category": "Karaciğer"},
            {"id": "liver_focal", "label": "Fokal lezyon tarandı", "category": "Karaciğer"},
            {"id": "portal_vein", "label": "Portal ven açıklığı kontrol edildi", "category": "Vasküler"},
            {"id": "hepatic_veins", "label": "Hepatik venler değerlendirildi", "category": "Vasküler"},
            {"id": "gallbladder", "label": "Safra kesesi kontrol edildi", "category": "Safra Yolları"},
            {"id": "bile_ducts", "label": "Safra yolları değerlendirildi", "category": "Safra Yolları"},
            {"id": "pancreas", "label": "Pankreas değerlendirildi", "category": "Pankreas"},
            {"id": "spleen", "label": "Dalak boyutu ve homojenitesi", "category": "Dalak"},
            {"id": "kidneys", "label": "Böbrekler bilateral değerlendirildi", "category": "Böbrek"},
            {"id": "adrenals", "label": "Adrenal bezler kontrol edildi", "category": "Adrenal"},
            {"id": "aorta", "label": "Aort değerlendirildi", "category": "Vasküler"},
            {"id": "lymph_nodes", "label": "Lenf nodları tarandı", "category": "Lenf"},
            {"id": "peritoneum", "label": "Periton / asit kontrolü", "category": "Periton"},
            {"id": "bones", "label": "Kemik yapılar gözden geçirildi", "category": "Kemik"},
        ],
    },
    "brain": {
        "title": "Beyin MRI Sistematik Tarama",
        "items": [
            {"id": "hemispheres", "label": "Serebral hemisferler simetri kontrolü", "category": "Serebrum"},
            {"id": "gray_white", "label": "Gri-beyaz madde farklılaşması", "category": "Serebrum"},
            {"id": "basal_ganglia", "label": "Bazal ganglionlar & talamus", "category": "Derin Yapılar"},
            {"id": "brainstem", "label": "Beyin sapı değerlendirildi", "category": "Posterior Fossa"},
            {"id": "cerebellum", "label": "Serebellum kontrol edildi", "category": "Posterior Fossa"},
            {"id": "ventricles", "label": "Ventriküler sistem boyutu", "category": "BOS"},
            {"id": "midline", "label": "Orta hat yapıları kontrol edildi", "category": "Orta Hat"},
            {"id": "sella", "label": "Sella / hipofiz değerlendirildi", "category": "Sellar"},
            {"id": "dwi", "label": "DWI / ADC kontrol edildi", "category": "Diffüzyon"},
            {"id": "swi", "label": "SWI / mikrokanama tarandı", "category": "Kanama"},
            {"id": "vessels", "label": "Vasküler yapılar değerlendirildi", "category": "Vasküler"},
            {"id": "orbits", "label": "Orbita kontrol edildi", "category": "Ekstra-aksiyel"},
            {"id": "sinuses", "label": "Paranazal sinüsler gözden geçirildi", "category": "İnsidental"},
            {"id": "calvarium", "label": "Kalvaryum ve kemik yapılar", "category": "Kemik"},
        ],
    },
    "spine": {
        "title": "Spinal MRI Sistematik Tarama",
        "items": [
            {"id": "alignment", "label": "Spinal dizilim değerlendirildi", "category": "Genel"},
            {"id": "vertebral_bodies", "label": "Vertebra korpusları kontrol edildi", "category": "Vertebra"},
            {"id": "disc_heights", "label": "Disk yükseklikleri değerlendirildi", "category": "Disk"},
            {"id": "disc_herniations", "label": "Disk herniasyonları tarandı", "category": "Disk"},
            {"id": "spinal_cord", "label": "Spinal kord sinyal kontrolü", "category": "Kord"},
            {"id": "canal_stenosis", "label": "Kanal stenozu değerlendirildi", "category": "Kanal"},
            {"id": "foramina", "label": "Nöral foramenler kontrol edildi", "category": "Foramen"},
            {"id": "facet_joints", "label": "Faset eklemler değerlendirildi", "category": "Eklem"},
            {"id": "paraspinal", "label": "Paraspinal/epidural alan tarandı", "category": "Çevre"},
            {"id": "marrow", "label": "Kemik iliği sinyali kontrol edildi", "category": "Kemik"},
            {"id": "conus", "label": "Konus medullaris seviyesi", "category": "Kord"},
        ],
    },
    "thorax": {
        "title": "Toraks Görüntüleme Sistematik Tarama",
        "items": [
            {"id": "lung_parenchyma", "label": "Akciğer parankimi bilateral tarandı", "category": "Akciğer"},
            {"id": "nodules", "label": "Pulmoner nodüller kontrol edildi", "category": "Akciğer"},
            {"id": "airways", "label": "Havayolları değerlendirildi", "category": "Havayolu"},
            {"id": "mediastinum", "label": "Mediasten değerlendirildi", "category": "Mediasten"},
            {"id": "hilum", "label": "Hiler yapılar kontrol edildi", "category": "Hiler"},
            {"id": "pleura", "label": "Plevra bilateral kontrol edildi", "category": "Plevra"},
            {"id": "pericardium", "label": "Perikard değerlendirildi", "category": "Kardiyak"},
            {"id": "heart", "label": "Kardiyak siluet kontrol edildi", "category": "Kardiyak"},
            {"id": "great_vessels", "label": "Büyük damarlar (aort, PA)", "category": "Vasküler"},
            {"id": "chest_wall", "label": "Göğüs duvarı kontrol edildi", "category": "Duvar"},
            {"id": "bones_thorax", "label": "Kemik yapılar gözden geçirildi", "category": "Kemik"},
            {"id": "upper_abdomen", "label": "Üst abdomen (görünen alan)", "category": "İnsidental"},
        ],
    },
    "pelvis": {
        "title": "Pelvik MRI Sistematik Tarama",
        "items": [
            {"id": "primary_organ", "label": "Primer organ değerlendirildi", "category": "Organ"},
            {"id": "bladder", "label": "Mesane kontrol edildi", "category": "Mesane"},
            {"id": "rectum", "label": "Rektum değerlendirildi", "category": "GİS"},
            {"id": "lymph_nodes_pelvis", "label": "Pelvik lenf nodları tarandı", "category": "Lenf"},
            {"id": "pelvic_bones", "label": "Pelvik kemikler kontrol edildi", "category": "Kemik"},
            {"id": "peritoneum_pelvis", "label": "Peritoneal alan kontrol edildi", "category": "Periton"},
            {"id": "vascular_pelvis", "label": "İliak damarlar değerlendirildi", "category": "Vasküler"},
            {"id": "soft_tissue", "label": "Yumuşak doku kontrol edildi", "category": "Yumuşak Doku"},
            {"id": "incidental", "label": "İnsidental bulgular notu", "category": "İnsidental"},
        ],
    },
}


def get_checklist(region: str) -> dict:
    """Bölgeye göre sistematik tarama checklist'ini döner."""
    return CHECKLISTS.get(region, CHECKLISTS["abdomen"])
