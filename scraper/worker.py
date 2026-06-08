#!/usr/bin/env python3
"""Price monitoring worker — checks products across all stores."""

import asyncio
import os
import uuid
from datetime import datetime, timedelta, timezone

import httpx
import psycopg2
import redis
from curl_cffi.requests import AsyncSession

from config import DATABASE_URL, REDIS_URL, P0_INTERVAL, P1_INTERVAL, WORKERS
from clients.registry import fetch_product_detail, CURL_CFFI_STORES
from deal_engine import evaluate_deal, should_notify

r = redis.from_url(REDIS_URL)


def get_interval(tier: str) -> int:
    return P0_INTERVAL if tier == 'P0' else P1_INTERVAL


def get_due_products(conn, limit=200):
    cur = conn.cursor()
    cur.execute(
        '''
        SELECT id, store, external_product_id, current_price, original_price, monitoring_tier, product_url
        FROM products
        WHERE is_active = true AND next_check_at <= NOW()
        ORDER BY
            CASE monitoring_tier WHEN 'P0' THEN 0 WHEN 'P1' THEN 1 ELSE 2 END,
            next_check_at
        LIMIT %s
        ''',
        (limit,),
    )
    rows = cur.fetchall()
    cur.close()
    return rows


def get_price_history(conn, product_id: str) -> list[tuple[float, datetime]]:
    cur = conn.cursor()
    cur.execute(
        'SELECT price, recorded_at FROM price_history WHERE product_id = %s ORDER BY recorded_at',
        (product_id,),
    )
    rows = [(float(p), t.replace(tzinfo=timezone.utc) if t.tzinfo is None else t) for p, t in cur.fetchall()]
    cur.close()
    return rows


def process_price_change(conn, product_id: str, detail: dict, tier: str):
    cur = conn.cursor()
    new_price = detail.get('current_price')
    if new_price is None:
        cur.close()
        return

    cache_key = f'price:{product_id}'
    cached = r.get(cache_key)
    if cached and float(cached) == new_price:
        interval = get_interval(tier)
        cur.execute(
            'UPDATE products SET last_checked_at = NOW(), next_check_at = NOW() + interval \'1 second\' * %s WHERE id = %s',
            (interval, product_id),
        )
        conn.commit()
        cur.close()
        return

    cur.execute(
        '''
        UPDATE products SET
            title = COALESCE(%s, title),
            brand = COALESCE(%s, brand),
            image_url = COALESCE(%s, image_url),
            current_price = %s,
            original_price = COALESCE(%s, original_price),
            last_checked_at = NOW(),
            next_check_at = NOW() + interval '1 second' * %s,
            updated_at = NOW()
        WHERE id = %s
        ''',
        (
            detail.get('title'), detail.get('brand'), detail.get('image_url'),
            new_price, detail.get('original_price'), get_interval(tier), product_id,
        ),
    )
    cur.execute(
        'INSERT INTO price_history (product_id, price, in_stock) VALUES (%s, %s, %s)',
        (product_id, new_price, detail.get('in_stock', True)),
    )
    conn.commit()

    r.set(cache_key, str(new_price), ex=3600)

    history = get_price_history(conn, product_id)
    deal = evaluate_deal(new_price, history, detail.get('original_price'))

    if deal.eligible:
        cur.execute(
            '''
            INSERT INTO deals (product_id, discount_pct, is_6m_low, avg_180d, min_180d, detected_at)
            VALUES (%s, %s, %s, %s, %s, NOW())
            ON CONFLICT (product_id) DO UPDATE SET
                discount_pct = EXCLUDED.discount_pct,
                is_6m_low = EXCLUDED.is_6m_low,
                avg_180d = EXCLUDED.avg_180d,
                min_180d = EXCLUDED.min_180d,
                detected_at = NOW()
            ''',
            (product_id, deal.discount_pct, deal.is_6m_low, deal.avg_180d, deal.min_180d),
        )
        conn.commit()
        notify_all_users(conn, product_id, detail, new_price, deal)
    else:
        cur.execute('DELETE FROM deals WHERE product_id = %s', (product_id,))
        conn.commit()

    cur.close()


def _wants_deal_notifications(settings) -> bool:
    if not settings:
        return True
    if isinstance(settings, str):
        try:
            import json
            settings = json.loads(settings)
        except Exception:
            return True
    return settings.get('deals', True) is not False


def send_expo_push(push_token: str, title: str, body: str, product_id: str) -> None:
    if not push_token:
        return
    try:
        resp = httpx.post(
            'https://exp.host/--/api/v2/push/send',
            json={
                'to': push_token,
                'title': title,
                'body': body,
                'sound': 'default',
                'priority': 'high',
                'data': {'productId': product_id},
            },
            headers={
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            timeout=10.0,
        )
        if resp.status_code != 200:
            print(f'Expo push failed ({resp.status_code}): {resp.text[:120]}')
    except Exception as e:
        print(f'Expo push error: {e}')


def notify_all_users(conn, product_id: str, detail: dict, price: float, deal):
    cur = conn.cursor()
    cur.execute('SELECT id, push_token, notification_settings FROM users')
    users = cur.fetchall()

    title = detail.get('title', 'Ürün')[:80]
    body = f'Fiyat {price:.0f} TL\'ye düştü! (%{deal.discount_pct} indirim)'
    if deal.is_6m_low:
        body += ' — Son 6 ayın en düşük fiyatı!'

    notified = 0
    for user_id, push_token, settings in users:
        if not _wants_deal_notifications(settings):
            continue

        cur.execute(
            '''
            SELECT price_at_push FROM push_log
            WHERE user_id = %s AND product_id = %s
            ORDER BY created_at DESC LIMIT 1
            ''',
            (user_id, product_id),
        )
        last = cur.fetchone()
        last_price = float(last[0]) if last else None

        if not should_notify(deal, price, last_price):
            continue

        cur.execute(
            '''
            INSERT INTO notifications (user_id, product_id, type, title, body)
            VALUES (%s, %s, 'price_drop', %s, %s)
            ''',
            (user_id, product_id, title, body),
        )
        cur.execute(
            'INSERT INTO push_log (user_id, product_id, price_at_push) VALUES (%s, %s, %s)',
            (user_id, product_id, price),
        )

        if push_token:
            send_expo_push(push_token, title, body, product_id)

        notified += 1

    if notified:
        cur.execute(
            'UPDATE deals SET notified_at = NOW() WHERE product_id = %s',
            (product_id,),
        )
        print(f'Notified {notified} users for product {product_id[:8]}…')

    conn.commit()
    cur.close()


async def check_product(http_client: httpx.AsyncClient, curl_client: AsyncSession, conn, row):
    product_id, store, external_id, _, _, tier, product_url = row
    store = store or 'trendyol'
    client = curl_client if store in CURL_CFFI_STORES else http_client

    detail = await fetch_product_detail(store, client, str(external_id), product_url)
    if detail:
        process_price_change(conn, str(product_id), detail, tier)
    else:
        cur = conn.cursor()
        interval = get_interval(tier)
        cur.execute(
            'UPDATE products SET last_checked_at = NOW(), next_check_at = NOW() + interval \'1 second\' * %s WHERE id = %s',
            (interval, product_id),
        )
        conn.commit()
        cur.close()


async def worker_loop(worker_id: int):
    conn = psycopg2.connect(DATABASE_URL)
    async with httpx.AsyncClient() as http_client, AsyncSession(impersonate='chrome131') as curl_client:
        while True:
            products = get_due_products(conn, limit=50)
            if not products:
                await asyncio.sleep(2)
                continue

            tasks = [check_product(http_client, curl_client, conn, row) for row in products]
            await asyncio.gather(*tasks, return_exceptions=True)
            await asyncio.sleep(0.1)

    conn.close()


async def main():
    print(f'Starting {WORKERS} multi-store workers...')
    await asyncio.gather(*[worker_loop(i) for i in range(WORKERS)])


if __name__ == '__main__':
    asyncio.run(main())
