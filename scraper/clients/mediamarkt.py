"""MediaMarkt TR store client."""

from __future__ import annotations

import re

from curl_cffi.requests import AsyncSession

from clients.base import normalize_product, parse_turkish_price

STORE = 'mediamarkt'
BASE = 'https://www.mediamarkt.com.tr'

LISTING_SOURCES = [
    {'query': 'iphone', 'label': 'iPhone', 'path': '/tr/search.html?query=iphone&page={page}'},
    {'query': 'samsung', 'label': 'Samsung', 'path': '/tr/search.html?query=samsung&page={page}'},
    {'query': 'laptop', 'label': 'Laptop', 'path': '/tr/search.html?query=laptop&page={page}'},
    {'query': 'kulaklik', 'label': 'Kulaklık', 'path': '/tr/search.html?query=kulaklik&page={page}'},
    {'query': 'tv', 'label': 'TV', 'path': '/tr/search.html?query=televizyon&page={page}'},
]


def extract_product_id_from_url(url: str) -> str | None:
    match = re.search(r'-(\d+)\.html', url)
    return match.group(1) if match else None


async def fetch_listing_page(client: AsyncSession, listing_query: str, page: int = 1) -> list[dict]:
    source = next((s for s in LISTING_SOURCES if s['query'] == listing_query), LISTING_SOURCES[0])
    url = BASE + source['path'].format(page=page)
    try:
        resp = await client.get(url, timeout=25)
        if resp.status_code != 200:
            return []
    except Exception as e:
        print(f'[mediamarkt] Listing error: {e}')
        return []

    t = resp.text
    urls = list(dict.fromkeys(re.findall(r'(/tr/product/[^"\']+\.html)', t)))
    products: list[dict] = []
    seen: set[str] = set()

    for rel_url in urls:
        pid_m = re.search(r'-(\d+)\.html', rel_url)
        if not pid_m:
            continue
        pid = pid_m.group(1)
        if pid in seen:
            continue
        seen.add(pid)

        idx = t.find(rel_url)
        ctx = t[idx : idx + 2500] if idx >= 0 else ''
        name = re.search(r'"name"\s*:\s*"([^"]+)"', ctx)
        price = re.search(r'"price"\s*:\s*([0-9.]+)', ctx)
        if not name or not price:
            continue

        products.append(normalize_product({
            'external_product_id': pid,
            'title': name.group(1),
            'brand': name.group(1).split()[0] if name.group(1) else None,
            'product_url': f'{BASE}{rel_url}',
            'current_price': float(price.group(1)),
            'original_price': None,
            'category_hint': 'elektronik',
        }, STORE))

    return products


async def fetch_product_detail(client: AsyncSession, product_id: str, product_url: str | None = None) -> dict | None:
    page_url = product_url
    if not page_url:
        return None

    try:
        resp = await client.get(page_url, timeout=25)
        if resp.status_code != 200:
            return None
        t = resp.text
        name = re.search(r'"name"\s*:\s*"([^"]{5,200})"', t)
        price = re.search(r'"price"\s*:\s*([0-9.]+)', t)
        orig = re.search(r'"strikePrice"\s*:\s*([0-9.]+)', t)
        if name and price:
            return normalize_product({
                'external_product_id': product_id,
                'title': name.group(1),
                'brand': name.group(1).split()[0],
                'product_url': page_url.split('?')[0],
                'current_price': float(price.group(1)),
                'original_price': float(orig.group(1)) if orig else None,
            }, STORE)
    except Exception as e:
        print(f'[mediamarkt] Product {product_id} error: {e}')
    return None
