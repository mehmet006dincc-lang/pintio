"""Backward-compatible re-exports — use clients.trendyol instead."""

from config import FLASH_LISTING_SOURCES
from clients.trendyol import (  # noqa: F401
    STORE,
    ensure_session,
    extract_product_id_from_url,
    fetch_listing_page,
    fetch_product_detail,
)


async def fetch_flash_products(client, page: int = 1, source_index: int = 0):
    source_index = max(0, min(source_index, len(FLASH_LISTING_SOURCES) - 1))
    query = FLASH_LISTING_SOURCES[source_index]['query']
    return await fetch_listing_page(client, query, page)
