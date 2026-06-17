import json
import os
import urllib.request
import urllib.parse

import psycopg2

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
}


def _resp(status: int, body) -> dict:
    return {
        'statusCode': status,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'isBase64Encoded': False,
        'body': json.dumps(body),
    }


def _get_user_id(event: dict, conn):
    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
    if not token:
        return None
    cur = conn.cursor()
    cur.execute(
        "SELECT user_id FROM sessions WHERE token = %s AND expires_at > NOW()",
        (token,),
    )
    row = cur.fetchone()
    return row[0] if row else None


def _tg_call(bot_token: str, method: str, payload: dict) -> dict:
    url = f"https://api.telegram.org/bot{bot_token}/{method}"
    data = urllib.parse.urlencode(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        try:
            return json.loads(e.read().decode('utf-8'))
        except Exception:
            return {'ok': False, 'description': f'HTTP {e.code}'}
    except Exception as e:
        return {'ok': False, 'description': str(e)}


def _get_bot_token(user_id: int, conn) -> str:
    cur = conn.cursor()
    cur.execute("SELECT bot_token FROM user_settings WHERE user_id = %s", (user_id,))
    row = cur.fetchone()
    if row and row[0]:
        return row[0].strip()
    return ''


def _normalize_chat(link: str) -> str:
    link = (link or '').strip()
    if not link:
        return ''
    if link.startswith('https://t.me/'):
        link = link[len('https://t.me/'):]
    elif link.startswith('t.me/'):
        link = link[len('t.me/'):]
    if link.startswith('@'):
        return link
    if link.lstrip('-').isdigit():
        return link
    return '@' + link


SOLD_MARK = '✅ SOLD ✅'


def handler(event: dict, context) -> dict:
    '''Рассылка объявлений в Telegram-группы и пометка ПРОДАНО/возврат. У каждого пользователя свой токен бота (хранится в БД). Действия: send, mark_sold, restore, set_token, token_status. Доступ только по токену владельца.'''
    method = event.get('httpMethod', 'POST')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'isBase64Encoded': False, 'body': ''}
    if method != 'POST':
        return _resp(405, {'error': 'Метод не поддерживается'})

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    try:
        user_id = _get_user_id(event, conn)
        if not user_id:
            return _resp(401, {'error': 'Не авторизован'})

        body = json.loads(event.get('body') or '{}')
        action = body.get('action', 'send')

        if action == 'token_status':
            return _resp(200, {'connected': bool(_get_bot_token(user_id, conn))})
        if action == 'set_token':
            return _set_token(body, user_id, conn)

        bot_token = _get_bot_token(user_id, conn)
        if not bot_token:
            return _resp(400, {'error': 'Не подключён Telegram-бот. Добавьте токен в Настройках.'})

        if action == 'send':
            return _send(body, user_id, bot_token, conn)
        if action in ('mark_sold', 'restore'):
            return _toggle_sold(body, user_id, bot_token, conn, sold=(action == 'mark_sold'))
        return _resp(400, {'error': 'Неизвестное действие'})
    finally:
        conn.close()


def _set_token(body: dict, user_id: int, conn) -> dict:
    raw = (body.get('token') or '').strip()
    cur = conn.cursor()

    if not raw:
        cur.execute(
            """INSERT INTO user_settings (user_id, bot_token) VALUES (%s, '')
               ON CONFLICT (user_id) DO UPDATE SET bot_token = ''""",
            (user_id,),
        )
        return _resp(200, {'ok': True, 'connected': False})

    info = _tg_call(raw, 'getMe', {})
    if not info.get('ok'):
        return _resp(400, {'error': 'Неверный токен бота. Проверьте, что скопировали его из @BotFather полностью.'})

    cur.execute(
        """INSERT INTO user_settings (user_id, bot_token) VALUES (%s, %s)
           ON CONFLICT (user_id) DO UPDATE SET bot_token = EXCLUDED.bot_token""",
        (user_id, raw),
    )
    bot_username = info.get('result', {}).get('username', '')
    return _resp(200, {'ok': True, 'connected': True, 'botUsername': bot_username})


def _send(body: dict, user_id: int, bot_token: str, conn) -> dict:
    groups = body.get('groups') or []
    messages = body.get('messages') or []

    if not groups:
        return _resp(400, {'error': 'Нет групп для рассылки'})
    if not messages:
        return _resp(400, {'error': 'Нет объявлений для отправки'})

    cur = conn.cursor()
    results = []
    for g in groups:
        chat_id = _normalize_chat(g.get('link', ''))
        group_name = g.get('name', chat_id)
        if not chat_id:
            results.append({'group': group_name, 'ok': False, 'error': 'Пустая ссылка'})
            continue

        sent = 0
        last_error = ''
        for m in messages:
            text = m.get('text', '')
            car_id = m.get('carId')
            all_photos = [p for p in (m.get('photos') or []) if p and str(p).startswith('http')]
            caption = text[:1024]

            caption_msg_id = None  # сообщение с подписью (его редактируем при «ПРОДАНО»)
            is_photo = False

            if len(all_photos) >= 2:
                # Несколько фото — отправляем альбомом, подпись на первом фото
                media = []
                for idx, p in enumerate(all_photos[:10]):
                    item = {'type': 'photo', 'media': p}
                    if idx == 0:
                        item['caption'] = caption
                    media.append(item)
                res = _tg_call(bot_token, 'sendMediaGroup', {
                    'chat_id': chat_id, 'media': json.dumps(media),
                })
                if res.get('ok'):
                    is_photo = True
                    result_arr = res.get('result', [])
                    if result_arr:
                        caption_msg_id = result_arr[0].get('message_id')
            elif len(all_photos) == 1:
                res = _tg_call(bot_token, 'sendPhoto', {
                    'chat_id': chat_id, 'photo': all_photos[0], 'caption': caption,
                })
                if res.get('ok'):
                    is_photo = True
                    caption_msg_id = res.get('result', {}).get('message_id')
            else:
                res = _tg_call(bot_token, 'sendMessage', {'chat_id': chat_id, 'text': text})
                if res.get('ok'):
                    caption_msg_id = res.get('result', {}).get('message_id')

            if res.get('ok'):
                sent += 1
                if car_id and caption_msg_id:
                    cur.execute(
                        """INSERT INTO sent_messages (car_id, user_id, chat_id, message_id, is_photo, base_text)
                           VALUES (%s, %s, %s, %s, %s, %s)""",
                        (car_id, user_id, chat_id, caption_msg_id, is_photo, caption),
                    )
            else:
                last_error = res.get('description', 'Ошибка отправки')

        results.append({
            'group': group_name,
            'ok': sent > 0,
            'sent': sent,
            'total': len(messages),
            'error': last_error if sent == 0 else '',
        })

    any_ok = any(r['ok'] for r in results)
    return _resp(200 if any_ok else 502, {'results': results})


def _toggle_sold(body: dict, user_id: int, bot_token: str, conn, sold: bool) -> dict:
    car_id = body.get('carId')
    if not car_id:
        return _resp(400, {'error': 'Не указан id авто'})

    cur = conn.cursor()
    cur.execute(
        """SELECT id, chat_id, message_id, is_photo, base_text
           FROM sent_messages WHERE car_id = %s AND user_id = %s""",
        (car_id, user_id),
    )
    rows = cur.fetchall()
    updated = 0
    for _id, chat_id, message_id, is_photo, base_text in rows:
        new_text = f"{SOLD_MARK}\n\n{base_text}" if sold else base_text
        if is_photo:
            res = _tg_call(bot_token, 'editMessageCaption', {
                'chat_id': chat_id, 'message_id': message_id, 'caption': new_text[:1024],
            })
        else:
            res = _tg_call(bot_token, 'editMessageText', {
                'chat_id': chat_id, 'message_id': message_id, 'text': new_text,
            })
        if res.get('ok'):
            updated += 1

    return _resp(200, {'ok': True, 'updated': updated, 'total': len(rows)})