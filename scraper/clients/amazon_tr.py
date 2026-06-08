"""Amazon TR store client."""

from __future__ import annotations

import re

from curl_cffi.requests import AsyncSession

from clients.base import normalize_product, parse_turkish_price

STORE = 'amazon'
BASE = 'https://www.amazon.com.tr'

LISTING_SOURCES = [
    {'query': 'iphone', 'label': 'iPhone', 'path': '/s?k=iphone&page={page}'},
    {'query': 'samsung', 'label': 'Samsung', 'path': '/s?k=samsung+telefon&page={page}'},
    {'query': 'laptop', 'label': 'Laptop', 'path': '/s?k=laptop&page={page}'},
    {'query': 'kulaklik', 'label': 'Kulaklık', 'path': '/s?k=kulaklik&page={page}'},
    {'query': 'tablet', 'label': 'Tablet', 'path': '/s?k=tablet&page={page}'},
]


def extract_product_id_from_url(url: str) -> str | None:
    match = re.search(r'(?:/dp/|/gp/product/)([A-Z0-9]{10})', url, re.I)
    return match.group(1).upper() if match else None


def _parse_search_block(block: str) -> dict | None:
    asin_m = re.search(r'data-asin="(B0[A-Z0-9]{8})"', block)
    if not asin_m:
        return None
    asin = asin_m.group(1)

    title_m = re.search(r'<h2[^>]*>\s*<a[^>]*>\s*<span>([^<]+)</span>', block, re.DOTALL)
    if not title_m:
        title_m = re.search(r'<h2[^>]*>\s*<span>([^<]+)</span>', block, re.DOTALL)

    price_m = re.search(r'class="a-offscreen">([^<]+)</span>', block)
    if not title_m or not price_m:
        return None

    current = parse_turkish_price(price_m.group(1))
    if current is None:
        return None

    img_m = re.search(r'src="(https://m\.media-amazon\.com/images/[^"]+)"', block)

    return normalize_product({
        'external_product_id': asin,
        'title': title_m.group(1).strip(),
        'brand': None,
        'image_url': img_m.group(1) if img_m else None,
        'product_url': f'{BASE}/dp/{asin}',
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
        print(f'[amazon] Listing error: {e}')
        return []

    blocks = re.split(r'data-component-type="s-search-result"', resp.text)
    products: list[dict] = []
    seen: set[str] = set()

    for block in blocks[1:]:
        parsed = _parse_search_block(block)
        if not parsed:
            continue
        asin = parsed['external_product_id']
        if asin in seen:
            continue
        seen.add(asin)
        products.append(parsed)

    return products


async def fetch_product_detail(client: AsyncSession, product_id: str, product_url: str | None = None) -> dict | None:
    page_url = product_url or f'{BASE}/dp/{product_id}'
    try:
        resp = await client.get(page_url, timeout=25)
        if resp.status_code != 200:
            return None
        t = resp.text

        title = re.search(r'id="productTitle"[^>]*>\s*([^<]+)', t)
        price_m = re.search(r'class="a-offscreen">([^<]+)</span>', t)
        orig = re.search(r'class="a-text-price".*?class="a-offscreen">([^<]+)', t, re.DOTALL)
        img = re.search(r'id="landingImage"[^>]*src="([^"]+)"', t)

        if not title or not price_m:
            return None

        current = parse_turkish_price(price_m.group(1))
        if current is None:
            return None

        original = parse_turkish_price(orig.group(1)) if orig else None

        return normalize_product({
            'external_product_id': product_id,
            'title': title.group(1).strip(),
            'product_url': page_url.split('?')[0],
            'image_url': img.group(1) if img else None,
            'current_price': current,
            'original_price': original if original and original != current else None,
        }, STORE)
    except Exception as e:
        print(f'[amazon] Product {product_id} error: {e}')
    return None
