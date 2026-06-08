"""Migros Sanal Market store client."""

from __future__ import annotations

import re
import xml.etree.ElementTree as ET
from urllib.parse import urlparse

from curl_cffi.requests import AsyncSession

from clients.base import normalize_product, parse_migros_kurus

STORE = 'migros'
BASE = 'https://www.migros.com.tr'

LISTING_SOURCES = [
    {'query': 'indirim', 'label': 'İndirimli Ürünler', 'path': '/rest/products/search?query=indirim&reid={page}'},
    {'query': 'telefon', 'label': 'Telefon', 'path': '/rest/products/search?query=telefon&reid={page}'},
    {'query': 'sut', 'label': 'Süt', 'path': '/rest/products/search?query=sut&reid={page}'},
    {'query': 'cay', 'label': 'Çay', 'path': '/rest/products/search?query=cay&reid={page}'},
    {'query': 'deterjan', 'label': 'Deterjan', 'path': '/rest/products/search?query=deterjan&reid={page}'},
]


def extract_product_id_from_url(url: str) -> str | None:
    match = re.search(r'-p-([a-f0-9]+)', url, re.I)
    return match.group(1) if match else None


def _parse_xml_item(item: ET.Element) -> dict | None:
    sku_el = item.find('sku')
    if sku_el is None or not sku_el.text:
        return None

    sku = sku_el.text.strip()
    name_el = item.find('name')
    pretty_el = item.find('prettyName')
    shown = item.find('shownPrice')
    regular = item.find('regularPrice')

    current = parse_migros_kurus(shown.text if shown is not None else None)
    original = parse_migros_kurus(regular.text if regular is not None else None)
    pretty = pretty_el.text if pretty_el is not None else f'urun-p-{sku}'
    product_url = f'{BASE}/{pretty}'

    return normalize_product({
        'external_product_id': sku,
        'title': name_el.text if name_el is not None else '',
        'brand': None,
        'product_url': product_url,
        'current_price': current,
        'original_price': original if original and original != current else None,
        'category_hint': 'ev',
    }, STORE)


async def _search_products(client: AsyncSession, query: str, reid: int = 0) -> list[dict]:
    url = f'{BASE}/rest/products/search?query={query}&reid={reid}'
    resp = await client.get(url, timeout=25)
    if resp.status_code != 200:
        return []
    root = ET.fromstring(resp.text)
    items = root.findall('.//storeProductInfos/storeProductInfos')
    products = [_parse_xml_item(item) for item in items]
    return [p for p in products if p and p.get('current_price') is not None]


async def fetch_listing_page(client: AsyncSession, listing_query: str, page: int = 1) -> list[dict]:
    source = next((s for s in LISTING_SOURCES if s['query'] == listing_query), LISTING_SOURCES[0])
    reid = max(0, page - 1)
    try:
        return await _search_products(client, source['query'], reid)
    except Exception as e:
        print(f'[migros] Listing error: {e}')
        return []


async def _find_by_pretty_name(client: AsyncSession, pretty_name: str) -> dict | None:
    slug_words = pretty_name.replace('-p-', ' ').replace('-', ' ').split()
    query = slug_words[0] if slug_words else pretty_name
    products = await _search_products(client, query)
    for p in products:
        if p['product_url'].endswith(pretty_name) or pretty_name in p['product_url']:
            return p
    hex_id = extract_product_id_from_url(pretty_name)
    if hex_id:
        for p in products:
            if p['product_url'].endswith(f'-p-{hex_id}'):
                return p
    return None


async def fetch_product_detail(client: AsyncSession, product_id: str, product_url: str | None = None) -> dict | None:
    try:
        if product_url:
            path = urlparse(product_url).path.strip('/')
            if path:
                found = await _find_by_pretty_name(client, path)
                if found:
                    return found

        products = await _search_products(client, product_id)
        for p in products:
            if p['external_product_id'] == product_id:
                return p

        if product_url:
            slug = urlparse(product_url).path.strip('/').split('/')[-1]
            hex_id = extract_product_id_from_url(slug)
            if hex_id:
                for q in slug.replace('-p-', ' ').split('-')[:3]:
                    if len(q) < 3:
                        continue
                    for p in await _search_products(client, q):
                        if p['product_url'].endswith(f'-p-{hex_id}'):
                            return p
    except Exception as e:
        print(f'[migros] Product {product_id} error: {e}')
    return None
