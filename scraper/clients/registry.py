"""Store client registry — dispatches fetch by marketplace."""

from __future__ import annotations

from typing import Any, Protocol

import httpx
from curl_cffi.requests import AsyncSession

from clients import trendyol, hepsiburada, n11, mediamarkt, amazon_tr, migros

STORE_CLIENTS: dict[str, Any] = {
    'trendyol': trendyol,
    'hepsiburada': hepsiburada,
    'n11': n11,
    'mediamarkt': mediamarkt,
    'amazon': amazon_tr,
    'migros': migros,
}

# Stores that need curl_cffi (anti-bot)
CURL_CFFI_STORES = frozenset({'hepsiburada', 'n11', 'mediamarkt', 'amazon', 'migros'})

ALL_LISTING_SOURCES: list[dict] = []
for store, mod in STORE_CLIENTS.items():
    for src in getattr(mod, 'LISTING_SOURCES', []):
        ALL_LISTING_SOURCES.append({**src, 'store': store})


def get_client(store: str):
    client = STORE_CLIENTS.get(store)
    if not client:
        raise ValueError(f'Unknown store: {store}')
    return client


def parse_url(url: str) -> tuple[str, str] | None:
    """Return (store, external_product_id) from product URL."""
    for store, mod in STORE_CLIENTS.items():
        fn = getattr(mod, 'extract_product_id_from_url', None)
        if fn and fn(url):
            return store, fn(url)
    return None


async def fetch_product_detail(store: str, client: httpx.AsyncClient | AsyncSession, product_id: str, product_url: str | None):
    mod = get_client(store)
    return await mod.fetch_product_detail(client, product_id, product_url)


async def fetch_listing_page(store: str, client: httpx.AsyncClient | AsyncSession, listing_query: str, page: int = 1):
    mod = get_client(store)
    return await mod.fetch_listing_page(client, listing_query, page)
