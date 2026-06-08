"""Shared helpers for store clients."""

from __future__ import annotations

import re
from typing import Any

STORES = ('trendyol', 'hepsiburada', 'n11', 'mediamarkt', 'amazon', 'migros')

DESKTOP_UA = (
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
    'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
)

BROWSER_HEADERS = {
    'User-Agent': DESKTOP_UA,
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}


def normalize_product(raw: dict[str, Any], store: str) -> dict[str, Any]:
    """Unified product dict for DB insert / worker."""
    return {
        'store': store,
        'external_product_id': str(raw['external_product_id']),
        'title': raw.get('title') or '',
        'brand': raw.get('brand'),
        'image_url': raw.get('image_url'),
        'product_url': raw.get('product_url') or '',
        'current_price': raw.get('current_price'),
        'original_price': raw.get('original_price'),
        'category_hint': (raw.get('category_hint') or '').lower(),
        'in_stock': raw.get('in_stock', True),
    }


def parse_turkish_price(value: Any) -> float | None:
    """Parse 24.049 TL / 8199 / '8.199 TL' style prices to float TL."""
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip()
    text = re.sub(r'[^\d,.]', '', text)
    if not text:
        return None
    if ',' in text and '.' in text:
        text = text.replace('.', '').replace(',', '.')
    elif '.' in text:
        parts = text.split('.')
        if len(parts) == 2 and len(parts[1]) == 3:
            text = text.replace('.', '')
    text = text.replace(',', '.')
    try:
        return float(text)
    except ValueError:
        return None


def parse_migros_kurus(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return round(int(str(value).strip()) / 100, 2)
    except ValueError:
        return None


def parse_js_object(html: str, marker: str = 'window.model = ') -> dict | None:
    idx = html.find(marker)
    if idx == -1:
        return None
    start = idx + len(marker)
    if start >= len(html) or html[start] != '{':
        return None
    depth = 0
    for i in range(start, len(html)):
        char = html[i]
        if char == '{':
            depth += 1
        elif char == '}':
            depth -= 1
            if depth == 0:
                import json
                try:
                    return json.loads(html[start : i + 1])
                except json.JSONDecodeError:
                    return None
    return None
