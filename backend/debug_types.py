#!/usr/bin/env python3
"""
Debug script to check what types psycopg2 returns
"""

import psycopg2
import psycopg2.extras
import os
from decimal import Decimal
from dotenv import load_dotenv

load_dotenv()

def test_direct_connection():
    """Test direct psycopg2 connection"""
    try:
        conn = psycopg2.connect(
            host=os.getenv('POSTGRES_HOST', 'postgres'),
            port=os.getenv('POSTGRES_PORT', '5432'),
            database=os.getenv('POSTGRES_DB', 'paridaderisco'),
            user=os.getenv('POSTGRES_USER', 'postgres'),
            password=os.getenv('POSTGRES_PASSWORD', 'postgres')
        )
        
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("SELECT ticker, preco_atual FROM ativos LIMIT 1")
        result = cursor.fetchone()
        
        print("Direct psycopg2 result:")
        print(f"  ticker: {repr(result['ticker'])} (type: {type(result['ticker'])})")
        print(f"  preco_atual: {repr(result['preco_atual'])} (type: {type(result['preco_atual'])})")
        
        # Test conversion
        if isinstance(result['preco_atual'], Decimal):
            converted = float(result['preco_atual'])
            print(f"  converted: {repr(converted)} (type: {type(converted)})")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    test_direct_connection()