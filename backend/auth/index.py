import json
import os
import hashlib
import secrets
from datetime import datetime, timedelta

import psycopg2

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
}

SESSION_DAYS = 30


def _resp(status: int, body: dict) -> dict:
    return {
        'statusCode': status,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'isBase64Encoded': False,
        'body': json.dumps(body),
    }


def _hash(password: str, salt: str) -> str:
    return hashlib.sha256((salt + password).encode('utf-8')).hexdigest()


def _make_password_hash(password: str) -> str:
    salt = secrets.token_hex(16)
    return f"{salt}${_hash(password, salt)}"


def _check_password(password: str, stored: str) -> bool:
    if '$' not in stored:
        return False
    salt, digest = stored.split('$', 1)
    return secrets.compare_digest(_hash(password, salt), digest)


def handler(event: dict, context) -> dict:
    '''Авторизация пользователей: регистрация, вход, проверка сессии и выход.'''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'isBase64Encoded': False, 'body': ''}

    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    conn.autocommit = True

    try:
        if method == 'GET':
            return _me(event, conn)

        body = json.loads(event.get('body') or '{}')
        action = body.get('action', '')

        if action == 'register':
            return _register(body, conn)
        if action == 'login':
            return _login(body, conn)
        if action == 'logout':
            return _logout(event, conn)

        return _resp(400, {'error': 'Неизвестное действие'})
    finally:
        conn.close()


def _register(body: dict, conn) -> dict:
    login = (body.get('login') or '').strip().lower()
    password = body.get('password') or ''

    if len(login) < 3:
        return _resp(400, {'error': 'Логин должен быть не короче 3 символов'})
    if len(password) < 6:
        return _resp(400, {'error': 'Пароль должен быть не короче 6 символов'})

    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE login = %s", (login,))
    if cur.fetchone():
        return _resp(409, {'error': 'Такой логин уже занят'})

    cur.execute("SELECT COUNT(*) FROM users")
    is_admin = cur.fetchone()[0] == 0

    cur.execute(
        "INSERT INTO users (login, password_hash, is_admin) VALUES (%s, %s, %s) RETURNING id",
        (login, _make_password_hash(password), is_admin),
    )
    user_id = cur.fetchone()[0]
    token = _create_session(user_id, conn)
    return _resp(200, {'token': token, 'login': login, 'isAdmin': is_admin})


def _login(body: dict, conn) -> dict:
    login = (body.get('login') or '').strip().lower()
    password = body.get('password') or ''

    cur = conn.cursor()
    cur.execute("SELECT id, password_hash, is_admin, is_blocked FROM users WHERE login = %s", (login,))
    row = cur.fetchone()
    if not row or not _check_password(password, row[1]):
        return _resp(401, {'error': 'Неверный логин или пароль'})
    if row[3]:
        return _resp(403, {'error': 'Аккаунт заблокирован администратором'})

    token = _create_session(row[0], conn)
    return _resp(200, {'token': token, 'login': login, 'isAdmin': bool(row[2])})


def _logout(event: dict, conn) -> dict:
    token = (event.get('headers') or {}).get('X-Auth-Token') or (event.get('headers') or {}).get('x-auth-token')
    if token:
        cur = conn.cursor()
        cur.execute("UPDATE sessions SET expires_at = NOW() WHERE token = %s", (token,))
    return _resp(200, {'ok': True})


def _me(event: dict, conn) -> dict:
    token = (event.get('headers') or {}).get('X-Auth-Token') or (event.get('headers') or {}).get('x-auth-token')
    if not token:
        return _resp(401, {'error': 'Не авторизован'})

    cur = conn.cursor()
    cur.execute(
        """SELECT u.login, u.is_admin FROM sessions s
           JOIN users u ON u.id = s.user_id
           WHERE s.token = %s AND s.expires_at > NOW()""",
        (token,),
    )
    row = cur.fetchone()
    if not row:
        return _resp(401, {'error': 'Сессия истекла'})
    return _resp(200, {'login': row[0], 'isAdmin': bool(row[1])})


def _create_session(user_id: int, conn) -> str:
    token = secrets.token_hex(32)
    expires = datetime.utcnow() + timedelta(days=SESSION_DAYS)
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
        (user_id, token, expires),
    )
    return token