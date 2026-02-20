from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,Image
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
import qrcode, os, json

def generate_pdf(pack):

    styles=getSampleStyleSheet()
    path=f"{pack['case_id']}.pdf"

    doc=SimpleDocTemplate(path,pagesize=A4)
    el=[]

    el.append(Paragraph("Radiology-Clean Audit Pack",styles["Title"]))
    el.append(Paragraph(pack["case_id"],styles["Normal"]))
    el.append(Spacer(1,.2*inch))

    el.append(Paragraph(pack["content"]["decision"],styles["Heading2"]))
    el.append(Paragraph(json.dumps(pack["content"]["dsl"]),styles["Normal"]))
    el.append(Spacer(1,.2*inch))

    qr=qrcode.make(pack["verify_url"])
    qpath="qr.png"
    qr.save(qpath)

    el.append(Image(qpath,2*inch,2*inch))
    el.append(Paragraph(pack["verify_url"],styles["Normal"]))

    doc.build(el)
    os.remove(qpath)
    return path
