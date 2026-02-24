#!/bin/bash
# ============================================================
#  Radiology-Clean — Tek komutla başlat
#  Kullanım: ./baslat.sh
# ============================================================

PROJE_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_PORT=8000
FRONTEND_PORT=3000

YESIL="\033[0;32m"
SARI="\033[0;33m"
KIRMIZI="\033[0;31m"
MAVI="\033[0;34m"
RESET="\033[0m"

log()    { echo -e "${MAVI}[BASLAT]${RESET} $1"; }
basari() { echo -e "${YESIL}[OK]${RESET}    $1"; }
uyari()  { echo -e "${SARI}[UYARI]${RESET} $1"; }
hata()   { echo -e "${KIRMIZI}[HATA]${RESET}  $1"; }

temizle_port() {
  local PORT=$1
  local PID
  PID=$(lsof -ti tcp:$PORT 2>/dev/null)
  if [ -n "$PID" ]; then
    uyari "Port $PORT dolu, kapatılıyor (PID: $PID)..."
    kill -9 $PID 2>/dev/null
    sleep 1
  fi
}

echo ""
echo -e "${MAVI}================================================${RESET}"
echo -e "${MAVI}   Radiology-Clean Audit Sistemi Başlatılıyor   ${RESET}"
echo -e "${MAVI}================================================${RESET}"
echo ""

cd "$PROJE_DIR"

# ── .env kontrolü ──────────────────────────────────────────
if [ ! -f ".env" ]; then
  log ".env dosyası oluşturuluyor..."
  cp .env.example .env
  sed -i 's/CHANGE_ME_STRONG_SECRET_HERE/radiology_audit_secret_2024/g' .env
  sed -i 's/CHANGE_ME_STRONG_JWT_SECRET_HERE/radiology_jwt_secret_2024/g' .env
  sed -i 's/CHANGE_ME_ADMIN_PASSWORD/admin123/g' .env
  basari ".env oluşturuldu  (admin şifre: admin123)"
else
  basari ".env mevcut, atlanıyor"
fi

# ── Python bağımlılıkları ───────────────────────────────────
log "Python bağımlılıkları kontrol ediliyor..."
pip install -q -r requirements.txt
basari "Python paketleri hazır"

# ── npm bağımlılıkları ──────────────────────────────────────
if [ ! -d "frontend/node_modules" ]; then
  log "npm paketleri yükleniyor (ilk çalıştırma, biraz sürebilir)..."
  cd frontend && npm install --silent 2>&1 | tail -3
  cd "$PROJE_DIR"
  basari "npm paketleri hazır"
else
  basari "node_modules mevcut, atlanıyor"
fi

# ── Eski süreçleri temizle ──────────────────────────────────
temizle_port $BACKEND_PORT
temizle_port $FRONTEND_PORT

# ── Backend başlat ──────────────────────────────────────────
log "Backend başlatılıyor (port $BACKEND_PORT)..."
cd "$PROJE_DIR"
uvicorn main:app --host 0.0.0.0 --port $BACKEND_PORT > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

# Backend hazır olana kadar bekle
DENEME=0
until curl -s http://localhost:$BACKEND_PORT/ > /dev/null 2>&1; do
  sleep 1
  DENEME=$((DENEME+1))
  if [ $DENEME -ge 15 ]; then
    hata "Backend başlamadı! Log:"
    tail -20 /tmp/backend.log
    exit 1
  fi
done
basari "Backend hazır  → http://localhost:$BACKEND_PORT"
basari "Swagger UI    → http://localhost:$BACKEND_PORT/docs"

# ── Frontend başlat ─────────────────────────────────────────
log "Frontend başlatılıyor (port $FRONTEND_PORT)..."
cd "$PROJE_DIR/frontend"
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!

# Frontend hazır olana kadar bekle
DENEME=0
until curl -s http://localhost:$FRONTEND_PORT/ > /dev/null 2>&1; do
  sleep 1
  DENEME=$((DENEME+1))
  if [ $DENEME -ge 30 ]; then
    uyari "Frontend yavaş başlıyor, devam ediliyor..."
    break
  fi
done
basari "Frontend hazır → http://localhost:$FRONTEND_PORT"

echo ""
echo -e "${YESIL}================================================${RESET}"
echo -e "${YESIL}   Her şey çalışıyor!                          ${RESET}"
echo -e "${YESIL}================================================${RESET}"
echo ""
echo -e "  Uygulama  : ${MAVI}http://localhost:$FRONTEND_PORT${RESET}"
echo -e "  API Docs  : ${MAVI}http://localhost:$BACKEND_PORT/docs${RESET}"
echo -e "  Kullanıcı : ${SARI}admin${RESET}  /  Şifre: ${SARI}admin123${RESET}"
echo ""
echo -e "  Durdurmak için: ${KIRMIZI}CTRL+C${RESET}"
echo ""

# ── Kapatma sinyali ─────────────────────────────────────────
trap "echo ''; uyari 'Kapatılıyor...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

# Canlı logları göster
tail -f /tmp/backend.log /tmp/frontend.log &
wait $BACKEND_PID $FRONTEND_PID
