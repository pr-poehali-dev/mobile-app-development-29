import json
import os

import psycopg2
from psycopg2.extras import RealDictCursor

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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


def handler(event: dict, context) -> dict:
    '''Хранение объявлений о продаже авто в базе. Список, создание, изменение, удаление. Доступ только по токену владельца.'''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'isBase64Encoded': False, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    try:
        user_id = _get_user_id(event, conn)
        if not user_id:
            return _resp(401, {'error': 'Не авторизован'})

        if method == 'GET':
            return _list(user_id, conn)
        if method == 'POST':
            return _create(event, user_id, conn)
        if method == 'PUT':
            return _update(event, user_id, conn)
        if method == 'DELETE':
            return _delete(event, user_id, conn)
        return _resp(405, {'error': 'Метод не поддерживается'})
    finally:
        conn.close()


def _list(user_id: int, conn) -> dict:
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(
        """SELECT id, make, model, price, year, mileage, engine, description, photos, status, vin, buyer
           FROM cars WHERE user_id = %s ORDER BY created_at DESC, id DESC""",
        (user_id,),
    )
    return _resp(200, {'cars': cur.fetchall()})


def _create(event: dict, user_id: int, conn) -> dict:
    b = json.loads(event.get('body') or '{}')
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO cars (user_id, make, model, price, year, mileage, engine, description, photos, status, vin)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
        (
            user_id,
            b.get('make', ''), b.get('model', ''), b.get('price', ''),
            b.get('year', ''), b.get('mileage', ''), b.get('engine', ''),
            b.get('description', ''), json.dumps(b.get('photos', [])),
            b.get('status', 'selling'), b.get('vin', ''),
        ),
    )
    return _resp(200, {'id': cur.fetchone()[0]})


def _update(event: dict, user_id: int, conn) -> dict:
    b = json.loads(event.get('body') or '{}')
    car_id = b.get('id')
    if not car_id:
        return _resp(400, {'error': 'Не указан id'})

    fields = []
    values = []
    for key in ('make', 'model', 'price', 'year', 'mileage', 'engine', 'description', 'status', 'vin', 'buyer'):
        if key in b:
            fields.append(f"{key} = %s")
            values.append(b[key])
    if 'photos' in b:
        fields.append("photos = %s")
        values.append(json.dumps(b['photos']))

    if not fields:
        return _resp(400, {'error': 'Нет данных для изменения'})

    values.extend([car_id, user_id])
    cur = conn.cursor()
    cur.execute(
        f"UPDATE cars SET {', '.join(fields)} WHERE id = %s AND user_id = %s",
        values,
    )
    return _resp(200, {'ok': True})


def _delete(event: dict, user_id: int, conn) -> dict:
    params = event.get('queryStringParameters') or {}
    car_id = params.get('id')
    if not car_id:
        body = json.loads(event.get('body') or '{}')
        car_id = body.get('id')
    if not car_id:
        return _resp(400, {'error': 'Не указан id'})
    cur = conn.cursor()
    cur.execute("DELETE FROM cars WHERE id = %s AND user_id = %s", (car_id, user_id))
    return _resp(200, {'ok': True})