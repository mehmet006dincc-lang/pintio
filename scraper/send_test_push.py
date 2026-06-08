#!/usr/bin/env python3
"""Dev only: send test push + in-app notification to all users."""

import argparse
import sys

import httpx
import psycopg2

from config import DATABASE_URL


def send_expo_push(push_token: str, title: str, body: str, product_id: str | None) -> bool:
    try:
        resp = httpx.post(
            'https://exp.host/--/api/v2/push/send',
            json={
                'to': push_token,
                'title': title,
                'body': body,
                'sound': 'default',
                'priority': 'high',
                'data': {'productId': product_id} if product_id else {},
            },
            headers={
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            timeout=15.0,
        )
        data = resp.json()
        ok = resp.status_code == 200 and data.get('data', [{}])[0].get('status') == 'ok'
        if not ok:
            print(f'  Push yanıt: {data}')
        return ok
    except Exception as e:
        print(f'  Push hata: {e}')
        return False


def main():
    parser = argparse.ArgumentParser(description='Test push bildirimi gönder')
    parser.add_argument('--token', help='Doğrudan Expo push token (ExponentPushToken[...])')
    parser.add_argument('--email', default='test@test.com', help='Hedef kullanıcı e-postası')
    args = parser.parse_args()

    title = '🧪 Test: Nike Air Max indirimde!'
    body = "Fiyat 1.499 TL'ye düştü! (%31 indirim) — Son 6 ayın en düşük fiyatı!"

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    cur.execute(
        "SELECT id FROM products WHERE external_product_id = '100001' OR title ILIKE '%Nike%' LIMIT 1",
    )
    row = cur.fetchone()
    product_id = str(row[0]) if row else None

    push_sent = 0
    in_app = 0

    if args.token:
        if send_expo_push(args.token, title, body, product_id):
            push_sent += 1
            print(f'Push gönderildi → {args.token[:30]}…')
        else:
            print('Push gönderilemedi')
            sys.exit(1)
    else:
        cur.execute('SELECT id, email, push_token FROM users WHERE email = %s', (args.email,))
        user = cur.fetchone()
        if not user:
            print(f'Kullanıcı bulunamadı: {args.email}')
            sys.exit(1)

        user_id, email, push_token = user

        cur.execute(
            '''
            INSERT INTO notifications (user_id, product_id, type, title, body)
            VALUES (%s, %s, 'price_drop', %s, %s)
            ''',
            (user_id, product_id, title.replace('🧪 Test: ', ''), body),
        )
        in_app += 1

        if push_token:
            if send_expo_push(push_token, title, body, product_id):
                push_sent += 1
                print(f'Push gönderildi → {email}')
            else:
                print(f'Push başarısız → {email}')
        else:
            print(f'Push token yok ({email}) — önce telefonda uygulamayı aç, bildirim izni ver')
            print('Uygulama içi bildirim oluşturuldu → Bildirimler sekmesine bak')

    conn.commit()
    cur.close()
    conn.close()

    print(f'Tamam: {in_app} uygulama içi, {push_sent} push')


if __name__ == '__main__':
    main()
