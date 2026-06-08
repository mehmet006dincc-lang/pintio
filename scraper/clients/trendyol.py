"""Trendyol store client — HTML scraping with API fallback."""

from __future__ import annotations

import json
import re
from typing import Any

import httpx

from config import FLASH_LISTING_SOURCES, TRENDYOL_DESKTOP_UA
from clients.base import BROWSER_HEADERS as _BASE_HEADERS, normalize_product, parse_turkish_price

STORE = 'trendyol'

BROWSER_HEADERS = {
    **_BASE_HEADERS,
    'User-Agent': TRENDYOL_DESKTOP_UA,
}

API_HEADERS = {
    **BROWSER_HEADERS,
    'Accept': 'application/json',
    'Origin': 'https://www.trendyol.com',
    'Referer': 'https://www.trendyol.com/',
}


async def ensure_session(client: httpx.AsyncClient) -> None:
    if client.cookies.get('storefrontId'):
        return
    await client.get('https://www.trendyol.com/', headers=BROWSER_HEADERS, timeout=20.0)


def _extract_json_array(html: str, marker: str = '"products":[') -> list[dict]:
    idx = html.find(marker)
    if idx == -1:
        return []
    start = idx + len(marker) - 1
    depth = 0
    for i in range(start, len(html)):
        char = html[i]
        if char == '[':
            depth += 1
        elif char == ']':
            depth -= 1
            if depth == 0:
                try:
                    data = json.loads(html[start : i + 1])
                    return data if isinstance(data, list) else []
                except json.JSONDecodeError:
                    return []
    return []


def _extract_json_object(html: str, marker: str) -> dict | None:
    idx = html.find(marker)
    if idx == -1:
        return None
    start = idx + marker.index('{')
    depth = 0
    for i in range(start, min(start + 500_000, len(html))):
        char = html[i]
        if char == '{':
            depth += 1
        elif char == '}':
            depth -= 1
            if depth == 0:
                try:
                    data = json.loads(html[start : i + 1])
                    return data if isinstance(data, dict) else None
                except json.JSONDecodeError:
                    return None
    return None


def _price_value(raw: Any) -> float | None:
    if raw is None:
        return None
    if isinstance(raw, (int, float)):
        return float(raw)
    if isinstance(raw, dict):
        if 'value' in raw:
            return float(raw['value'])
        for key in ('discountedPrice', 'sellingPrice', 'originalPrice', 'current'):
            val = _price_value(raw.get(key))
            if val is not None:
                return val
    return None


def _parse_listing_product(raw: dict) -> dict | None:
    pid = str(raw.get('id') or raw.get('contentId') or '')
    if not pid:
        return None

    title = raw.get('name') or raw.get('title') or ''
    brand = raw.get('brand')
    if isinstance(brand, dict):
        brand = brand.get('name')

    price = raw.get('price') or {}
    current = _price_value(price)
    original = _price_value(price.get('originalPrice') if isinstance(price, dict) else None)
    if original is None:
        original = _price_value(raw.get('originalPrice'))

    url_path = raw.get('url') or ''
    product_url = (
        f'https://www.trendyol.com{url_path}'
        if url_path.startswith('/')
        else (url_path or f'https://www.trendyol.com/-p-{pid}')
    )

    category = raw.get('category')
    category_hint = ''
    if isinstance(category, dict):
        category_hint = (category.get('name') or category.get('categoryName') or '').lower()
    elif isinstance(category, str):
        category_hint = category.lower()

    image = raw.get('image')
    if isinstance(image, dict):
        image = image.get('url') or image.get('imageUrl')
    if not image:
        images = raw.get('images') or []
        if images:
            first = images[0]
            image = first.get('url') if isinstance(first, dict) else str(first)

    return normalize_product({
        'external_product_id': pid,
        'title': title,
        'brand': brand,
        'image_url': image,
        'product_url': product_url.split('?')[0],
        'current_price': current,
        'original_price': original,
        'category_hint': category_hint,
    }, STORE)


def _parse_detail(product: dict, product_id: str) -> dict:
    merchant = product.get('merchantListing') or {}
    variant = merchant.get('winnerVariant') or {}
    price_info = variant.get('price') or product.get('price') or {}

    current = _price_value(price_info.get('discountedPrice') if isinstance(price_info, dict) else price_info)
    original = _price_value(price_info.get('originalPrice') if isinstance(price_info, dict) else None)

    brand = product.get('brand')
    if isinstance(brand, dict):
        brand = brand.get('name')

    url_path = product.get('url') or ''
    in_stock = variant.get('inStock', product.get('inStock', True))
    if variant.get('sellable') is False:
        in_stock = False

    return normalize_product({
        'external_product_id': product_id,
        'title': product.get('name') or product.get('title', ''),
        'brand': brand,
        'image_url': _extract_image(product),
        'product_url': (
            f'https://www.trendyol.com{url_path}'
            if url_path.startswith('/')
            else f'https://www.trendyol.com/-p-{product_id}'
        ),
        'current_price': current,
        'original_price': original,
        'in_stock': bool(in_stock),
        'category_hint': (product.get('category', {}).get('name', '') or '').lower()
        if isinstance(product.get('category'), dict)
        else '',
    }, STORE)


def _extract_image(raw: dict) -> str | None:
    images = raw.get('images') or raw.get('imageUrls') or []
    if images:
        img = images[0]
        if isinstance(img, dict):
            return img.get('url') or img.get('imageUrl')
        return str(img)
    image = raw.get('image')
    if isinstance(image, dict):
        return image.get('url') or image.get('imageUrl')
    return image or raw.get('imageUrl')


def extract_product_id_from_url(url: str) -> str | None:
    match = re.search(r'-p-(\d+)', url)
    return match.group(1) if match else None


async def fetch_listing_page(
    client: httpx.AsyncClient,
    listing_query: str,
    page: int = 1,
) -> list[dict]:
    await ensure_session(client)
    url = f'https://www.trendyol.com/sr?{listing_query}&pi={page}'
    try:
        resp = await client.get(url, headers=BROWSER_HEADERS, timeout=25.0)
        resp.raise_for_status()
    except Exception as e:
        print(f'[trendyol] Listing error ({listing_query} p{page}): {e}')
        return []

    products = [_parse_listing_product(p) for p in _extract_json_array(resp.text)]
    return [p for p in products if p and p.get('external_product_id')]


async def fetch_product_detail(
    client: httpx.AsyncClient,
    product_id: str,
    product_url: str | None = None,
) -> dict | None:
    await ensure_session(client)

    api_url = f'https://apigw.trendyol.com/discovery-web-productgw-service/api/productDetail/{product_id}'
    try:
        resp = await client.get(
            api_url,
            params={'culture': 'tr-TR', 'channelId': 1},
            headers=API_HEADERS,
            timeout=12.0,
        )
        if resp.status_code == 200:
            data = resp.json()
            result = data.get('result', data)
            if result:
                parsed = _parse_detail(result, product_id)
                if parsed.get('current_price') is not None:
                    return parsed
    except Exception:
        pass

    page_url = product_url or f'https://www.trendyol.com/-p-{product_id}'
    try:
        resp = await client.get(page_url, headers=BROWSER_HEADERS, timeout=20.0)
        if resp.status_code != 200:
            return None
        product = _extract_json_object(resp.text, '"product":{')
        if not product:
            return None
        parsed = _parse_detail(product, product_id)
        return parsed if parsed.get('current_price') is not None else None
    except Exception as e:
        print(f'[trendyol] Product {product_id} error: {e}')
        return None


LISTING_SOURCES = FLASH_LISTING_SOURCES
