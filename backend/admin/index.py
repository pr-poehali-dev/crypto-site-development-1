import json
import os
import psycopg2
import random
from typing import Dict, Any

ADMIN_PASSWORD = 'EE%adminA%%'

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Admin operations - manage price, promotions, lotteries, approve purchases
    Args: event with httpMethod, body, headers
    Returns: HTTP response with admin data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    admin_password = headers.get('x-admin-password') or headers.get('X-Admin-Password')
    
    if admin_password != ADMIN_PASSWORD:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized'}),
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
        action = event.get('queryStringParameters', {}).get('action', 'users')
        
        if action == 'users':
            cur.execute("""
                SELECT u.id, u.username, COALESCE(ub.crypto_balance, 0)
                FROM users u
                LEFT JOIN user_balances ub ON u.id = ub.user_id
                ORDER BY u.created_at DESC
            """)
            
            users = []
            for row in cur.fetchall():
                users.append({
                    'id': row[0],
                    'name': row[1],
                    'cryptoBalance': float(row[2])
                })
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'users': users}),
                'isBase64Encoded': False
            }
        
        elif action == 'promotions':
            cur.execute("""
                SELECT id, title, description, discount, active
                FROM promotions
                ORDER BY created_at DESC
            """)
            
            promotions = []
            for row in cur.fetchall():
                promotions.append({
                    'id': row[0],
                    'title': row[1],
                    'description': row[2],
                    'discount': float(row[3]),
                    'active': row[4]
                })
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'promotions': promotions}),
                'isBase64Encoded': False
            }
        
        elif action == 'lotteries':
            cur.execute("""
                SELECT l.id, l.prize, l.winner_id, l.active, u.username as winner_name,
                       (SELECT COUNT(*) FROM lottery_participants WHERE lottery_id = l.id) as participant_count
                FROM lotteries l
                LEFT JOIN users u ON l.winner_id = u.id
                ORDER BY l.created_at DESC
            """)
            
            lotteries = []
            for row in cur.fetchall():
                lotteries.append({
                    'id': row[0],
                    'prize': float(row[1]),
                    'winnerId': row[2],
                    'active': row[3],
                    'winner': row[4],
                    'participantCount': row[5]
                })
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'lotteries': lotteries}),
                'isBase64Encoded': False
            }
        
        elif action == 'purchase_requests':
            cur.execute("""
                SELECT pr.id, pr.user_id, u.username, pr.amount, pr.price, pr.signature, pr.status, pr.created_at
                FROM purchase_requests pr
                JOIN users u ON pr.user_id = u.id
                WHERE pr.status = 'pending'
                ORDER BY pr.created_at DESC
            """)
            
            requests = []
            for row in cur.fetchall():
                requests.append({
                    'id': row[0],
                    'userId': row[1],
                    'username': row[2],
                    'amount': float(row[3]),
                    'price': float(row[4]),
                    'signature': row[5],
                    'status': row[6],
                    'createdAt': row[7].isoformat()
                })
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'requests': requests}),
                'isBase64Encoded': False
            }
    
    elif method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action')
        
        if action == 'set_price':
            new_price = body_data.get('price')
            if not new_price or float(new_price) <= 0:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid price'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "UPDATE settings SET value = %s, updated_at = CURRENT_TIMESTAMP WHERE key = 'current_price'",
                (str(new_price),)
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
        
        elif action == 'set_commission':
            commission = body_data.get('commission')
            if commission is None or float(commission) < 0:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid commission'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "UPDATE settings SET value = %s, updated_at = CURRENT_TIMESTAMP WHERE key = 'commission'",
                (str(commission),)
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
        
        elif action == 'create_promotion':
            title = body_data.get('title')
            description = body_data.get('description', '')
            discount = body_data.get('discount')
            
            if not title or not discount:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Title and discount required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "INSERT INTO promotions (title, description, discount) VALUES (%s, %s, %s) RETURNING id",
                (title, description, discount)
            )
            promo_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'id': promo_id}),
                'isBase64Encoded': False
            }
        
        elif action == 'toggle_promotion':
            promo_id = body_data.get('promoId')
            if not promo_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'promoId required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("UPDATE promotions SET active = NOT active WHERE id = %s", (promo_id,))
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        elif action == 'create_lottery':
            prize = body_data.get('prize')
            if not prize or float(prize) <= 0:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid prize'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "INSERT INTO lotteries (prize) VALUES (%s) RETURNING id",
                (prize,)
            )
            lottery_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'id': lottery_id}),
                'isBase64Encoded': False
            }
        
        elif action == 'draw_winner':
            lottery_id = body_data.get('lotteryId')
            if not lottery_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'lotteryId required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "SELECT user_id FROM lottery_participants WHERE lottery_id = %s",
                (lottery_id,)
            )
            participants = [row[0] for row in cur.fetchall()]
            
            if not participants:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'No participants'}),
                    'isBase64Encoded': False
                }
            
            winner_id = random.choice(participants)
            
            cur.execute("SELECT prize FROM lotteries WHERE id = %s", (lottery_id,))
            prize = cur.fetchone()[0]
            
            cur.execute(
                "UPDATE lotteries SET winner_id = %s, active = false, completed_at = CURRENT_TIMESTAMP WHERE id = %s",
                (winner_id, lottery_id)
            )
            
            cur.execute(
                "UPDATE user_balances SET crypto_balance = crypto_balance + %s WHERE user_id = %s",
                (prize, winner_id)
            )
            
            cur.execute("SELECT username FROM users WHERE id = %s", (winner_id,))
            winner_name = cur.fetchone()[0]
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'winnerId': winner_id, 'winner': winner_name}),
                'isBase64Encoded': False
            }
        
        elif action == 'approve_purchase':
            request_id = body_data.get('requestId')
            approved = body_data.get('approved', False)
            
            if not request_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'requestId required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "SELECT user_id, amount, price FROM purchase_requests WHERE id = %s AND status = 'pending'",
                (request_id,)
            )
            request_data = cur.fetchone()
            
            if not request_data:
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Request not found'}),
                    'isBase64Encoded': False
                }
            
            user_id, amount, price = request_data
            
            if approved:
                cur.execute("SELECT value FROM settings WHERE key = 'commission'")
                commission_percent = float(cur.fetchone()[0])
                commission = float(amount) * float(price) * (commission_percent / 100.0)
                
                cur.execute("SELECT discount FROM promotions WHERE active = true ORDER BY discount DESC LIMIT 1")
                discount_row = cur.fetchone()
                discount = float(discount_row[0]) if discount_row else 0
                
                final_amount = float(amount) * (1 + discount / 100.0)
                
                cur.execute(
                    "UPDATE user_balances SET crypto_balance = crypto_balance + %s WHERE user_id = %s",
                    (final_amount, user_id)
                )
                
                cur.execute(
                    """INSERT INTO transactions (user_id, type, amount, price, commission)
                       VALUES (%s, 'buy', %s, %s, %s)""",
                    (user_id, final_amount, price, commission)
                )
                
                cur.execute(
                    "UPDATE purchase_requests SET status = 'approved', approved_at = CURRENT_TIMESTAMP WHERE id = %s",
                    (request_id,)
                )
            else:
                cur.execute(
                    "UPDATE purchase_requests SET status = 'rejected' WHERE id = %s",
                    (request_id,)
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
        
        elif action == 'remove_crypto':
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
                "UPDATE user_balances SET crypto_balance = GREATEST(0, crypto_balance - %s) WHERE user_id = %s",
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
