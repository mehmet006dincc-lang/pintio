import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://indirimtakip:indirimtakip@localhost:5432/indirimtakip')
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')
FLASH_SEED_LIMIT = int(os.getenv('FLASH_SEED_LIMIT', '10000'))
SEED_PER_STORE = int(os.getenv('SEED_PER_STORE', '500'))
P0_INTERVAL = int(os.getenv('P0_CHECK_INTERVAL_SEC', '90'))
P1_INTERVAL = int(os.getenv('P1_CHECK_INTERVAL_SEC', '180'))
WORKERS = int(os.getenv('SCRAPER_WORKERS', '8'))

TRENDYOL_MOBILE_UA = (
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) '
    'AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
)

TRENDYOL_DESKTOP_UA = (
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
    'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
)

# Listing sources for seed (HTML scraping — apigw often blocks datacenter IPs)
FLASH_LISTING_SOURCES = [
    {'query': 'tag=flashsale', 'label': 'Flaş İndirimler'},
    {'query': 'tag=flas-indirimleri', 'label': 'Flaş İndirimleri'},
    {'query': 'sst=BEST_SELLER', 'label': 'Çok Satanlar'},
    {'query': 'sst=PRICE_BY_DESC', 'label': 'Fiyat Azalan'},
    {'query': 'wc=103799', 'label': 'Kadın Giyim'},
    {'query': 'wc=104024', 'label': 'Erkek Giyim'},
    {'query': 'wc=104593', 'label': 'Elektronik'},
    {'query': 'wc=104024&lc=109054', 'label': 'Ayakkabı'},
    {'query': 'wc=109053', 'label': 'Ev & Yaşam'},
    {'query': 'wc=103799&prc=0-500', 'label': '500 TL Altı'},
]

CATEGORY_MAP = {
    'giyim': 2, 'moda': 2, 'ayakkabi': 2,
    'elektronik': 3, 'telefon': 3, 'bilgisayar': 3,
    'ev': 4, 'mobilya': 4, 'mutfak': 4,
    'kozmetik': 5, 'makyaj': 5, 'parfum': 5,
    'oyun': 6, 'hobi': 6,
}
