import json
import os
import psycopg2
from typing import Dict, Any
from decimal import Decimal

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Trading operations - get price, submit purchase requests, create transactions
    Args: event with httpMethod, body, queryStringParameters
    Returns: HTTP response with trading data
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
    
    if method == 'GET':
        action = event.get('queryStringParameters', {}).get('action', 'price')
        
        if action == 'price':
            cur.execute("SELECT value FROM settings WHERE key = 'current_price'")
            price_row = cur.fetchone()
            
            cur.execute("SELECT value FROM settings WHERE key = 'commission'")
            commission_row = cur.fetchone()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'price': float(price_row[0]) if price_row else 42.50,
                    'commission': float(commission_row[0]) if commission_row else 0
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'balance':
            user_id = event.get('queryStringParameters', {}).get('userId')
            if not user_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'userId required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "SELECT crypto_balance FROM user_balances WHERE user_id = %s",
                (user_id,)
            )
            balance_row = cur.fetchone()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'cryptoBalance': float(balance_row[0]) if balance_row else 0.0
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'transactions':
            cur.execute("""
                SELECT t.id, t.type, t.amount, t.price, t.commission, t.created_at, u.username
                FROM transactions t
                JOIN users u ON t.user_id = u.id
                ORDER BY t.created_at DESC
                LIMIT 50
            """)
            
            transactions = []
            for row in cur.fetchall():
                transactions.append({
                    'id': row[0],
                    'type': row[1],
                    'amount': float(row[2]),
                    'price': float(row[3]),
                    'commission': float(row[4]),
                    'timestamp': row[5].isoformat(),
                    'user': row[6]
                })
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'transactions': transactions}),
                'isBase64Encoded': False
            }
    
    elif method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action')
        
        if action == 'purchase_request':
            user_id = body_data.get('userId')
            amount = body_data.get('amount')
            signature = body_data.get('signature', '').strip()
            
            if not user_id or not amount or not signature:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'userId, amount, and signature required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("SELECT value FROM settings WHERE key = 'current_price'")
            price = float(cur.fetchone()[0])
            
            cur.execute(
                """INSERT INTO purchase_requests (user_id, amount, price, signature, status)
                   VALUES (%s, %s, %s, %s, 'pending')
                   RETURNING id""",
                (user_id, amount, price, signature)
            )
            request_id = cur.fetchone()[0]
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'requestId': request_id, 'status': 'pending'}),
                'isBase64Encoded': False
            }
        
        elif action == 'sell':
            user_id = body_data.get('userId')
            amount = body_data.get('amount')
            
            if not user_id or not amount:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'userId and amount required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("SELECT crypto_balance FROM user_balances WHERE user_id = %s", (user_id,))
            balance_row = cur.fetchone()
            
            if not balance_row or float(balance_row[0]) < float(amount):
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Insufficient crypto balance'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("SELECT value FROM settings WHERE key = 'current_price'")
            price = float(cur.fetchone()[0])
            
            cur.execute("SELECT value FROM settings WHERE key = 'commission'")
            commission_percent = float(cur.fetchone()[0])
            commission = float(amount) * price * (commission_percent / 100.0)
            
            cur.execute(
                "UPDATE user_balances SET crypto_balance = crypto_balance - %s WHERE user_id = %s",
                (amount, user_id)
            )
            
            cur.execute(
                """INSERT INTO transactions (user_id, type, amount, price, commission)
                   VALUES (%s, 'sell', %s, %s, %s)""",
                (user_id, amount, price, commission)
            )
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'commission': commission}),
                'isBase64Encoded': False
            }
        
        elif action == 'add_clicks':
            user_id = body_data.get('userId')
            amount = body_data.get('amount')
            
            if not user_id or not amount:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'userId and amount required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "UPDATE user_balances SET crypto_balance = crypto_balance + %s WHERE user_id = %s",
                (amount, user_id)
            )
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
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