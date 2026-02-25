# Radiology-Clean Audit

Radyoloji MRI vakalarini yapilandirmak, analiz etmek ve denetlemek icin kapsamli bir platform. LI-RADS siniflandirma motoru, AI destekli radyolog ajani, imzali audit pack'ler ve PDF rapor uretimi iceriyor.

## Canli Demo

| Servis | URL |
|--------|-----|
| **Frontend** | https://radiology-clean-frontend.onrender.com |
| **Backend API** | https://radiology-clean-audit.onrender.com |
| **API Docs (Swagger)** | https://radiology-clean-audit.onrender.com/docs |

**Giris Bilgileri:** `admin` / `Admin123!`

## Ozellikler

### Vaka Yonetimi
- LI-RADS karar motoru ile otomatik kategori siniflandirmasi (LR-1 ~ LR-5, LR-M, LR-TIV)
- Arteriyel, portal ve gecikme fazlarina dayali analiz
- Vaka versiyon gecmisi (audit trail)
- Vaka silme (sadece admin)

### AI Radyolog Ajani
- DICOM goruntu yukleme ve isleme
- Claude AI destekli MRI rapor uretimi (SSE streaming)
- Egitim modu (ogrenci dostu aciklamalar)
- Takip soru-cevap ozelligi
- Bolgeye ozel kontrol listeleri (abdomen, beyin, omurga, toraks, pelvis)

### Hasta Yonetimi
- Hasta kaydi olusturma ve listeleme
- Hasta bazli vaka gecmisi
- Onceki vakalarla karsilastirma

### Laboratuvar Sonuclari
- Hasta bazli lab sonucu ekleme/listeleme/silme
- Anormal deger isaretleme

### Ikinci Okuma (Second Reading)
- Vaka bazli ikinci okuma atama
- Uzlasma/uyusmazlik takibi
- JSON formatta toplu disari aktarma

### Guvenlik ve Denetim
- HMAC-SHA256 imzali audit pack'ler
- PBKDF2-HMAC-SHA256 sifre hashleme (260.000 iterasyon)
- JWT tabanli kimlik dogrulama (HS256)
- Rol tabanli erisim kontrolu (admin, radiologist, viewer)
- Rate limiting (10 istek/dakika login)
- QR kod ile bagimsiz dogrulama

### Rapor ve Disari Aktarma
- PDF rapor uretimi (imza + QR kod dahil)
- JSON formatta vaka disari aktarma
- Dashboard istatistikleri (LI-RADS dagilimi, risk analizi)
- Vaka karsilastirma ekrani

## Teknoloji

| Katman | Teknoloji |
|--------|-----------|
| **Backend** | Python 3.12, FastAPI, SQLAlchemy, SQLite |
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS |
| **AI** | Claude API (Anthropic) |
| **Kimlik Dogrulama** | JWT (HS256), PBKDF2 sifre hashleme |
| **Deployment** | Render (backend + frontend) |

## Proje Yapisi

```
Desktop/radiology-clean-audit/
├── main.py                 # FastAPI ana uygulama ve tum endpoint'ler
├── db.py                   # Veritabani baglantisi (SQLite/PostgreSQL)
├── models.py               # SQLAlchemy ORM modelleri
├── requirements.txt        # Python bagimliliklari
├── Dockerfile              # Docker multi-stage build
├── docker-compose.yml      # Docker Compose yapilandirmasi
├── render.yaml             # Render Blueprint (backend + frontend)
├── core/
│   ├── auth.py             # JWT + sifre hashleme
│   ├── critical_findings.py # Kritik bulgu tespiti
│   ├── agent/
│   │   ├── radiologist.py  # AI radyolog ajani
│   │   └── dicom_utils.py  # DICOM goruntu isleme
│   └── export/
│       ├── audit_pack.py   # Imzali audit pack olusturma
│       └── pdf_export.py   # PDF rapor uretimi
├── store/
│   ├── store.py            # Vaka CRUD islemleri
│   ├── user_store.py       # Kullanici yonetimi
│   ├── patient_store.py    # Hasta yonetimi
│   ├── lab_store.py        # Lab sonucu yonetimi
│   └── second_read_store.py # Ikinci okuma yonetimi
├── tests/                  # Pytest test suite
└── frontend/               # Next.js frontend uygulamasi
    └── src/app/
        ├── page.tsx        # Giris + vaka listesi
        ├── dashboard/      # Istatistik paneli
        ├── new/            # Yeni vaka olusturma
        ├── cases/          # Vaka detay sayfasi
        ├── patients/       # Hasta yonetimi
        ├── agent/          # AI radyolog ajani
        ├── second-reading/ # Ikinci okuma
        └── compare/        # Vaka karsilastirma
```

## Yerel Kurulum

### Backend

```bash
cd Desktop/radiology-clean-audit
pip install -r requirements.txt

# .env dosyasi olusturun
cp .env.example .env
# .env icindeki JWT_SECRET ve AUDIT_SECRET degerlerini degistirin

# Sunucuyu baslatin
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd Desktop/radiology-clean-audit/frontend
npm install

# .env.local dosyasi olusturun
echo "NEXT_PUBLIC_API_BASE=http://localhost:8000" > .env.local

# Gelistirme sunucusunu baslatin
npm run dev
```

Tarayicinizda http://localhost:3000 adresini acin.

### Docker ile Calistirma

```bash
cd Desktop/radiology-clean-audit
docker-compose up --build
```

## API Endpoint'leri

| Metot | Endpoint | Aciklama | Yetki |
|-------|----------|----------|-------|
| POST | `/auth/token` | Giris yap | - |
| GET | `/auth/me` | Mevcut kullanici bilgisi | * |
| GET | `/` | Saglik kontrolu | - |
| POST | `/analyze/{case_id}` | Vaka analizi | admin, radiologist |
| GET | `/cases` | Vaka listesi | * |
| GET | `/cases/{case_id}` | Vaka detayi | * |
| DELETE | `/cases/{case_id}` | Vaka silme | admin |
| GET | `/cases/{case_id}/versions` | Versiyon gecmisi | * |
| GET | `/stats` | Dashboard istatistikleri | * |
| GET | `/verify/{case_id}` | Imza dogrulama | - |
| GET | `/export/pdf/{case_id}` | PDF rapor | * |
| GET | `/export/json/{case_id}` | JSON disari aktarma | * |
| POST | `/patients` | Hasta olusturma | admin, radiologist |
| GET | `/patients` | Hasta listesi | * |
| GET | `/patients/{patient_id}` | Hasta detayi | * |
| GET | `/patients/{patient_id}/prior-cases` | Onceki vakalar | * |
| POST | `/agent/analyze` | AI analiz (SSE stream) | admin, radiologist |
| POST | `/agent/save` | AI rapor kaydet | admin, radiologist |
| POST | `/agent/followup` | AI takip sorusu (SSE) | admin, radiologist |
| GET | `/checklist/{region}` | Bolge kontrol listesi | * |
| POST | `/labs` | Lab sonucu ekle | admin, radiologist |
| GET | `/labs/{patient_id}` | Lab sonuclari | * |
| DELETE | `/labs/{lab_id}` | Lab sonucu sil | admin, radiologist |
| POST | `/second-readings` | Ikinci okuma ata | admin |
| POST | `/second-readings/{id}/complete` | Ikinci okuma tamamla | admin, radiologist |
| GET | `/second-readings` | Ikinci okuma listesi | * |
| GET | `/second-readings/export` | Toplu disari aktarma | admin |
| POST | `/critical-findings` | Kritik bulgu tespiti | * |

## Ortam Degiskenleri

### Backend

| Degisken | Aciklama | Varsayilan |
|----------|----------|------------|
| `JWT_SECRET` | JWT imzalama anahtari | `DEV_ONLY_FALLBACK_SECRET` |
| `AUDIT_SECRET` | Audit pack imzalama anahtari | - |
| `DEFAULT_ADMIN_USER` | Varsayilan admin kullanici adi | `admin` |
| `DEFAULT_ADMIN_PASS` | Varsayilan admin sifresi | `admin123` |
| `ALLOWED_ORIGINS` | CORS izinli originler (`*` tumu) | `*` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token suresi (dakika) | `480` |
| `DATABASE_URL` | Veritabani baglanti adresi | `sqlite:///./radiology_clean.db` |
| `VERIFY_BASE_URL` | Dogrulama URL'si | `http://localhost:8000` |
| `ANTHROPIC_API_KEY` | Claude API anahtari (AI ajan icin) | - |

### Frontend

| Degisken | Aciklama | Varsayilan |
|----------|----------|------------|
| `NEXT_PUBLIC_API_BASE` | Backend API URL'si | `http://localhost:8000` |

## Testler

```bash
cd Desktop/radiology-clean-audit
pytest tests/ -v
```

## Lisans

Bu proje ozel kullanim icindir.
