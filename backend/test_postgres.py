#!/usr/bin/env python3
"""
Teste simples para verificar a conexão com PostgreSQL
"""

import os
import sys
from dotenv import load_dotenv

# Add the current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from postgres_adapter import PostgreSQLClient

def test_connection():
    """Testa a conexão com PostgreSQL"""
    load_dotenv()
    
    print("Testando conexão com PostgreSQL...")
    print(f"Host: {os.getenv('POSTGRES_HOST', 'localhost')}")
    print(f"Port: {os.getenv('POSTGRES_PORT', '5432')}")
    print(f"Database: {os.getenv('POSTGRES_DB', 'paridaderisco')}")
    print(f"User: {os.getenv('POSTGRES_USER', 'postgres')}")
    
    try:
        # Criar cliente
        client = PostgreSQLClient()
        print("OK: Cliente PostgreSQL criado com sucesso")
        
        # Testar uma consulta simples
        response = client.table('ativos').select('COUNT(*) as total').limit(1).execute()
        print(f"OK: Consulta de teste executada: {response.data}")
        
        # Fechar conexão
        client.close()
        print("OK: Conexão fechada com sucesso")
        
        return True
        
    except Exception as e:
        print(f"ERRO: Erro ao conectar: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)