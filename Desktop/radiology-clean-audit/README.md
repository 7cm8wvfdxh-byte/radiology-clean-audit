# Radiology Clean Audit

Yapay zeka destekli radyoloji denetim platformu. MRI analizi, LI-RADS sınıflandırma, kriptografik doğrulama ve PDF raporlama.

**Backend:** FastAPI (Python 3.12) | **Frontend:** Next.js 16 + React 19 + Tailwind CSS 4 | **AI:** Claude (Anthropic)

**Canlı:** Frontend → `radiology-clean-frontend.onrender.com` | Backend API → `radiology-clean-audit.onrender.com`

---

## Hizli Baslangic

### Gereksinimler
- Python 3.12+
- Node.js 20+
- Anthropic API key (AI ajan ozellikleri icin)

### Tek Komutla Baslatma

```bash
# Linux / macOS
chmod +x baslat.sh
./baslat.sh
```

```bat
REM Windows
baslat.bat
```

Bu script soyle calisir:
1. `.env` dosyasi yoksa `.env.example`'dan olusturur
2. Python ve npm bagimlilaklarini yukler
3. Backend'i port 8000'de baslatir
4. Frontend'i port 3000'de baslatir
5. Varsayilan admin kullanicisini olusturur

### Manuel Baslangic

**Backend:**
```bash
cd radiology-clean-audit

# Sanal ortam olustur
python -m venv venv && source venv/bin/activate

# Bagimlilaklari yukle
pip install -r requirements.txt

# Ortam degiskenlerini ayarla
cp .env.example .env
# .env dosyasini duzenle: ANTHROPIC_API_KEY, JWT_SECRET vs.

# Backend'i baslat
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend

# Bagimlilaklari yukle
npm install

# API adresini ayarla
echo "NEXT_PUBLIC_API_BASE=http://localhost:8000" > .env.local

# Dev server baslatma
npm run dev
```

**Docker ile (Her iki servis):**
```bash
docker compose up --build
# Backend: http://localhost:8000
# Frontend: http://localhost:3000
```

### Varsayilan Giris Bilgileri

| Kullanici | Sifre | Rol |
|-----------|-------|-----|
| `admin` | `admin123` | admin |

> **Onemli:** Production ortaminda sifre mutlaka degistirilmelidir.

---

## Sayfalar ve Ne Ise Yararlar

### 1. Ana Sayfa — Giris & Vaka Listesi (`/`)
- **Giris ekrani**: Kullanici adi ve sifre ile JWT token alinir
- **Vaka listesi**: Giris yapildiktan sonra tum vakalar listelenir
- Her vakaya tiklayarak detay sayfasina gidilir

### 2. Dashboard (`/dashboard`)
- **LI-RADS Dagilimi**: Pasta/bar grafik ile LR-1'den LR-TIV'e kadar vaka dagilimi
- **Toplam istatistikler**: Toplam vaka sayisi, toplam hasta sayisi
- **Yuksek riskli vakalar**: LR-4, LR-5, LR-M, LR-TIV kategorisindeki vakalar ayri listelenir
- **Son vakalar**: En son olusturulan vakalar tarih sirasina gore

### 3. Radyolog Ajan (`/agent`) — AI Destekli MRI Analizi
Bu sayfanin temel amaci: DICOM goruntuleri ve klinik bilgileri Claude AI'ya gondererek otomatik MRI raporu olusturmaktir.

**Kullanim adimlari:**
1. **Bolge secimi**: Abdomen, Beyin, Spine, Toraks veya Pelvis
2. **Hasta bilgileri**: Yas, cinsiyet, endikasyon, risk faktorleri
3. **Sekans secimi**: T1, T2, DWI, FLAIR vb. (bolgeye gore otomatik filtrelenir)
4. **Lezyon formu**: Bolgeye ozel form alanlarilyla lezyon detaylari girilir
5. **DICOM yukle**: Surukleyip birak ile DICOM dosyalari yuklenir
6. **Analiz baslat**: "Analizi Baslat" butonuyla Claude AI'ya gonderilir
7. **Canli rapor**: SSE (Server-Sent Events) ile rapor anlik akis halinde goruntulenir
8. **Takip sorusu**: Rapor sonrasinda sohbet kutusundan ek sorular sorulabilir
9. **Kaydet**: Rapor imzali audit pack olarak veritabanina kaydedilir

**Egitim Modu:**
- Sagdaki "Egitim Modu" toggle'i acildiginda AI, raporun her bolumune `[📖 EGITIM NOTU]` basligi altinda su bilgileri ekler:
  - Anatomi hatirlatmasi
  - Ayirici tani ipuclari
  - Pitfall (sik yapilan hata) uyarisi
  - Ilgili kilavuz/siniflandirma referansi
  - Anahtar sinyal ozellikleri (T1/T2/DWI)

**Ek paneller:**
- **Guven Skoru**: AI'nin tani guven yuzdesini ve alternatif tanilari gosterir
- **Kritik Bulgular Alarmi**: Tehlikeli bulgular (tumor, kord kompresyonu vb.) otomatik tespit edilir
- **Sistematik Tarama Checklist**: Bolgeye ozel kontrol listesi (atlanmis bir alan var mi?)
- **Laboratuvar Sonuclari**: Hastaya ait lab degerleri (AFP, AST, ALT vb.)
- **Onceki Vakalar**: Ayni hastanin onceki raporlariyla karsilastirma

### 4. Yeni Vaka (`/new`) — Manuel LI-RADS Analizi
- DICOM/AI olmadan manuel veri girisiyle LI-RADS skoru hesaplar
- Lezyon boyutu (mm), arteryel hiperenhancement, washout, kapsul girilir
- Sistem otomatik olarak LR-1 — LR-TIV kategorisini belirler
- Sonuc imzali audit pack olarak kaydedilir

### 5. Vakalar ve Detay (`/cases/[case_id]`)
- Vaka detay sayfasi: LI-RADS sonucu, DSL parametreleri, AI raporu
- **Versiyon gecmisi (Audit Trail)**: Vakanin her guncellemesi tarih damgali olarak saklanir
- **PDF Export**: QR kodlu, renk kodlu PDF rapor indirilir
- **JSON Export**: Ham audit pack JSON olarak indirilir
- **Dogrulama linki**: QR kod ile disaridan imza dogrulamasi yapilabilir

### 6. Hastalar (`/patients`)
- Hasta kaydi olusturma: ID, ad-soyad, dogum tarihi, cinsiyet
- Hasta listesi ve detay sayfasi
- Her hastanin altinda iliskili vakalar listelenir

### 7. Karsilastir (`/compare`)
- Iki vakayi yan yana karsilastirma
- LI-RADS skoru, DSL parametreleri ve klinik veriler yan yana goruntulenir
- Ayni hastanin farkli tarihli vakalarini karsilastirmak icin idealdir

### 8. Ikinci Okuma (`/second-reading`)
- **Kalite guvence** amacli ikinci okuma is akisi
- Admin bir vakaya ikinci okuyucu atar
- Okuyucu vakaya "Katiliyorum", "Katilmiyorum" veya "Kismen" olarak gormus bildirir
- Kendi LI-RADS kategorisini ve yorum ekleyebilir
- Uyumsuzluk raporlari ile kalite takibi yapilir

---

## Teknik Mimari

### Genel Akis

```
Kullanici (Browser)
    │
    ▼
┌─────────────────────┐       ┌─────────────────────────────┐
│  Next.js Frontend   │ ───►  │  FastAPI Backend             │
│  (React 19 + TW4)   │ SSE   │  (Python 3.12)              │
│  Port: 3000         │ ◄──── │  Port: 8000                 │
└─────────────────────┘       │                             │
                              │  ┌───────────────────────┐  │
                              │  │ Claude API (Anthropic) │  │
                              │  │ AI Radyoloji Analizi   │  │
                              │  └───────────────────────┘  │
                              │                             │
                              │  ┌───────────────────────┐  │
                              │  │ SQLite Veritabani      │  │
                              │  │ (radiology_clean.db)   │  │
                              │  └───────────────────────┘  │
                              └─────────────────────────────┘
```

### Backend Modulleri

| Modul | Dosya | Aciklama |
|-------|-------|----------|
| **API Katmani** | `main.py` | Tum FastAPI route'lari. Auth, case CRUD, agent, lab, second reading, export, stats |
| **Veritabani** | `db.py` | SQLAlchemy engine, session yonetimi, `init_db()` |
| **Modeller** | `models.py` | ORM modelleri: `Patient`, `Case`, `CaseVersion`, `LabResult`, `SecondReading`, `User` |
| **Kimlik Dogrulama** | `core/auth.py` | JWT token (HS256), PBKDF2 sifre hashleme, rol tabanli erisim kontrolu |
| **AI Radyolog** | `core/agent/radiologist.py` | Claude API ile MRI analizi, SSE streaming, 691 satirlik sistem promptu, egitim modu |
| **DICOM Isleyici** | `core/agent/dicom_utils.py` | DICOM → base64 JPEG donusumu, normalize, yeniden boyutlandirma |
| **LI-RADS Motoru** | `core/export/audit_pack.py` | LI-RADS v2018 karar motoru, HMAC-SHA256 imza, hash zinciri, QR kod |
| **PDF Export** | `core/export/pdf_export.py` | ReportLab ile PDF rapor, renk kodlu LI-RADS badge, QR kod |
| **Kritik Bulgular** | `core/critical_findings.py` | Otomatik alarm sistemi + bolgeye ozel sistematik tarama checklisti |
| **Vaka Store** | `store/store.py` | Case CRUD, versiyon gecmisi, istatistik sorgulari |
| **Hasta Store** | `store/patient_store.py` | Hasta CRUD, onceki vakalari getirme |
| **Lab Store** | `store/lab_store.py` | Laboratuvar sonucu CRUD |
| **Ikinci Okuma** | `store/second_read_store.py` | Ikinci okuma is akisi (olustur/tamamla/listele) |
| **Kullanici Store** | `store/user_store.py` | Kullanici yonetimi, varsayilan admin olusturma |

### Frontend Bilesenler

| Bileşen | Dosya | Aciklama |
|---------|-------|----------|
| **AppHeader** | `components/AppHeader.tsx` | Ust navigasyon cubugu. 7 sayfa linki, kullanici adi, tema toggle, mobil menu |
| **ThemeToggle** | `components/ThemeToggle.tsx` | Karanlik/acik tema degistirici. localStorage'da saklanir |
| **LiradsBadge** | `components/LiradsBadge.tsx` | Renk kodlu LI-RADS kategori etiketi (LR-1: yesil, LR-5: kirmizi) |
| **MarkdownRenderer** | `components/MarkdownRenderer.tsx` | AI raporlarini Markdown olarak render eder |
| **ImageViewer** | `components/ImageViewer.tsx` | DICOM goruntu goruntuleme |
| **Skeleton** | `components/Skeleton.tsx` | Yukleme animasyonlari (SkeletonList, SkeletonCard, SkeletonStats) |
| **Breadcrumb** | `components/Breadcrumb.tsx` | Sayfa yol gosterici |
| **AgentPanels** | `components/agent/AgentPanels.tsx` | DICOM dropzone, sekans secici, rapor goruntuleme, guven paneli, kritik alarm, checklist, lab, onceki vakalar |
| **LesionForms** | `components/agent/LesionForms.tsx` | 5 bolge icin lezyon formlari: Abdomen, Beyin, Spine, Toraks, Pelvis |
| **UI Kit** | `components/ui/` | `Button`, `Card`, `CardHeader`, `CardTitle`, `CardContent`, `FormField`, `Input`, `Select`, `Textarea` |

### Tip Tanimlari

| Dosya | Icerik |
|-------|--------|
| `types/agent.ts` | Ajan sayfasi tipleri: `ClinicalForm`, `Lesion`, `BrainLesion`, `SpineLesion`, `ThoraxLesion`, `PelvisLesion`, `ConfidenceData`, `CriticalFinding`, `LabResult`, `ChecklistItem` |
| `types/audit.ts` | Audit pack tipleri: `AuditPack`, `AuditPackContent`, `LiradsResult`, `DslData`, `ClinicalSummary` |
| `lib/constants.ts` | `API_BASE` (backend URL), `LIRADS_COLORS` (renk haritasi), `LIRADS_ORDER` |
| `lib/auth.ts` | `getToken()`, `setToken()`, `clearToken()`, `authHeaders()` — JWT token yonetimi |
| `lib/errors.ts` | `getErrorMessage()` — hata mesaji formatlama |

---

## API Endpoint Rehberi

### Kimlik Dogrulama (Auth)
| Metod | Endpoint | Aciklama | Yetki |
|-------|----------|----------|-------|
| POST | `/auth/token` | Giris yap, JWT token al (rate limit: 10/dk) | Herkese acik |
| GET | `/auth/me` | Mevcut kullanici bilgisi | Token gerekli |

### Vakalar (Cases)
| Metod | Endpoint | Aciklama | Yetki |
|-------|----------|----------|-------|
| POST | `/analyze/{case_id}` | Manuel analiz + imzali audit pack olustur | admin, radiologist |
| GET | `/cases` | Tum vakalari listele | Token gerekli |
| GET | `/cases/{case_id}` | Vaka detayi | Token gerekli |
| DELETE | `/cases/{case_id}` | Vaka sil | Sadece admin |
| GET | `/cases/{case_id}/versions` | Versiyon gecmisi (audit trail) | Token gerekli |

### AI Radyolog Ajan
| Metod | Endpoint | Aciklama | Yetki |
|-------|----------|----------|-------|
| POST | `/agent/analyze` | DICOM + klinik veri → AI analizi (SSE stream) | admin, radiologist |
| POST | `/agent/save` | Ajan raporunu audit pack olarak kaydet | admin, radiologist |
| POST | `/agent/followup` | Takip sorusu sor (SSE stream) | admin, radiologist |

### Hasta & Lab
| Metod | Endpoint | Aciklama | Yetki |
|-------|----------|----------|-------|
| POST | `/patients` | Yeni hasta olustur | admin, radiologist |
| GET | `/patients` | Hasta listesi | Token gerekli |
| GET | `/patients/{patient_id}` | Hasta detayi + vakalari | Token gerekli |
| GET | `/patients/{patient_id}/prior-cases` | Onceki vakalar (karsilastirma) | Token gerekli |
| POST | `/labs` | Lab sonucu ekle | admin, radiologist |
| GET | `/labs/{patient_id}` | Hasta lab sonuclari | Token gerekli |
| DELETE | `/labs/{lab_id}` | Lab sonucu sil | admin, radiologist |

### Ikinci Okuma & Dogrulama
| Metod | Endpoint | Aciklama | Yetki |
|-------|----------|----------|-------|
| POST | `/second-readings` | Ikinci okuma ata | Sadece admin |
| POST | `/second-readings/{id}/complete` | Okumayi tamamla | admin, radiologist |
| GET | `/second-readings` | Okumalari listele | Token gerekli |
| GET | `/second-readings/case/{case_id}` | Vakaya ait okumalar | Token gerekli |
| GET | `/second-readings/export` | Tum okumalari JSON export | Sadece admin |
| GET | `/verify/{case_id}?sig=...` | Imza dogrulamasi (QR kod) | Auth **gerekmez** |

### Diger
| Metod | Endpoint | Aciklama | Yetki |
|-------|----------|----------|-------|
| GET | `/` | Saglik kontrolu (health check) | Herkese acik |
| GET | `/stats` | Dashboard istatistikleri | Token gerekli |
| GET | `/checklist/{region}` | Bolgeye ozel checklist sablonu | Token gerekli |
| POST | `/critical-findings` | Kritik bulgu tespiti | Token gerekli |
| GET | `/export/pdf/{case_id}` | PDF rapor indir | Token gerekli |
| GET | `/export/json/{case_id}` | JSON audit pack indir | Token gerekli |

---

## LI-RADS Siniflandirma Sistemi

Sistem, LI-RADS v2018 kriterlerine gore otomatik HCC (hepatoselluler karsinom) olasilik kategorisi hesaplar.

### Kategoriler

| Kategori | Anlam | Renk Kodu | Aksiyon |
|----------|-------|-----------|---------|
| **LR-1** | Kesinlikle iyi huylu | Yesil | Rutin takip |
| **LR-2** | Muhtemelen iyi huylu | Acik yesil | Rutin takip |
| **LR-3** | Orta olasilik | Sari | 6 ayda kontrol MRI |
| **LR-4** | Muhtemel HCC | Turuncu | 3 ayda kontrol veya biyopsi |
| **LR-5** | Kesin HCC | Kirmizi | Acil MDK (tumor konseyi) |
| **LR-M** | HCC disi malignite | Mor | Biyopsi onerilir |
| **LR-TIV** | Tumor ici vaskuler invazyon | Koyu kirmizi | Acil onkoloji |

### Major Kriterler
- **Arteryel hiperenhancement**: Arteryel fazda kontrast tutulumu
- **Washout**: Portal veya gecikmi fazda kontrast kaybı
- **Enhancing kapsul**: Gecikmi fazda lezyon cevresi kapsul tutulumu
- **Lezyon boyutu**: <10mm, 10-19mm, ≥20mm

### Yardimci Kriterler
- HCC lehine: Fat sparing, kanama urunleri, corona enhancement, HBP hypointensity
- Iyi huylu lehine: Belirli sinyal ozellikleri

---

## Kritik Bulgu Alarm Sistemi

Sistem asagidaki durumlarda otomatik alarm uretir:

### Abdomen
- **LR-5**: Kesin HCC → Acil tumor konseyi
- **LR-TIV**: Vaskuler invazyon → Acil onkoloji
- **LR-M**: HCC disi malignite → Biyopsi
- **Tumor in Vein**: Vende tumor invazyonu → Acil cerrahi

### Beyin
- **Midline Shift**: Orta hat kaymasi → Acil norocerrahi
- **Mass Effect + Odem**: Artan kafa ici basinc → Steroid + konsultasyon

### Spine
- **Kord Kompresyonu**: Spinal kord basisi → Acil norocerrahi
- **Vertebra Kirigi + Kord Basisi**: Instabil kirik → Spinal stabilizasyon

### Toraks
- **Spikülasyon + Lenfadenopati**: Akciger malignitesi suplhesi → PET-CT + biyopsi

---

## Ortam Degiskenleri

### Backend (`.env`)

```env
# Zorunlu
AUDIT_SECRET=guclu-rastgele-anahtar-32-karakter
JWT_SECRET=guclu-rastgele-anahtar-32-karakter
ANTHROPIC_API_KEY=sk-ant-...

# Opsiyonel
ACCESS_TOKEN_EXPIRE_MINUTES=480
ALLOWED_ORIGINS=http://localhost:3000
VERIFY_BASE_URL=http://localhost:8000
DEFAULT_ADMIN_USER=admin
DEFAULT_ADMIN_PASS=guclu-sifre
DATABASE_URL=sqlite:///./radiology_clean.db
```

Guvenli anahtar uretmek icin:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

> Production'da bu deger build sirasinda JS icine gomuludur. Degistirmek icin yeniden build alinmalidir.

---

## Proje Yapisi

```
radiology-clean-audit/
├── main.py                    # FastAPI app + tum API route'lari
├── db.py                      # SQLAlchemy engine, session, init_db()
├── models.py                  # ORM modelleri (Patient, Case, CaseVersion, Lab, SecondReading, User)
├── requirements.txt           # Python bagimliliklari
├── .env.example               # Ornek ortam degiskenleri
├── baslat.sh                  # Linux/macOS tek komut baslatma scripti
├── baslat.bat                 # Windows tek komut baslatma scripti
├── Dockerfile                 # Multi-stage: backend + frontend
├── docker-compose.yml         # Backend :8000 + Frontend :3000
├── render.yaml                # Render.com deployment yapilandirmasi
│
├── core/
│   ├── auth.py                # JWT (HS256), PBKDF2 sifre, rol tabanli erisim
│   ├── critical_findings.py   # Kritik bulgu algilama + sistematik tarama checklisti
│   ├── agent/
│   │   ├── radiologist.py     # Claude AI streaming analiz (SYSTEM_PROMPT + EDUCATION_PROMPT)
│   │   └── dicom_utils.py     # DICOM → base64 JPEG donusumu (pydicom + Pillow)
│   └── export/
│       ├── audit_pack.py      # LI-RADS v2018 motoru + HMAC-SHA256 imza + hash zinciri
│       └── pdf_export.py      # PDF rapor (ReportLab + QR kod)
│
├── store/
│   ├── store.py               # Case CRUD, versiyon gecmisi, istatistik
│   ├── patient_store.py       # Hasta yonetimi + onceki vakalar
│   ├── lab_store.py           # Lab sonucu CRUD
│   ├── second_read_store.py   # Ikinci okuma is akisi
│   └── user_store.py          # Kullanici yonetimi + varsayilan admin
│
├── frontend/
│   ├── src/app/
│   │   ├── page.tsx           # Ana sayfa: Giris + Vaka listesi
│   │   ├── layout.tsx         # Root layout (tema, header, footer)
│   │   ├── dashboard/         # Istatistik dashboard
│   │   ├── agent/             # AI radyolog ajan arayuzu
│   │   │   ├── page.tsx       # ~1200 satirlik ajan sayfasi
│   │   │   └── error.tsx      # Hata yakalama siniri
│   │   ├── new/               # Manuel yeni vaka olusturma
│   │   ├── cases/[case_id]/   # Vaka detay + versiyon gecmisi
│   │   ├── patients/          # Hasta listesi + detay
│   │   │   └── [patient_id]/  # Hasta detay sayfasi
│   │   ├── compare/           # Vaka karsilastirma
│   │   └── second-reading/    # Ikinci okuma yonetimi
│   │
│   ├── src/components/
│   │   ├── AppHeader.tsx      # Navigasyon cubugu (7 sayfa + tema + cikis)
│   │   ├── ThemeToggle.tsx    # Karanlik/acik mod toggle
│   │   ├── LiradsBadge.tsx    # Renk kodlu LI-RADS etiketi
│   │   ├── MarkdownRenderer.tsx # AI rapor renderer
│   │   ├── ImageViewer.tsx    # DICOM goruntu goruntuleme
│   │   ├── Skeleton.tsx       # Yukleme animasyonlari
│   │   ├── Breadcrumb.tsx     # Sayfa yol gosterici
│   │   ├── agent/
│   │   │   ├── AgentPanels.tsx    # Dropzone, sekans, rapor, guven, alarm, checklist, lab, onceki vaka
│   │   │   ├── LesionForms.tsx    # 5 bolge lezyon formu (Abdomen, Beyin, Spine, Toraks, Pelvis)
│   │   │   ├── constants.ts       # MRI sekans listeleri + anatomik lokasyonlar
│   │   │   └── index.ts           # Barrel export
│   │   └── ui/
│   │       ├── Button.tsx         # Buton (primary, secondary, danger, ghost)
│   │       ├── Card.tsx           # Kart bilesenler (Card, CardHeader, CardTitle, CardContent)
│   │       └── FormField.tsx      # Form alanlari (FormField, Input, Select, Textarea)
│   │
│   ├── src/types/
│   │   ├── agent.ts           # Ajan tip tanimlari (ClinicalForm, Lesion tipleri, vs.)
│   │   └── audit.ts           # Audit pack tip tanimlari (AuditPack, LiradsResult, vs.)
│   │
│   └── src/lib/
│       ├── constants.ts       # API_BASE URL, LI-RADS renk haritasi, siralama
│       ├── auth.ts            # JWT token yonetimi (get/set/clear/headers)
│       └── errors.ts          # Hata mesaji formatlama
│
└── tests/
    ├── conftest.py            # Test fixture'lari (test DB, admin token)
    ├── test_api.py            # API endpoint testleri
    ├── test_audit_pack.py     # Audit pack + imza testleri
    ├── test_critical_findings.py # Kritik bulgu testleri
    └── test_lirads.py         # LI-RADS siniflandirma testleri
```

---

## Veritabani Modelleri

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Patient     │     │      Case        │     │   CaseVersion    │
├──────────────┤     ├──────────────────┤     ├──────────────────┤
│ patient_id PK│◄────│ patient_id FK    │     │ id PK            │
│ full_name    │     │ case_id PK       │◄────│ case_id FK       │
│ birth_date   │     │ created_at       │     │ version          │
│ gender       │     │ created_by       │     │ created_at       │
│ created_at   │     │ audit_pack_json  │     │ created_by       │
│ created_by   │     └──────────────────┘     │ audit_pack_json  │
└──────────────┘                              └──────────────────┘
                     ┌──────────────────┐     ┌──────────────────┐
                     │   LabResult      │     │  SecondReading   │
                     ├──────────────────┤     ├──────────────────┤
                     │ id PK            │     │ id PK            │
                     │ patient_id FK    │     │ case_id FK       │
                     │ test_name        │     │ reader_username  │
                     │ value, unit      │     │ status           │
                     │ reference_range  │     │ agreement        │
                     │ is_abnormal      │     │ original_category│
                     │ test_date        │     │ second_category  │
                     │ created_at/by    │     │ comments         │
                     └──────────────────┘     │ created/completed│
                                              └──────────────────┘
┌──────────────┐
│    User      │
├──────────────┤
│ username PK  │      Roller: admin | radiologist | viewer
│ hashed_pass  │      admin: Tum islemler
│ role         │      radiologist: Analiz, vaka, lab islemleri
│ full_name    │      viewer: Sadece goruntuleme
└──────────────┘
```

---

## Deployment (Render.com)

Proje `render.yaml` ile Render.com'a deploy edilir:

| Servis | Tip | URL |
|--------|-----|-----|
| Backend API | Python (FastAPI) | `radiology-clean-audit.onrender.com` |
| Frontend | Node.js (Next.js) | `radiology-clean-frontend.onrender.com` |

**Onemli notlar:**
- `NEXT_PUBLIC_API_BASE` build sirasinda JS'e gomulur, degistirmek icin re-deploy gerekir
- `ANTHROPIC_API_KEY` Render dashboard'dan environment variable olarak eklenir
- `AUDIT_SECRET` ve `JWT_SECRET` otomatik uretilir (`generateValue: true`)
- Her iki servis de Frankfurt bolgesinde calisir

---

## Testler

```bash
# Tum testleri calistir
pytest tests/ -v

# Belirli test dosyasi
pytest tests/test_lirads.py -v          # LI-RADS siniflandirma
pytest tests/test_critical_findings.py -v  # Kritik bulgu
pytest tests/test_audit_pack.py -v      # Audit pack + imza
pytest tests/test_api.py -v             # API endpoint'leri
```

---

## Tema ve Dark Mode

- Sag ust kosede gunes/ay ikonu ile tema degistirilebilir
- Tercih `localStorage`'da saklanir
- Sistem tercihi (OS dark mode) da desteklenir
- Tum sayfalar ve bilesenler dark mode desteklidir

---

## Guvenlik

- **JWT Token**: HS256 algoritmasi, yapilandirilabirr sureli token (varsayilan: 8 saat)
- **Sifre Hashleme**: PBKDF2-HMAC-SHA256, 260.000 iterasyon, rastgele salt
- **Rate Limiting**: Auth endpoint'lerinde dakikada 10 istek siniri
- **CORS**: Yapilandirabilir izinli originler
- **Audit Pack Imzasi**: HMAC-SHA256 ile kurcalanma tespiti
- **Hash Zinciri**: Her versiyon onceki versiyonun hash'ini icerir (blockchain benzeri)
- **Rol Tabanli Erisim**: admin (tam yetki), radiologist (analiz + CRUD), viewer (sadece goruntuleme)

---

## Lisans

MIT
