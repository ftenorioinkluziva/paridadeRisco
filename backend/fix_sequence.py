#!/usr/bin/env python3
"""
Script para corrigir a sequência de ID da tabela dados_historicos
"""

import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def fix_sequence():
    """Corrige a sequência de ID da tabela dados_historicos"""
    try:
        # Conectar ao PostgreSQL
        conn = psycopg2.connect(
            host=os.getenv('POSTGRES_HOST', 'postgres'),
            port=int(os.getenv('POSTGRES_PORT', '5432')),
            database=os.getenv('POSTGRES_DB', 'paridaderisco'),
            user=os.getenv('POSTGRES_USER', 'postgres'),
            password=os.getenv('POSTGRES_PASSWORD', 'postgres')
        )
        
        cur = conn.cursor()
        
        # Verificar o maior ID atual
        cur.execute('SELECT MAX(id) FROM dados_historicos;')
        max_id = cur.fetchone()[0]
        
        if max_id is not None:
            # Resetar a sequência para o próximo valor após o maior ID
            cur.execute(f"SELECT setval('dados_historicos_id_seq', {max_id + 1});")
            conn.commit()
            print(f"✅ Sequência resetada para {max_id + 1}")
        else:
            print("⚠️ Nenhum registro encontrado na tabela")
        
        cur.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao corrigir sequência: {e}")
        return False

if __name__ == "__main__":
    fix_sequence()