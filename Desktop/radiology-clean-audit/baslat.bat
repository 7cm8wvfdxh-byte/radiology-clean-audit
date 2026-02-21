@echo off
chcp 65001 >nul
title Radiology-Clean Audit Sistemi

echo.
echo ================================================
echo    Radiology-Clean Audit Sistemi Baslatiliyor
echo ================================================
echo.

cd /d "%~dp0"

REM ── .env kontrolü ──────────────────────────────────
if not exist ".env" (
    echo [KURULUM] .env dosyasi olusturuluyor...
    copy .env.example .env >nul
    powershell -Command "(gc .env) -replace 'CHANGE_ME_STRONG_SECRET_HERE','radiology_audit_secret_2024' | Set-Content .env"
    powershell -Command "(gc .env) -replace 'CHANGE_ME_STRONG_JWT_SECRET_HERE','radiology_jwt_secret_2024' | Set-Content .env"
    powershell -Command "(gc .env) -replace 'CHANGE_ME_ADMIN_PASSWORD','admin123' | Set-Content .env"
    echo [OK] .env olusturuldu  (admin sifre: admin123)
) else (
    echo [OK] .env mevcut
)

REM ── Python bagimliliklari ───────────────────────────
echo [KURULUM] Python paketleri kontrol ediliyor...
pip install -q -r requirements.txt
echo [OK] Python paketleri hazir

REM ── npm bagimliliklari ──────────────────────────────
if not exist "frontend\node_modules" (
    echo [KURULUM] npm paketleri yukleniyor (ilk calisma, bekleyin...^)
    cd frontend
    npm install
    cd ..
    echo [OK] npm paketleri hazir
) else (
    echo [OK] node_modules mevcut
)

REM ── Eski surecleri temizle ──────────────────────────
echo [TEMIZLE] Portlar temizleniyor...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":8000 "') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3000 "') do (
    taskkill /PID %%a /F >nul 2>&1
)

REM ── Backend baslat ──────────────────────────────────
echo [BASLAT] Backend baslatiliyor (port 8000^)...
start "Backend - Uvicorn" cmd /k "cd /d %~dp0 && uvicorn main:app --host 0.0.0.0 --port 8000"

REM Backend hazir olana kadar bekle
echo Bekleniliyor...
timeout /t 5 /nobreak >nul

REM ── Frontend baslat ─────────────────────────────────
echo [BASLAT] Frontend baslatiliyor (port 3000^)...
start "Frontend - Next.js" cmd /k "cd /d %~dp0\frontend && npm run dev"

REM Frontend hazir olana kadar bekle
timeout /t 8 /nobreak >nul

echo.
echo ================================================
echo   Her sey calisıyor!
echo ================================================
echo.
echo   Uygulama  : http://localhost:3000
echo   API Docs  : http://localhost:8000/docs
echo   Kullanici : admin  /  Sifre: admin123
echo.
echo   Kapatmak icin acilan terminalleri kapatin.
echo.

REM Tarayiciyi ac
start http://localhost:3000

pause
