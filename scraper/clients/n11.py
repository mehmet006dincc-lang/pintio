"""N11 store client."""

from __future__ import annotations

import re

from curl_cffi.requests import AsyncSession

from clients.base import normalize_product, parse_js_object, parse_turkish_price

STORE = 'n11'
BASE = 'https://www.n11.com'

LISTING_SOURCES = [
    {'query': 'telefon', 'label': 'Telefon', 'path': '/arama?q=telefon&pg={page}'},
    {'query': 'laptop', 'label': 'Laptop', 'path': '/arama?q=laptop&pg={page}'},
    {'query': 'kulaklik', 'label': 'Kulaklık', 'path': '/arama?q=kulaklik&pg={page}'},
    {'query': 'ayakkabi', 'label': 'Ayakkabı', 'path': '/arama?q=ayakkabi&pg={page}'},
    {'query': 'tablet', 'label': 'Tablet', 'path': '/arama?q=tablet&pg={page}'},
]


def extract_product_id_from_url(url: str) -> str | None:
    match = re.search(r'-(\d{6,})(?:\?|$|/)', url)
    return match.group(1) if match else None


def _parse_listing_item(raw: dict) -> dict | None:
    pid = raw.get('id')
    if not pid:
        return None

    url_path = raw.get('url') or raw.get('seoUrl') or ''
    if url_path and not url_path.startswith('http'):
        url_path = f'{BASE}{url_path.split("?")[0]}'

    images = raw.get('imagePathList') or []
    image = images[0].replace('{0}', 'org') if images else None

    current = raw.get('displayPrice') or raw.get('price')
    if isinstance(current, str):
        current = parse_turkish_price(current)
    elif current is not None:
        current = float(current)

    old = raw.get('oldPrice')
    original = parse_turkish_price(old) if old else None

    return normalize_product({
        'external_product_id': str(pid),
        'title': raw.get('title') or '',
        'brand': raw.get('brand'),
        'image_url': image,
        'product_url': url_path,
        'current_price': current,
        'original_price': original,
        'category_hint': '',
    }, STORE)


async def fetch_listing_page(client: AsyncSession, listing_query: str, page: int = 1) -> list[dict]:
    source = next((s for s in LISTING_SOURCES if s['query'] == listing_query), LISTING_SOURCES[0])
    url = BASE + source['path'].format(page=page)
    try:
        resp = await client.get(url, timeout=25)
        if resp.status_code != 200:
            return []
    except Exception as e:
        print(f'[n11] Listing error: {e}')
        return []

    model = parse_js_object(resp.text)
    if not model:
        return []

    items = model.get('data', {}).get('productListingItems') or []
    products = [_parse_listing_item(item) for item in items]
    return [p for p in products if p and p.get('external_product_id') and p.get('current_price') is not None]


async def fetch_product_detail(client: AsyncSession, product_id: str, product_url: str | None = None) -> dict | None:
    page_url = product_url
    if not page_url:
        return None

    try:
        resp = await client.get(page_url, timeout=25)
        if resp.status_code != 200:
            return None

        model = parse_js_object(resp.text)
        if model:
            prod = model.get('data', {}).get('product') or {}
            if prod:
                current = parse_turkish_price(prod.get('displayPrice') or prod.get('price'))
                old = parse_turkish_price(prod.get('oldPrice'))
                images = prod.get('images') or prod.get('imagePathList') or []
                image = None
                if images:
                    img = images[0]
                    image = img.replace('{0}', 'org') if isinstance(img, str) else None
                if current is not None:
                    return normalize_product({
                        'external_product_id': str(prod.get('id') or product_id),
                        'title': prod.get('title') or '',
                        'brand': prod.get('brand'),
                        'image_url': image,
                        'product_url': page_url.split('?')[0],
                        'current_price': current,
                        'original_price': old,
                        'in_stock': (prod.get('stock') or 0) > 0,
                    }, STORE)
    except Exception as e:
        print(f'[n11] Product {product_id} error: {e}')
    return None
