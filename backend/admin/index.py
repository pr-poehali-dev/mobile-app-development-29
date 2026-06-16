import json
import os

import psycopg2
from psycopg2.extras import RealDictCursor

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
}


def _resp(status: int, body) -> dict:
    return {
        'statusCode': status,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'isBase64Encoded': False,
        'body': json.dumps(body, default=str),
    }


def _get_admin(event: dict, conn):
    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
    if not token:
        return None
    cur = conn.cursor()
    cur.execute(
        """SELECT u.id, u.is_admin FROM sessions s
           JOIN users u ON u.id = s.user_id
           WHERE s.token = %s AND s.expires_at > NOW()""",
        (token,),
    )
    row = cur.fetchone()
    if not row or not row[1]:
        return None
    return row[0]


def handler(event: dict, context) -> dict:
    '''Админ-панель: список всех пользователей с количеством объявлений и сами объявления. Доступ только для администратора.'''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'isBase64Encoded': False, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    try:
        admin_id = _get_admin(event, conn)
        if not admin_id:
            return _resp(403, {'error': 'Доступ только для администратора'})

        if method == 'POST':
            return _action(event, admin_id, conn)

        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """SELECT u.id, u.login, u.is_admin, u.is_blocked, u.created_at,
                      COUNT(c.id) AS cars_count,
                      COUNT(c.id) FILTER (WHERE c.status = 'selling') AS selling_count,
                      COUNT(c.id) FILTER (WHERE c.status = 'sold') AS sold_count
               FROM users u
               LEFT JOIN cars c ON c.user_id = u.id
               GROUP BY u.id
               ORDER BY u.id"""
        )
        users = cur.fetchall()

        cur.execute(
            """SELECT id, user_id, make, model, price, year, status, photos
               FROM cars ORDER BY created_at DESC, id DESC"""
        )
        cars = cur.fetchall()

        return _resp(200, {'users': users, 'cars': cars})
    finally:
        conn.close()


def _action(event: dict, admin_id: int, conn) -> dict:
    b = json.loads(event.get('body') or '{}')
    action = b.get('action', '')
    cur = conn.cursor()

    if action == 'delete_car':
        car_id = b.get('carId')
        if not car_id:
            return _resp(400, {'error': 'Не указан id объявления'})
        cur.execute("DELETE FROM cars WHERE id = %s", (car_id,))
        return _resp(200, {'ok': True})

    if action in ('block_user', 'unblock_user'):
        user_id = b.get('userId')
        if not user_id:
            return _resp(400, {'error': 'Не указан пользователь'})
        if int(user_id) == admin_id:
            return _resp(400, {'error': 'Нельзя заблокировать самого себя'})
        cur.execute("SELECT is_admin FROM users WHERE id = %s", (user_id,))
        row = cur.fetchone()
        if row and row[0]:
            return _resp(400, {'error': 'Нельзя заблокировать администратора'})
        blocked = action == 'block_user'
        cur.execute("UPDATE users SET is_blocked = %s WHERE id = %s", (blocked, user_id))
        if blocked:
            cur.execute("UPDATE sessions SET expires_at = NOW() WHERE user_id = %s", (user_id,))
        return _resp(200, {'ok': True})

    return _resp(400, {'error': 'Неизвестное действие'})