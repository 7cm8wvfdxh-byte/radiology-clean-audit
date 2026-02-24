/**
 * Agent sayfasi icin sabit degerler.
 * Anatomik lokalizasyonlar, MRI sekans listeleri vb.
 */

export const ABDOMEN_SEQUENCES = [
  "T2 HASTE/TSE",
  "T2 Yag Baskilamali",
  "DWI / ADC",
  "T1 In/Out-of-Phase",
  "T1 Pre-kontrast",
  "Arteriyel Faz",
  "Portal Venoz Faz",
  "Gec / Ekuilibrium Faz",
  "Hepatobiliyer Faz (Primovist)",
];

export const BRAIN_SEQUENCES = [
  "T1 SE/TSE",
  "T2 TSE",
  "FLAIR",
  "DWI / ADC",
  "SWI / GRE",
  "T1 Post-kontrast",
  "MRA (TOF/Kontrast)",
  "MRS",
  "Perfuzyon",
];

export const SPINE_SEQUENCES = [
  "T1 SE/TSE (sagittal)",
  "T2 TSE (sagittal)",
  "T2 TSE (aksiyel)",
  "STIR / T2 Yag Baskilamali",
  "T1 Post-kontrast (sagittal)",
  "T1 Post-kontrast (aksiyel)",
  "DWI / ADC",
  "T2* GRE / SWI",
  "3D T2 (CISS/FIESTA)",
];

export const THORAX_SEQUENCES = [
  "BT (kontrastsiz)",
  "BT (kontrastli)",
  "BT Anjiyografi (pulmoner)",
  "BT Anjiyografi (aort)",
  "HRCT (yuksek cozunurluk)",
  "T2 HASTE",
  "DWI / ADC",
  "T1 Pre-kontrast",
  "T1 Post-kontrast",
  "Kardiyak MRI (sine/CINE)",
];

export const PELVIS_SEQUENCES = [
  "T2 TSE (aksiyel)",
  "T2 TSE (sagittal)",
  "T2 TSE (koronal)",
  "T1 TSE (aksiyel)",
  "DWI / ADC",
  "T1 Post-kontrast (dinamik)",
  "T1 Post-kontrast (gec faz)",
  "STIR / T2 Yag Baskilamali",
  "MR Spektroskopi",
];

const LIVER_SEGMENTS = [
  "Segment I (kaudat)",
  "Segment II",
  "Segment III",
  "Segment IV",
  "Segment V",
  "Segment VI",
  "Segment VII",
  "Segment VIII",
];

export const ABDOMEN_ORGANS = [
  { group: "Karaciger", options: [
    ...LIVER_SEGMENTS.map(s => s),
    "Sag lob (diffuz)",
    "Sol lob (diffuz)",
  ]},
  { group: "Bobrek", options: [
    "Sag bobrek - ust pol",
    "Sag bobrek - orta",
    "Sag bobrek - alt pol",
    "Sol bobrek - ust pol",
    "Sol bobrek - orta",
    "Sol bobrek - alt pol",
    "Sag bobrek - toplayici sistem/pelvis",
    "Sol bobrek - toplayici sistem/pelvis",
  ]},
  { group: "Pankreas", options: [
    "Pankreas basi (caput)",
    "Pankreas boyun (collum)",
    "Pankreas govde (corpus)",
    "Pankreas kuyruk (cauda)",
    "Uncinat proses",
    "Wirsung kanali",
  ]},
  { group: "Dalak", options: [
    "Dalak - ust pol",
    "Dalak - alt pol",
    "Dalak - hilus",
    "Dalak - diffuz",
  ]},
  { group: "Adrenal", options: [
    "Sag adrenal bez",
    "Sol adrenal bez",
  ]},
  { group: "Safra yollari", options: [
    "Safra kesesi",
    "Koledok (CBD)",
    "Intrahepatik safra yollari",
  ]},
  { group: "Diger", options: [
    "Periton",
    "Retroperiton",
    "Mezenter",
    "Lenf nodu",
    "Diger (notta belirtin)",
  ]},
];

export const BRAIN_LOCATIONS = [
  { group: "Serebral loblar", options: [
    "Frontal lob",
    "Temporal lob",
    "Parietal lob",
    "Oksipital lob",
    "Insula",
  ]},
  { group: "Derin yapilar", options: [
    "Bazal ganglionlar",
    "Talamus",
    "Hipotalamus",
    "Internal kapsul",
    "Korpus kallozum",
  ]},
  { group: "Posterior fossa", options: [
    "Beyin sapi - mezensefalon",
    "Beyin sapi - pons",
    "Beyin sapi - bulbus",
    "Serebellum - hemisfer",
    "Serebellum - vermis",
    "Serebellopontin kose (CPK)",
  ]},
  { group: "Sellar / Pineal", options: [
    "Sella / Hipofiz",
    "Suprasellar sisterna",
    "Pineal bolge",
  ]},
  { group: "Ekstra-aksiyel", options: [
    "Ekstra-aksiyel (konveksite)",
    "Falks serebri",
    "Tentorium",
    "Intraventrikuler",
    "Epidural",
    "Subdural",
  ]},
  { group: "Diger", options: [
    "Orbita",
    "Kafa kaidesi",
    "Paranazal sinus",
    "Diger (notta belirtin)",
  ]},
];

export const SPINE_LOCATIONS = [
  { group: "Servikal", options: [
    "C1 (atlas)", "C2 (aksis)", "C3", "C4", "C5", "C6", "C7",
    "C2-C3 disk", "C3-C4 disk", "C4-C5 disk", "C5-C6 disk", "C6-C7 disk",
    "Servikal spinal kord",
  ]},
  { group: "Torakal", options: [
    "T1", "T2", "T3", "T4", "T5", "T6",
    "T7", "T8", "T9", "T10", "T11", "T12",
    "Torakal spinal kord",
  ]},
  { group: "Lomber", options: [
    "L1", "L2", "L3", "L4", "L5",
    "L1-L2 disk", "L2-L3 disk", "L3-L4 disk", "L4-L5 disk", "L5-S1 disk",
    "Kauda equina",
  ]},
  { group: "Sakral / Diger", options: [
    "Sakrum", "Koksiks",
    "Sakroiliak eklem",
    "Epidural alan",
    "Paravertebral alan",
    "Kraniovertikal biliske",
    "Diger (notta belirtin)",
  ]},
];

export const THORAX_LOCATIONS = [
  { group: "Akciger", options: [
    "Sag ust lob",
    "Sag orta lob",
    "Sag alt lob",
    "Sol ust lob",
    "Lingula",
    "Sol alt lob",
    "Bilateral / diffuz",
  ]},
  { group: "Mediasten", options: [
    "Anterior mediasten",
    "Orta mediasten",
    "Posterior mediasten",
    "Hiler (sag)",
    "Hiler (sol)",
    "Subkarinal",
  ]},
  { group: "Plevra / Diger", options: [
    "Sag plevra",
    "Sol plevra",
    "Perikard",
    "Gogus duvari",
    "Trakea / bronş",
    "Aort / buyuk damar",
    "Pulmoner arter",
    "Diger (notta belirtin)",
  ]},
];

export const PELVIS_LOCATIONS_MALE = [
  { group: "Prostat", options: [
    "Prostat - periferik zon (sag)",
    "Prostat - periferik zon (sol)",
    "Prostat - transisyonel zon",
    "Prostat - santral zon",
    "Prostat - anterior fibromuskuler stroma",
    "Seminal vezikul (sag)",
    "Seminal vezikul (sol)",
  ]},
  { group: "Mesane / Rektum", options: [
    "Mesane",
    "Rektum",
    "Anal kanal",
  ]},
  { group: "Diger", options: [
    "Pelvik lenf nodu",
    "Pelvik kemik",
    "Sakrum",
    "Femur basi",
    "Diger (notta belirtin)",
  ]},
];

export const PELVIS_LOCATIONS_FEMALE = [
  { group: "Uterus", options: [
    "Uterus - endometrium",
    "Uterus - myometrium",
    "Uterus - junctional zone",
    "Serviks",
    "Uterus - fundus",
    "Uterus - korpus",
  ]},
  { group: "Over / Tuba", options: [
    "Sag over",
    "Sol over",
    "Sag tuba",
    "Sol tuba",
    "Douglas boslugu",
  ]},
  { group: "Mesane / Rektum", options: [
    "Mesane",
    "Rektum",
    "Anal kanal",
  ]},
  { group: "Diger", options: [
    "Pelvik lenf nodu",
    "Pelvik kemik",
    "Sakrum",
    "Femur basi",
    "Diger (notta belirtin)",
  ]},
];
