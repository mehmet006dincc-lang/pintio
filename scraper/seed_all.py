#!/usr/bin/env python3
"""Seed products from all supported stores."""

import asyncio
import psycopg2
import httpx
from curl_cffi.requests import AsyncSession

from config import DATABASE_URL, SEED_PER_STORE, CATEGORY_MAP
from clients.registry import ALL_LISTING_SOURCES, CURL_CFFI_STORES, fetch_listing_page
from clients.trendyol import ensure_session


def map_category(hint: str) -> int | None:
    hint = (hint or '').lower()
    for key, cat_id in CATEGORY_MAP.items():
        if key in hint:
            return cat_id
    return None


def upsert_product(cur, p: dict, cat_id: int | None) -> str | None:
    cur.execute(
        '''
        INSERT INTO products (
            store, external_product_id, title, brand, category_id,
            image_url, product_url, current_price, original_price,
            monitoring_tier, source, is_flash, next_check_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'P1', 'flash_deals', true, NOW())
        ON CONFLICT (store, external_product_id) DO UPDATE SET
            title = EXCLUDED.title,
            current_price = EXCLUDED.current_price,
            original_price = EXCLUDED.original_price,
            product_url = EXCLUDED.product_url,
            image_url = COALESCE(EXCLUDED.image_url, products.image_url),
            is_active = true,
            updated_at = NOW()
        RETURNING id
        ''',
        (
            p['store'], p['external_product_id'], p['title'], p.get('brand'), cat_id,
            p.get('image_url'), p['product_url'],
            p.get('current_price'), p.get('original_price'),
        ),
    )
    row = cur.fetchone()
    return str(row[0]) if row else None


async def seed_store(conn, cur, store: str, sources: list[dict], http_client, curl_client, limit: int) -> int:
    collected = 0
    seen: set[str] = set()
    client = curl_client if store in CURL_CFFI_STORES else http_client

    if store == 'trendyol':
        await ensure_session(http_client)

    for source in sources:
        if collected >= limit:
            break

        label = source['label']
        query = source['query']
        page = 1
        stale_pages = 0

        print(f'[{store}] Kaynak: {label}')

        while collected < limit and stale_pages < 3:
            products = await fetch_listing_page(store, client, query, page)
            if not products:
                print(f'  [{store}] Sayfa {page}: ürün yok')
                break

            new_on_page = 0
            for p in products:
                pid = p.get('external_product_id')
                if not pid or pid in seen:
                    continue
                seen.add(pid)
                new_on_page += 1

                cat_id = map_category(p.get('category_hint', ''))
                product_id = upsert_product(cur, p, cat_id)
                if product_id and p.get('current_price'):
                    cur.execute(
                        'INSERT INTO price_history (product_id, price, in_stock) VALUES (%s, %s, true)',
                        (product_id, p['current_price']),
                    )

                collected += 1
                if collected % 50 == 0:
                    conn.commit()
                    print(f'  [{store}] {collected}/{limit}')

                if collected >= limit:
                    break

            conn.commit()

            if new_on_page == 0:
                stale_pages += 1
            else:
                stale_pages = 0

            print(f'  [{store}] Sayfa {page}: +{new_on_page} (toplam {collected})')
            page += 1
            await asyncio.sleep(0.5)

    return collected


async def seed():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    cur = conn.cursor()

    by_store: dict[str, list[dict]] = {}
    for src in ALL_LISTING_SOURCES:
        by_store.setdefault(src['store'], []).append(src)

    total = 0
    async with httpx.AsyncClient(follow_redirects=True) as http_client, AsyncSession(impersonate='chrome131') as curl_client:
        for store, sources in by_store.items():
            count = await seed_store(conn, cur, store, sources, http_client, curl_client, SEED_PER_STORE)
            total += count
            conn.commit()
            print(f'[{store}] Tamamlandı: {count} ürün\n')

    cur.close()
    conn.close()
    print(f'Tüm mağazalar tamamlandı! Toplam {total} ürün eklendi/güncellendi.')


if __name__ == '__main__':
    asyncio.run(seed())
