import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: User authentication and registration
    Args: event with httpMethod, body
    Returns: HTTP response with user data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database not configured'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        username = body_data.get('username', '').strip()
        
        if not username or len(username) < 2:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Username must be at least 2 characters'}),
                'isBase64Encoded': False
            }
        
        cur.execute("SELECT id, username FROM users WHERE username = %s", (username,))
        existing = cur.fetchone()
        
        if existing:
            user_id, user_name = existing
            cur.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'id': user_id, 'username': user_name}),
                'isBase64Encoded': False
            }
        
        cur.execute(
            "INSERT INTO users (username) VALUES (%s) RETURNING id, username",
            (username,)
        )
        user_id, user_name = cur.fetchone()
        
        cur.execute(
            "INSERT INTO user_balances (user_id, crypto_balance) VALUES (%s, 0)",
            (user_id,)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'id': user_id, 'username': user_name}),
            'isBase64Encoded': False
        }
    
    cur.close()
    conn.close()
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }
