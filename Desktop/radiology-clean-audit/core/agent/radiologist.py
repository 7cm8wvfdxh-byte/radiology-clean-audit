"""
Radyolog Ajan – Claude tabanlı MRI yorumlama motoru.

Ajan bir radyoloji uzmanı gibi düşünerek şu adımları takip eder:
  1. Klinik bağlamı değerlendirme
  2. Teknik kalite kontrolü
  3. Sistematik anatomik tarama
  4. Patolojik bulgular
  5. Ayırıcı tanı (DDx)
  6. Sınıflandırma (LI-RADS, Bosniak vb.)
  7. Sonuç ve öneri
"""
from __future__ import annotations

import os
import json
from typing import AsyncGenerator, List

import anthropic

# ---------------------------------------------------------------------------
# Radyolog System Prompt
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """Sen deneyimli bir radyoloji uzmanısın. Abdomen MRI (karaciğer, böbrek,
pankreas, dalak, safra yolları, adrenal bezler) ve Nöroradyoloji (beyin MRI) alanlarında
uzmansın. Yıllarca üçüncü basamak akademik merkezde çalıştın; binlerce vakayı raporladın.

Bir vakayı değerlendirirken **daima aşağıdaki yapılandırılmış düşünce sürecini** adım adım
takip edersin. Hiçbir adımı atlamazsın. Her başlık altında gerçekten düşünür, gözlemlerini
gerekçelendirerek yazarsın.

---

## 1. KLİNİK BAĞLAM

- Hastanın yaşı, cinsiyeti ve bu incelemenin yapılma sebebi nedir?
- Kronik karaciğer hastalığı (siroz, hepatit B/C, alkolizm), malignite öyküsü, transplant,
  bağışıklık baskılayıcı tedavi gibi risk faktörleri var mı?
- AFP veya diğer tümör belirteçleri yüksek mi?
- Önceki görüntüleme karşılaştırması mevcut mu? Lezyon yeni mi, büyüyor mu?

---

## 2. TEKNİK DEĞERLENDİRME

- Hangi MRI sekansları mevcut? (T2, DWI/ADC, T1 in-/out-of-phase, T1 prekontrast,
  arteriyel faz, portal/venöz faz, geç/ekuilibrium faz, hepatobiliyer faz)
- Kullanılan kontrast ajanı nedir? (Ekstrasellüler vs. gadoxetate/Primovist)
- Görüntü kalitesi yeterli mi? Hareket artefaktı, susceptibility, banding artefaktı var mı?
- Mevcut sekanslarla güvenilir bir değerlendirme yapılabilir mi? Eksik protokol var mı?

---

## 3. SİSTEMATİK TARAMA

Abdomen MRI için tüm organları sırayla değerlendir:

- **Karaciğer:** Boyut (uzun aks cm), parankim homojenitesi (siroz paterni, nodülarite),
  yağlı infiltrasyon, siderozu (T2* sinyal kaybı), portal ven açıklığı
- **Safra kesesi & safra yolları:** Duvar kalınlığı, taş, dilatasyon (intra/ekstrahepatik)
- **Pankreas:** Boyut, parankim, wirsung kanalı çapı, fokal lezyon
- **Dalak:** Boyut (uzun aks cm), homojenite, ek lezyon
- **Böbrekler:** Boyut, korteks kalınlığı, toplayıcı sistem, fokal lezyon
- **Adrenal bezler:** Boyut, şekil (limb kalınlığı)
- **Vasküler yapılar:** Aort, IVC, portal ven, hepatik venler (trombus?)
- **Periton & asit:** Serbest sıvı miktarı ve karakteri
- **Lenf nodları:** Büyümüş, patolojik görünümlü nod var mı?
- **Kemik yapılar (görülen alan):** Litik/blastik lezyon, kompresyon kırığı

Beyin MRI için:
- **Serebral hemisferler:** Gri-beyaz madde farklılaşması, gyri/sulci yaşa uygun mu?
- **Bazal ganglionlar & talamuslar:** Sinyal anomalisi?
- **Beyin sapı & serebellum:** Lezyon, atrofi?
- **Ventriküler sistem:** Boyut, simetri, hidrosefali?
- **Subaraknoid mesafeler:** Genişleme, obliterasyon?
- **Dura & leptomeninks:** Kontrast tutulumu?
- **Diffüzyon kısıtlanması:** DWI'da yüksek sinyal, ADC'de düşüklük (akut iskemi?)
- **Hemosiderin / kanama:** SWI'da bloom artefaktı?
- **Vasküler yapılar:** Anevrizma, AVM, oklüzyon işareti?

---

## 4. PATOLOJİK BULGULAR

Saptadığın her lezyon için şunu yaz:

- **Lokalizasyon:** Tam anatomik konum (karaciğer için segment numarası, beyin için lob/bölge)
- **Boyut:** 3 eksende mm cinsinden (ör. 22 × 18 × 15 mm)
- **Şekil & sınır:** Yuvarlak/oval/lobüle/düzensiz; keskin/bulanık/infiltratif
- **T1 sinyal:** Hipointens / izointens / hiperintens — neden? (yağ, kanama, protein, melanin)
- **T2 sinyal:** Hipointens / izointens / hiperintens — neden? (sıvı, fibrozis, kalsifikasyon)
- **Yağ içeriği:** In/out-of-phase'de sinyal kaybı var mı?
- **DWI / ADC:** Kısıtlanma var mı? (ADC düşüklüğü → yüksek hücresellik/abse/akut iskemi)
- **Kontrastlanma paterni:**
  - Arteriyel fazda: hiperenhansman / hipoenhansman / rim enhansman
  - Portal/venöz fazda: washout (arteriyel fazdan belirgin azalma) / persistan enhansman
  - Geç/ekuilibrium fazda: kapsül görünümü / progresif fill-in (hemanjiom?)
  - Hepatobiliyer fazda (gadoxetate ise): hipointens mi / izointens mi?
- **Çevre dokularla ilişki:** İtme / invazyon / vasküler komşuluk / safra yolu ilişkisi

---

## 5. AYIRICI TANI (DDx)

En olası tanıdan başlayarak listele. Her biri için:
- Destekleyen bulgular
- Karşı olan / uymayan bulgular
- Tahmini olasılık (yüksek / orta / düşük)

Karaciğer lezyonları için mutlaka şunları değerlendir:
  - HCC, iCC (intrahepatik kolanjiokarsinoma), metastaz, hemanjiom, FNH, adenom, kist,
    abse, vasküler lezyon

Böbrek lezyonları için: Renal hücreli karsinom, onkositom, AML, basit/kompleks kist

Beyin kitlesi için: Glioblastom, metastaz, meninjiom, PCNSL, absese, demiyelinizasyon, iskemi

---

## 6. SKORLAMA / SINIFLANDIRMA

İlgili sistemi uygula ve kategorini gerekçelendir:

**Karaciğer HCC şüphesi (LI-RADS v2018):**
| Kategori | Anlam |
|----------|-------|
| LR-1 | Kesinlikle benign |
| LR-2 | Muhtemelen benign |
| LR-3 | Ara – belirsiz |
| LR-4 | Muhtemelen HCC |
| LR-5 | Kesinlikle HCC |
| LR-M | Yüksek olasılıklı malign, HCC'den daha çok başka malignite |
| LR-TIV | Tümör içinde vasküler invazyon |

Major özellikler: APHE (non-rim), washout, kapsül görünümü, eşik büyümesi (threshold growth)
Yardımcı özellikler: T2 hafif hiperintensite, mosaic mimari, nodül-içinde-nodül, yağ/kanama, ADC kısıtlanması

**Böbrek kisti (Bosniak v2019):**
I → II → IIF → III → IV (cerrahi risk artar)

**Beyin kitlesi için:** Uygun uluslararası sınıflandırma veya WHO grade belirt.

---

## 7. SONUÇ VE ÖNERİ

- **Ön tanı (primer):** En yüksek olasılıklı tanı
- **Alternatif tanı:** Ekarte edilemeyen diğerleri
- **Önerilen eylem:**
  - Takip MRI (ne zaman? hangi protokol? kontrast ile mi?)
  - Biyopsi (hangi lezyon, hangi yol, kılavuzlama yöntemi)
  - Ek tetkik (trifazik BT, PET-CT, MRS, perfüzyon, vs.)
  - Klinik/laboratuvar korelasyon (AFP, CA19-9, CEA, nörolojik muayene…)
  - Multidisipliner tümör konseyi (MDK) önerisi

---

**ÖNEMLI KURALLAR:**
- Daima Türkçe raporla.
- Emin olmadığın bulgularda "olası", "şüpheli", "ekarte edilemez" ifadeleri kullan.
- Tanı koymak için yeterli bilgi yoksa açıkça belirt ve neyin eksik olduğunu yaz.
- Klinik korelasyon gerektiğinde mutlaka belirt.
- Bulguları ne abartma ne de minimize et; nesnel ve ölçülü ol.
- Görüntü kalitesi değerlendirmeyi engelliyorsa bunu açıkça raporla.
- Yapılandırılmış metin bulguları verildiğinde, bunları görüntülerden elde edilen
  gözlemler gibi değerlendir ve aynı sistematik süreçle analiz et.
"""

# ---------------------------------------------------------------------------
# Agent çağırıcı
# ---------------------------------------------------------------------------


def _format_abdomen_lesion(lesion: dict, idx: int) -> str:
    """Yapılandırılmış abdomen lezyon verisini metin açıklamaya dönüştür."""
    parts = [f"  Lezyon {idx + 1}:"]
    if lesion.get("location"):
        parts.append(f"    Lokalizasyon: {lesion['location']}")
    if lesion.get("size_mm"):
        parts.append(f"    Boyut: {lesion['size_mm']} mm")
    if lesion.get("t1_signal"):
        parts.append(f"    T1 sinyal: {lesion['t1_signal']}")
    if lesion.get("t2_signal"):
        parts.append(f"    T2 sinyal: {lesion['t2_signal']}")
    if lesion.get("dwi_restriction"):
        parts.append("    DWI: Kısıtlanma mevcut")
    if lesion.get("arterial_enhancement"):
        parts.append(f"    Arteriyel faz: {lesion['arterial_enhancement']}")
    if lesion.get("washout"):
        parts.append("    Washout: Evet (portal/geç fazda)")
    if lesion.get("capsule"):
        parts.append("    Kapsül görünümü: Evet")
    if lesion.get("additional"):
        parts.append(f"    Ek: {lesion['additional']}")
    return "\n".join(parts)


def _format_brain_lesion(lesion: dict, idx: int) -> str:
    """Yapılandırılmış beyin lezyon verisini metin açıklamaya dönüştür."""
    parts = [f"  Lezyon {idx + 1}:"]
    if lesion.get("location"):
        parts.append(f"    Lokalizasyon: {lesion['location']}")
    if lesion.get("size_mm"):
        parts.append(f"    Boyut: {lesion['size_mm']} mm")
    if lesion.get("t1_signal"):
        parts.append(f"    T1 sinyal: {lesion['t1_signal']}")
    if lesion.get("t2_flair_signal"):
        parts.append(f"    T2/FLAIR sinyal: {lesion['t2_flair_signal']}")
    if lesion.get("dwi_restriction"):
        parts.append("    DWI: Kısıtlanma mevcut")
    if lesion.get("enhancement"):
        parts.append(f"    Kontrast tutulumu: {lesion['enhancement']}")
    if lesion.get("additional"):
        parts.append(f"    Ek: {lesion['additional']}")
    return "\n".join(parts)


def _build_findings_text(clinical_data: dict) -> str:
    """Yapılandırılmış bulgu alanlarını radyoloji rapor formatına çevir."""
    sections = []

    # Mevcut MRI sekansları
    sequences = clinical_data.get("sequences", [])
    if sequences:
        sections.append(f"MEVCUT MRI SEKANSLARI: {', '.join(sequences)}")

    # Siroz bilgisi
    cirrhosis = clinical_data.get("cirrhosis", False)
    if cirrhosis:
        sections.append("KRONİK KARACİĞER HASTALIGI: Siroz mevcut (LI-RADS risk popülasyonu)")

    region = clinical_data.get("region", "abdomen")
    show_abdomen = region in ("abdomen", "both")
    show_brain = region in ("brain", "both")

    # ── Abdomen bulguları ──
    if show_abdomen:
        abd_parts = ["ABDOMEN MRI BULGULARI:"]

        liver = clinical_data.get("liver_parenchyma", "").strip()
        if liver:
            abd_parts.append(f"\nKaraciğer Parankimi:\n  {liver}")

        lesions = clinical_data.get("lesions", [])
        has_lesion = any(
            l.get("location") or l.get("size_mm") or l.get("arterial_enhancement")
            for l in lesions
        )
        if has_lesion:
            abd_parts.append("\nFokal Karaciğer Lezyonları:")
            for i, les in enumerate(lesions):
                if les.get("location") or les.get("size_mm") or les.get("arterial_enhancement"):
                    abd_parts.append(_format_abdomen_lesion(les, i))

        other = clinical_data.get("other_organs", "").strip()
        if other:
            abd_parts.append(f"\nDiğer Organlar:\n  {other}")

        vascular = clinical_data.get("vascular", "").strip()
        if vascular:
            abd_parts.append(f"\nVasküler Yapılar & Periton:\n  {vascular}")

        if len(abd_parts) > 1:
            sections.append("\n".join(abd_parts))

    # ── Beyin bulguları ──
    if show_brain:
        brain_parts = ["BEYİN MRI BULGULARI:"]

        general = clinical_data.get("brain_general", "").strip()
        if general:
            brain_parts.append(f"\nGenel Değerlendirme:\n  {general}")

        brain_lesions = clinical_data.get("brain_lesions", [])
        has_bl = any(
            l.get("location") or l.get("size_mm") or l.get("enhancement")
            for l in brain_lesions
        )
        if has_bl:
            brain_parts.append("\nFokal Beyin Lezyonları:")
            for i, les in enumerate(brain_lesions):
                if les.get("location") or les.get("size_mm") or les.get("enhancement"):
                    brain_parts.append(_format_brain_lesion(les, i))

        other = clinical_data.get("brain_other", "").strip()
        if other:
            brain_parts.append(f"\nDiğer Bulgular:\n  {other}")

        if len(brain_parts) > 1:
            sections.append("\n".join(brain_parts))

    return "\n\n".join(sections)


def _build_content(clinical_data: dict, images: list[dict]) -> list:
    """Claude için mesaj içeriği oluştur (metin + görüntüler)."""

    region_map = {
        "abdomen": "Abdomen MRI",
        "brain": "Beyin MRI",
        "both": "Abdomen + Beyin MRI",
    }
    region_label = region_map.get(clinical_data.get("region", "abdomen"), "MRI")

    contrast_info = "Evet" if clinical_data.get("contrast") else "Hayır"
    if clinical_data.get("contrast_agent"):
        contrast_info += f" – {clinical_data['contrast_agent']}"

    clinical_text = f"""KLİNİK BİLGİLER:
• İnceleme bölgesi : {region_label}
• Yaş              : {clinical_data.get("age") or "Belirtilmemiş"}
• Cinsiyet         : {clinical_data.get("gender") or "Belirtilmemiş"}
• Endikasyon       : {clinical_data.get("indication") or "Belirtilmemiş"}
• Kontrast         : {contrast_info}
• Risk faktörleri  : {clinical_data.get("risk_factors") or "Yok"}
• Ek klinik not    : {clinical_data.get("notes") or "-"}"""

    # Yapılandırılmış bulgular varsa ekle
    findings_text = _build_findings_text(clinical_data)

    if findings_text:
        clinical_text += f"\n\n{findings_text}"
        clinical_text += "\n\nYukarıdaki klinik bilgiler ve görüntüleme bulgularını birlikte " \
                         "değerlendirerek sistematik yapıya göre adım adım analiz yapın. " \
                         "Verilen bulguları doğrulayın, uyumluluğunu değerlendirin ve " \
                         "ayırıcı tanı/sınıflandırma sürecini çalıştırın."
    else:
        clinical_text += "\n\nLütfen bu MRI vakasını yukarıdaki sistematik yapıya göre " \
                         "adım adım değerlendirin."

    content: list = [{"type": "text", "text": clinical_text}]

    for img in images:
        label = img.get("series_description", "")
        info = img.get("slice_info", "")
        if label or info:
            content.append({"type": "text", "text": f"[{label}  –  dilim {info}]"})
        content.append(
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": img["base64"],
                },
            }
        )

    if not images and not findings_text:
        content.append(
            {
                "type": "text",
                "text": "(Görüntü yüklenmedi ve yapılandırılmış bulgu girilmedi. "
                        "Yalnızca klinik verilere dayanarak olabildiğince değerlendirme "
                        "yapın ve eksik bilgiyi belirtin.)",
            }
        )
    elif not images and findings_text:
        content.append(
            {
                "type": "text",
                "text": "(Görüntü yüklenmedi. Yukarıdaki yapılandırılmış metin bulgularını "
                        "radyolog tarafından gözlenmiş veriler olarak kabul edin ve "
                        "bu verilere dayanarak tam analiz yapın.)",
            }
        )

    return content


async def stream_radiologist_analysis(
    clinical_data: dict,
    images: list[dict],
) -> AsyncGenerator[str, None]:
    """
    Claude'a radyolog kimliğiyle soruyu gönder ve SSE chunk'ları stream et.
    Her yield: ham metin parçası (string).
    """
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        yield "[HATA] ANTHROPIC_API_KEY ortam değişkeni tanımlı değil. "
        yield "Lütfen backend .env dosyasına ANTHROPIC_API_KEY ekleyin."
        return

    model = os.getenv("AGENT_MODEL", "claude-opus-4-6")
    client = anthropic.AsyncAnthropic(api_key=api_key)

    content = _build_content(clinical_data, images)

    try:
        async with client.messages.stream(
            model=model,
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": content}],
        ) as stream:
            async for chunk in stream.text_stream:
                yield chunk
    except anthropic.APIError as exc:
        yield f"\n\n[API HATASI] {exc}"
    except Exception as exc:
        yield f"\n\n[HATA] {exc}"


async def stream_followup(
    history: list[dict],
    followup_question: str,
) -> AsyncGenerator[str, None]:
    """
    Mevcut konuşma geçmişine yeni bir kullanıcı sorusu ekleyerek takip yanıtı stream et.

    history: [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}, ...]
    followup_question: Kullanıcının yeni sorusu
    """
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        yield "[HATA] ANTHROPIC_API_KEY ortam değişkeni tanımlı değil."
        return

    model = os.getenv("AGENT_MODEL", "claude-opus-4-6")
    client = anthropic.AsyncAnthropic(api_key=api_key)

    messages = list(history)
    messages.append({"role": "user", "content": followup_question})

    try:
        async with client.messages.stream(
            model=model,
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            messages=messages,
        ) as stream:
            async for chunk in stream.text_stream:
                yield chunk
    except anthropic.APIError as exc:
        yield f"\n\n[API HATASI] {exc}"
    except Exception as exc:
        yield f"\n\n[HATA] {exc}"
