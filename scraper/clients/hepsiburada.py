"""Hepsiburada store client."""

from __future__ import annotations

import json
import re

from curl_cffi.requests import AsyncSession

from clients.base import normalize_product, parse_turkish_price

STORE = 'hepsiburada'
BASE = 'https://www.hepsiburada.com'

NAV_TITLES = frozenset({'siparişlerim', 'hesabım', 'sepetim', 'favorilerim'})

LISTING_SOURCES = [
    {'query': 'telefon', 'label': 'Telefon Arama', 'path': '/ara?q=telefon&sayfa={page}'},
    {'query': 'laptop', 'label': 'Laptop Arama', 'path': '/ara?q=laptop&sayfa={page}'},
    {'query': 'kulaklik', 'label': 'Kulaklık', 'path': '/ara?q=kulaklik&sayfa={page}'},
    {'query': 'cep-telefonlari', 'label': 'Cep Telefonları', 'path': '/cep-telefonlari-c-371965?sayfa={page}'},
    {'query': 'bilgisayar', 'label': 'Bilgisayar', 'path': '/ara?q=bilgisayar&sayfa={page}'},
]


def extract_product_id_from_url(url: str) -> str | None:
    match = re.search(r'-p-(HBCV[A-Z0-9]+)', url, re.I)
    return match.group(1).upper() if match else None


def _parse_card_chunk(chunk: str) -> dict | None:
    title_m = re.search(r'title="([^"]{10,200})"', chunk)
    href_m = re.search(r'href="(/[^"]+-p-(HBCV[A-Z0-9]+))"', chunk, re.I)
    if not title_m or not href_m:
        return None

    sku = href_m.group(2).upper()
    title = title_m.group(1)
    if title.strip().lower() in NAV_TITLES:
        return None

    prices = re.findall(r'(\d[\d.]*) TL', chunk)
    current = parse_turkish_price(prices[0]) if prices else None
    if current is None or current < 50:
        return None

    img_m = re.search(r'srcSet="(https://productimages[^"\s]+)', chunk)

    return normalize_product({
        'external_product_id': sku,
        'title': title,
        'brand': None,
        'image_url': img_m.group(1) if img_m else None,
        'product_url': f'{BASE}{href_m.group(1).split("?")[0]}',
        'current_price': current,
        'original_price': None,
        'category_hint': 'elektronik',
    }, STORE)


async def fetch_listing_page(client: AsyncSession, listing_query: str, page: int = 1) -> list[dict]:
    source = next((s for s in LISTING_SOURCES if s['query'] == listing_query), LISTING_SOURCES[0])
    url = BASE + source['path'].format(page=page)
    try:
        resp = await client.get(url, timeout=25)
        if resp.status_code != 200:
            return []
    except Exception as e:
        print(f'[hepsiburada] Listing error: {e}')
        return []

    chunks = re.split(r'productCardLink-module_productCardLink__', resp.text)
    products: list[dict] = []
    seen: set[str] = set()
    for chunk in chunks[1:]:
        parsed = _parse_card_chunk(chunk)
        if not parsed:
            continue
        pid = parsed['external_product_id']
        if pid in seen:
            continue
        seen.add(pid)
        if parsed.get('current_price') is not None:
            products.append(parsed)
    return products


async def fetch_product_detail(client: AsyncSession, product_id: str, product_url: str | None = None) -> dict | None:
    page_url = product_url or f'{BASE}/-p-{product_id}'
    try:
        resp = await client.get(page_url, timeout=25)
        if resp.status_code != 200:
            return None
        t = resp.text

        price_q = re.search(r'"price"\s*:\s*"([0-9.]+)"', t)
        name = re.search(r'<meta name="title" content="([^"]+)"', t)
        if not name:
            name = re.search(r'<title>([^<|]+)', t)
        orig = re.search(r'"originalPrice"\s*:\s*"([0-9.]+)"', t)
        img = re.search(r'property="og:image" content="([^"]+)"', t)

        if name and price_q:
            current = float(price_q.group(1))
            original = float(orig.group(1)) if orig else None
            return normalize_product({
                'external_product_id': product_id,
                'title': name.group(1).strip(),
                'product_url': page_url.split('?')[0],
                'image_url': img.group(1) if img else None,
                'current_price': current,
                'original_price': original if original and original != current else None,
            }, STORE)

        for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', t, re.DOTALL):
            try:
                data = json.loads(block)
                if isinstance(data, dict) and data.get('@type') == 'Product':
                    offers = data.get('offers') or {}
                    price = parse_turkish_price(offers.get('price'))
                    if price is not None:
                        return normalize_product({
                            'external_product_id': product_id,
                            'title': data.get('name') or '',
                            'brand': data.get('brand', {}).get('name') if isinstance(data.get('brand'), dict) else data.get('brand'),
                            'image_url': data.get('image', [None])[0] if isinstance(data.get('image'), list) else data.get('image'),
                            'product_url': page_url.split('?')[0],
                            'current_price': price,
                            'original_price': None,
                            'in_stock': offers.get('availability', '').endswith('InStock'),
                        }, STORE)
            except json.JSONDecodeError:
                pass

        idx = t.find(product_id)
        ctx = t[max(0, idx - 500): idx + 4000] if idx >= 0 else t[:5000]
        name = re.search(r'"productName"\s*:\s*"([^"]+)"', ctx)
        price = re.search(r'"price"\s*:\s*\{"value"\s*:\s*([0-9.]+)', ctx)
        orig = re.search(r'"originalPrice"\s*:\s*\{"value"\s*:\s*([0-9.]+)', ctx)
        brand = re.search(r'"brand"\s*:\s*"([^"]+)"', ctx)
        if name and price:
            return normalize_product({
                'external_product_id': product_id,
                'title': name.group(1),
                'brand': brand.group(1) if brand else None,
                'product_url': page_url.split('?')[0],
                'current_price': float(price.group(1)),
                'original_price': float(orig.group(1)) if orig else None,
            }, STORE)
    except Exception as e:
        print(f'[hepsiburada] Product {product_id} error: {e}')
    return None
