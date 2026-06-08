#!/usr/bin/env python3
"""Local E2E test: seed price history, simulate drop, verify in-app notification."""

import psycopg2
from datetime import datetime, timedelta, timezone

from config import DATABASE_URL
from deal_engine import evaluate_deal, should_notify
from worker import notify_all_users

TEST_EMAIL = 'test@test.com'
PRODUCT_EXTERNAL_ID = '100001'  # Nike demo product


def main():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    cur.execute('SELECT id FROM users WHERE email = %s', (TEST_EMAIL,))
    user = cur.fetchone()
    if not user:
        print(f'User {TEST_EMAIL} not found — register in app first.')
        return
    user_id = user[0]

    cur.execute(
        "SELECT id, title, current_price FROM products WHERE store = 'trendyol' AND external_product_id = %s",
        (PRODUCT_EXTERNAL_ID,),
    )
    product = cur.fetchone()
    if not product:
        print('Demo product not found.')
        return
    product_id, title, old_price = product

    cur.execute(
        'INSERT INTO favorites (user_id, product_id) VALUES (%s, %s) ON CONFLICT DO NOTHING',
        (user_id, product_id),
    )

    cur.execute('DELETE FROM price_history WHERE product_id = %s', (product_id,))
    cur.execute('DELETE FROM push_log WHERE product_id = %s', (product_id,))
    cur.execute('DELETE FROM notifications WHERE product_id = %s AND user_id = %s', (product_id, user_id))
    cur.execute('DELETE FROM deals WHERE product_id = %s', (product_id,))

    now = datetime.now(timezone.utc)
    base_price = 2200.0
    for day in range(20, 0, -1):
        recorded = now - timedelta(days=day)
        cur.execute(
            'INSERT INTO price_history (product_id, price, in_stock, recorded_at) VALUES (%s, %s, true, %s)',
            (product_id, base_price, recorded),
        )

    new_price = 1499.0
    cur.execute(
        '''
        UPDATE products SET current_price = %s, monitoring_tier = 'P0', next_check_at = NOW(), updated_at = NOW()
        WHERE id = %s
        ''',
        (new_price, product_id),
    )
    cur.execute(
        'INSERT INTO price_history (product_id, price, in_stock, recorded_at) VALUES (%s, %s, true, NOW())',
        (product_id, new_price),
    )
    conn.commit()

    cur.execute(
        'SELECT price, recorded_at FROM price_history WHERE product_id = %s ORDER BY recorded_at',
        (product_id,),
    )
    history = [(float(p), t.replace(tzinfo=timezone.utc) if t.tzinfo is None else t) for p, t in cur.fetchall()]
    deal = evaluate_deal(new_price, history, seller_original=2499.0)

    print(f'Product: {title}')
    print(f'Price: {base_price} -> {new_price} TL')
    print(f'Deal eligible: {deal.eligible}, discount: {deal.discount_pct}%, 6m low: {deal.is_6m_low}')
    print(f'Should notify: {should_notify(deal, new_price, None)}')

    if deal.eligible and should_notify(deal, new_price, None):
        detail = {'title': title, 'brand': 'Nike'}
        cur.execute(
            '''
            INSERT INTO deals (product_id, discount_pct, is_6m_low, avg_180d, min_180d, detected_at)
            VALUES (%s, %s, %s, %s, %s, NOW())
            ON CONFLICT (product_id) DO UPDATE SET
                discount_pct = EXCLUDED.discount_pct,
                is_6m_low = EXCLUDED.is_6m_low,
                detected_at = NOW()
            ''',
            (product_id, deal.discount_pct, deal.is_6m_low, deal.avg_180d, deal.min_180d),
        )
        conn.commit()
        notify_all_users(conn, str(product_id), detail, new_price, deal)

        cur.execute(
            'SELECT title, body, is_read FROM notifications WHERE user_id = %s ORDER BY created_at DESC LIMIT 1',
            (user_id,),
        )
        notif = cur.fetchone()
        print(f'Notification created: {notif[0]} — {notif[1]}')
    else:
        print('Deal criteria not met — notification skipped.')

    cur.close()
    conn.close()
    print('Done. Check app: Bildirimler sekmesi + Ana sayfa featured deals.')


if __name__ == '__main__':
    main()
