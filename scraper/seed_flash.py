#!/usr/bin/env python3
"""Seed Trendyol only (legacy) — prefer seed_all.py for all stores."""

import asyncio
import psycopg2
import httpx

from config import DATABASE_URL, FLASH_SEED_LIMIT, FLASH_LISTING_SOURCES, CATEGORY_MAP
from clients.trendyol import fetch_listing_page, ensure_session


def map_category(hint: str) -> int | None:
    hint = (hint or '').lower()
    for key, cat_id in CATEGORY_MAP.items():
        if key in hint:
            return cat_id
    return None


async def seed():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    cur = conn.cursor()

    collected = 0
    seen_ids: set[str] = set()

    async with httpx.AsyncClient(follow_redirects=True) as client:
        await ensure_session(client)

        for source in FLASH_LISTING_SOURCES:
            if collected >= FLASH_SEED_LIMIT:
                break

            label = source['label']
            query = source['query']
            page = 1
            stale_pages = 0

            print(f'Kaynak: {label} ({query})')

            while collected < FLASH_SEED_LIMIT and stale_pages < 3:
                products = await fetch_listing_page(client, query, page)
                if not products:
                    print(f'  Sayfa {page}: ürün yok, sonraki kaynağa geçiliyor')
                    break

                new_on_page = 0
                for p in products:
                    pid = p.get('external_product_id')
                    if not pid or pid in seen_ids:
                        continue
                    seen_ids.add(pid)
                    new_on_page += 1

                    cat_id = map_category(p.get('category_hint', ''))
                    cur.execute(
                        '''
                        INSERT INTO products (
                            store, external_product_id, title, brand, category_id,
                            image_url, product_url, current_price, original_price,
                            monitoring_tier, source, is_flash, next_check_at
                        ) VALUES ('trendyol', %s, %s, %s, %s, %s, %s, %s, %s, 'P1', 'flash_deals', true, NOW())
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
                            pid, p['title'], p.get('brand'), cat_id,
                            p.get('image_url'), p['product_url'],
                            p.get('current_price'), p.get('original_price'),
                        ),
                    )
                    row = cur.fetchone()
                    if row and p.get('current_price'):
                        cur.execute(
                            'INSERT INTO price_history (product_id, price, in_stock) VALUES (%s, %s, true)',
                            (str(row[0]), p['current_price']),
                        )

                    collected += 1
                    if collected % 100 == 0:
                        conn.commit()
                        print(f'  Seeded {collected}/{FLASH_SEED_LIMIT}')

                    if collected >= FLASH_SEED_LIMIT:
                        break

                conn.commit()

                if new_on_page == 0:
                    stale_pages += 1
                else:
                    stale_pages = 0

                print(f'  Sayfa {page}: +{new_on_page} yeni (toplam {collected})')
                page += 1
                await asyncio.sleep(0.4)

    conn.commit()
    cur.close()
    conn.close()
    print(f'Tamamlandı! {collected} ürün eklendi/güncellendi.')


if __name__ == '__main__':
    asyncio.run(seed())
