# Pintio

Çoklu mağaza indirim takip uygulaması — OnuAl tarzı fiyat izleme, anlık bildirimler ve fiyat grafiği.

Desteklenen mağazalar: Trendyol, Hepsiburada, N11, MediaMarkt, Amazon TR, Migros.

## Proje yapısı

```
indirimtakip/
├── mobile/      # Expo (React Native) — iOS & Android
├── backend/     # NestJS REST API
├── scraper/     # Python — çoklu mağaza seed + fiyat worker
└── docker-compose.yml
```

## Hızlı başlangıç

### 1. Veritabanı ve Redis

```bash
cp .env.example .env
docker compose up -d
```

### 2. Backend API

```bash
cd backend
npm install
npm run start:dev
```

API: http://localhost:3000

### 3. Scraper (flaş 10K seed + fiyat izleme)

```bash
cd scraper
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# İlk kez: tüm mağazalardan ürün çek
python seed_all.py

# Sürekli fiyat izleme (8 worker)
python worker.py
```

### 4. Mobil uygulama

```bash
cd mobile
npm install
# Fiziksel cihaz için bilgisayar IP'nizi kullanın:
echo "EXPO_PUBLIC_API_URL=http://192.168.x.x:3000" > .env
npm start
```

## Özellikler (MVP)

- Kayıt / giriş (e-posta + Apple + Google)
- 6 mağazadan ürün seed (Trendyol, HB, N11, MediaMarkt, Amazon, Migros)
- 3 dk'da bir fiyat tarama (P1), favoriler 90 sn (P0)
- İndirim kuralları: 6 ayın en düşüğü + % eşikleri
- Favori + push bildirim altyapısı
- Sponsor banner carousel
- Ürün detay + 6 aylık fiyat grafiği
- URL ile ürün takibi

## API endpoints

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | /api/auth/register | - |
| POST | /api/auth/login | - |
| POST | /api/auth/oauth | - |
| GET | /api/products/flash | - |
| GET | /api/products/featured | - |
| GET | /api/products/:id | - |
| GET | /api/products/:id/price-history | - |
| POST | /api/products/track-url | JWT |
| GET | /api/favorites | JWT |
| POST | /api/favorites/:id | JWT |
| GET | /api/banners | - |

## Production deploy (VPS)

### Faz 3 — `.env` (sen buradasın)

```bash
cp .env.example .env
# POSTGRES_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET düzenle
# API_URL=https://api.pintio.app
```

`docker-compose.yml` şifreyi `.env` içindeki `POSTGRES_PASSWORD` ile kullanır.

### Faz 4–6 — Tek komut

```bash
chmod +x deploy/*.sh
./deploy/setup.sh
```

Bu script: Docker up → migration → backend build → PM2 API → scraper venv.

### Manuel (Mac / PM2 yoksa)

```bash
docker compose up -d
docker compose exec -T postgres psql -U indirimtakip -d indirimtakip < backend/db/migrations/002_multi_store.sql

# Terminal 1
./deploy/start-api.sh

# Terminal 2
./deploy/start-worker.sh

# İlk seed (uzun sürer)
./deploy/seed.sh
```

### Faz 7 — Nginx + SSL

```bash
sudo cp deploy/nginx-api.conf /etc/nginx/sites-available/pintio-api
sudo ln -s /etc/nginx/sites-available/pintio-api /etc/nginx/sites-enabled/
sudo certbot --nginx -d api.pintio.app
```

### Mobil

```bash
# mobile/.env
EXPO_PUBLIC_API_URL=https://api.pintio.app
```

## Sonraki adımlar

- [ ] Google OAuth Client ID yapılandırması
- [ ] Firebase FCM push entegrasyonu
- [ ] Trendyol affiliate linkleri
- [ ] Katalog 50K → 500K genişletme
- [ ] App Store / Play Store yayını
