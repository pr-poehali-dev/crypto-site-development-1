import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Lottery participation for users
    Args: event with httpMethod, body
    Returns: HTTP response with lottery data
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
        cur.execute("""
            SELECT l.id, l.prize, l.active,
                   (SELECT COUNT(*) FROM lottery_participants WHERE lottery_id = l.id) as participant_count
            FROM lotteries l
            WHERE l.active = true
            ORDER BY l.created_at DESC
        """)
        
        lotteries = []
        for row in cur.fetchall():
            lotteries.append({
                'id': row[0],
                'prize': float(row[1]),
                'active': row[2],
                'participantCount': row[3]
            })
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'lotteries': lotteries}),
            'isBase64Encoded': False
        }
    
    elif method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        lottery_id = body_data.get('lotteryId')
        user_id = body_data.get('userId')
        
        if not lottery_id or not user_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'lotteryId and userId required'}),
                'isBase64Encoded': False
            }
        
        cur.execute("SELECT active FROM lotteries WHERE id = %s", (lottery_id,))
        lottery_row = cur.fetchone()
        
        if not lottery_row or not lottery_row[0]:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Lottery not active'}),
                'isBase64Encoded': False
            }
        
        cur.execute(
            "SELECT id FROM lottery_participants WHERE lottery_id = %s AND user_id = %s",
            (lottery_id, user_id)
        )
        
        if cur.fetchone():
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Already participating'}),
                'isBase64Encoded': False
            }
        
        cur.execute(
            "INSERT INTO lottery_participants (lottery_id, user_id) VALUES (%s, %s)",
            (lottery_id, user_id)
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
