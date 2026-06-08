#!/bin/bash
# Push bildirimleri için tek seferlik kurulum
set -e
cd "$(dirname "$0")"

echo "=== Pintio Push Kurulumu ==="
echo ""

if ! npx expo whoami 2>/dev/null; then
  echo "1) Expo hesabına giriş yap:"
  echo "   npx expo login"
  echo ""
  read -p "Giriş yaptıktan sonra Enter'a bas..."
fi

echo "✓ Expo: $(npx expo whoami)"
echo ""

if ! grep -q '"projectId"' app.json 2>/dev/null; then
  echo "2) EAS projesi oluştur:"
  echo "   npm run eas:init"
  echo ""
  read -p "eas init bittikten sonra Enter'a bas..."
fi

PROJECT_ID=$(node -e "const j=require('./app.json'); console.log(j.expo?.extra?.eas?.projectId||'')")
if [ -n "$PROJECT_ID" ]; then
  echo "✓ Project ID: $PROJECT_ID"
  if ! grep -q "EXPO_PUBLIC_EAS_PROJECT_ID" .env 2>/dev/null; then
    echo "EXPO_PUBLIC_EAS_PROJECT_ID=$PROJECT_ID" >> .env
    echo "✓ .env dosyasına eklendi"
  fi
else
  echo "⚠ Project ID bulunamadı — npm run eas:init çalıştır"
  exit 1
fi

echo ""
echo "3) Expo'yu yeniden başlat:"
echo "   npx expo start --clear"
echo ""
echo "4) Telefonda: Profil → Bildirim Ayarları → Push Bildirimlerini Aç"
echo ""
echo "5) Test:"
echo "   cd ../scraper && python send_test_push.py"
