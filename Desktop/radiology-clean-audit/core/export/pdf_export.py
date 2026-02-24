from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
import qrcode, os, json, re, logging, tempfile

logger = logging.getLogger(__name__)

# Güvenli output dizini
OUTPUT_DIR = os.path.join(tempfile.gettempdir(), "radiology_exports")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def _sanitize_filename(name: str) -> str:
    """Dosya adından tehlikeli karakterleri temizler (path traversal önlemi)."""
    safe = re.sub(r'[^a-zA-Z0-9_\-]', '_', os.path.basename(name))
    return safe or "unknown"


def _lirads_color(category: str) -> str:
    """LI-RADS kategorisine göre renk kodu."""
    colors = {
        "LR-1": "#16a34a",
        "LR-2": "#22c55e",
        "LR-3": "#ca8a04",
        "LR-4": "#ea580c",
        "LR-5": "#dc2626",
        "LR-M": "#9333ea",
    }
    return colors.get(category, "#71717a")


def generate_pdf(pack):
    styles = getSampleStyleSheet()

    # Ek stiller
    styles.add(ParagraphStyle(
        "SectionHead",
        parent=styles["Heading3"],
        spaceAfter=6,
        spaceBefore=12,
        textColor=HexColor("#18181b"),
    ))
    styles.add(ParagraphStyle(
        "ReportBody",
        parent=styles["Normal"],
        fontSize=9,
        leading=13,
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        "Meta",
        parent=styles["Normal"],
        fontSize=7,
        textColor=HexColor("#a1a1aa"),
    ))

    safe_id = _sanitize_filename(pack['case_id'])
    path = os.path.join(OUTPUT_DIR, f"{safe_id}.pdf")
    doc = SimpleDocTemplate(path, pagesize=A4)
    el = []

    # Baslik
    el.append(Paragraph("Radiology-Clean Audit Pack", styles["Title"]))
    el.append(Paragraph(f"Vaka: {pack['case_id']}", styles["Normal"]))
    el.append(Spacer(1, 0.15 * inch))

    # LI-RADS skoru
    content = pack.get("content", {})
    lirads = content.get("lirads", {})
    decision = content.get("decision", "-")
    category = lirads.get("category", "")
    color = _lirads_color(category)

    el.append(Paragraph(
        f'<font color="{color}" size="14"><b>{decision}</b></font>',
        styles["Normal"],
    ))
    el.append(Spacer(1, 0.1 * inch))

    # Uygulanan kriterler
    applied = lirads.get("applied_criteria", [])
    if applied:
        el.append(Paragraph(
            f"Uygulanan kriterler: {', '.join(applied)}",
            styles["Meta"],
        ))

    hcc_ancillary = lirads.get("ancillary_favor_hcc", [])
    if hcc_ancillary:
        el.append(Paragraph(
            f"HCC lehine yardimci: {', '.join(hcc_ancillary)}",
            styles["Meta"],
        ))

    el.append(Spacer(1, 0.15 * inch))

    # Klinik bilgiler
    clinical = content.get("clinical_data")
    if clinical:
        el.append(Paragraph("Klinik Bilgiler", styles["SectionHead"]))
        parts = []
        if clinical.get("region"):
            parts.append(f"Bolge: {clinical['region']}")
        if clinical.get("age"):
            parts.append(f"Yas: {clinical['age']}")
        if clinical.get("gender"):
            parts.append(f"Cinsiyet: {clinical['gender']}")
        if clinical.get("indication"):
            parts.append(f"Endikasyon: {clinical['indication']}")
        if clinical.get("risk_factors"):
            parts.append(f"Risk faktorleri: {clinical['risk_factors']}")
        if parts:
            el.append(Paragraph(" | ".join(parts), styles["ReportBody"]))
        el.append(Spacer(1, 0.1 * inch))

    # DSL
    el.append(Paragraph("DSL Verileri", styles["SectionHead"]))
    dsl = content.get("dsl", {})
    el.append(Paragraph(
        json.dumps(dsl, ensure_ascii=False, indent=2),
        styles["ReportBody"],
    ))
    el.append(Spacer(1, 0.15 * inch))

    # Ajan raporu
    agent_report = content.get("agent_report")
    if agent_report:
        el.append(Paragraph("Radyolog Ajan Raporu", styles["SectionHead"]))
        # Rapor metnini paragraflara bol
        for line in agent_report.split("\n"):
            stripped = line.strip()
            if not stripped:
                el.append(Spacer(1, 0.05 * inch))
                continue
            if stripped.startswith("## "):
                el.append(Spacer(1, 0.08 * inch))
                el.append(Paragraph(
                    f"<b>{stripped[3:]}</b>",
                    styles["SectionHead"],
                ))
            elif stripped.startswith("**") and stripped.endswith("**"):
                el.append(Paragraph(
                    f"<b>{stripped[2:-2]}</b>",
                    styles["ReportBody"],
                ))
            elif stripped.startswith("- ") or stripped.startswith("* "):
                el.append(Paragraph(
                    f"&bull; {stripped[2:]}",
                    styles["ReportBody"],
                ))
            else:
                # Inline bold
                text = stripped.replace("**", "<b>", 1)
                while "**" in text:
                    text = text.replace("**", "</b>", 1)
                    if "**" in text:
                        text = text.replace("**", "<b>", 1)
                el.append(Paragraph(text, styles["ReportBody"]))
        el.append(Spacer(1, 0.15 * inch))

    # QR kod
    qr = qrcode.make(pack["verify_url"])
    qpath = os.path.join(OUTPUT_DIR, f"qr_{safe_id}.png")
    qr.save(qpath)
    el.append(Image(qpath, 1.5 * inch, 1.5 * inch))
    el.append(Paragraph(pack["verify_url"], styles["Meta"]))
    el.append(Spacer(1, 0.05 * inch))

    # Imza bilgisi
    el.append(Paragraph(
        f"Imza: {pack.get('signature', '-')[:32]}... | "
        f"v{pack.get('version', 1)} | "
        f"{pack.get('generated_at', '-')}",
        styles["Meta"],
    ))

    doc.build(el)
    try:
        os.remove(qpath)
    except OSError:
        logger.warning("QR temp dosyası silinemedi: %s", qpath)
    return path
