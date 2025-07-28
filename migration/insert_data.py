#!/usr/bin/env python3
"""
Script para inserir dados extraídos no PostgreSQL local
"""

import os
import json
import psycopg2
import psycopg2.extras
from datetime import datetime
from dotenv import load_dotenv
from tqdm import tqdm

# Carregar variáveis de ambiente
load_dotenv()

def get_postgres_connection():
    """Cria conexão com PostgreSQL local"""
    return psycopg2.connect(
        host=os.getenv('POSTGRES_HOST', 'localhost'),
        port=os.getenv('POSTGRES_PORT', '5432'),
        database=os.getenv('POSTGRES_DB', 'paridaderisco'),
        user=os.getenv('POSTGRES_USER', 'postgres'),
        password=os.getenv('POSTGRES_PASSWORD', 'postgres')
    )

def load_json_data(table_name, data_dir="migration/data"):
    """Carrega dados JSON de uma tabela"""
    filename = f"{data_dir}/{table_name}.json"
    
    if not os.path.exists(filename):
        print(f"AVISO: Arquivo nao encontrado: {filename}")
        return []
    
    with open(filename, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Carregados {len(data)} registros de {table_name}")
    return data

def prepare_data_for_postgres(data, table_name):
    """Prepara dados para inserção no PostgreSQL"""
    if not data:
        return []
    
    prepared_data = []
    
    for record in data:
        prepared_record = {}
        
        for key, value in record.items():
            # Converter None explicitamente
            if value is None:
                prepared_record[key] = None
            # Converter strings de data/timestamp
            elif key in ['data_atualizacao', 'created_at', 'updated_at', 'last_update'] and isinstance(value, str):
                try:
                    prepared_record[key] = datetime.fromisoformat(value.replace('Z', '+00:00'))
                except:
                    prepared_record[key] = None
            elif key == 'data' and isinstance(value, str):
                try:
                    prepared_record[key] = datetime.fromisoformat(value).date()
                except:
                    prepared_record[key] = None
            elif key == 'investment_date' and isinstance(value, str):
                try:
                    prepared_record[key] = datetime.fromisoformat(value).date()
                except:
                    prepared_record[key] = None
            else:
                prepared_record[key] = value
        
        prepared_data.append(prepared_record)
    
    return prepared_data

def insert_table_data(conn, table_name, data):
    """Insere dados de uma tabela no PostgreSQL"""
    if not data:
        print(f"AVISO: Nenhum dado para inserir na tabela {table_name}")
        return
    
    print(f"Inserindo {len(data)} registros na tabela '{table_name}'...")
    
    cursor = conn.cursor()
    
    try:
        # Preparar dados
        prepared_data = prepare_data_for_postgres(data, table_name)
        
        if not prepared_data:
            print(f"AVISO: Nenhum dado preparado para {table_name}")
            return
        
        # Obter colunas do primeiro registro
        columns = list(prepared_data[0].keys())
        
        # Construir query de inserção
        placeholders = ', '.join(['%s'] * len(columns))
        columns_str = ', '.join(columns)
        
        # Usar ON CONFLICT para evitar duplicatas
        conflict_columns = get_conflict_columns(table_name)
        
        if conflict_columns:
            query = f"""
            INSERT INTO {table_name} ({columns_str})
            VALUES ({placeholders})
            ON CONFLICT ({conflict_columns}) DO NOTHING
            """
        else:
            query = f"""
            INSERT INTO {table_name} ({columns_str})
            VALUES ({placeholders})
            """
        
        # Preparar dados para inserção em lotes
        batch_size = int(os.getenv('BATCH_SIZE', 1000))
        
        inserted_count = 0
        for i in tqdm(range(0, len(prepared_data), batch_size), desc=f"Inserindo {table_name}"):
            batch = prepared_data[i:i+batch_size]
            
            # Converter registros em tuplas
            values = []
            for record in batch:
                values.append(tuple(record.get(col) for col in columns))
            
            # Inserir lote
            cursor.executemany(query, values)
            inserted_count += len(batch)
        
        conn.commit()
        print(f"OK: {inserted_count} registros inseridos em '{table_name}'")
        
    except Exception as e:
        conn.rollback()
        print(f"ERRO: Erro ao inserir dados em {table_name}: {e}")
        raise
    finally:
        cursor.close()

def get_conflict_columns(table_name):
    """Retorna colunas para ON CONFLICT baseado na tabela"""
    conflict_mapping = {
        'ativos': 'ticker',
        'dados_historicos': 'ticker, data',
        'cestas': None,  # Permitir duplicatas ou usar ID
        'transacoes': None,
        'investment_funds': None,
        'cash_balance': None
    }
    
    return conflict_mapping.get(table_name)

def insert_all_data():
    """Insere dados de todas as tabelas"""
    tables = [
        'ativos',
        'dados_historicos',
        'cestas', 
        'transacoes',
        'investment_funds',
        'cash_balance'
    ]
    
    try:
        print("Iniciando insercao de dados no PostgreSQL...")
        
        # Conectar ao PostgreSQL
        conn = get_postgres_connection()
        print("OK: Conectado ao PostgreSQL")
        
        success_count = 0
        
        # Inserir cada tabela
        for table in tables:
            try:
                # Carregar dados
                data = load_json_data(table)
                
                if data:
                    insert_table_data(conn, table, data)
                    success_count += 1
                else:
                    print(f"AVISO: Nenhum dado para inserir na tabela '{table}'")
                    
            except Exception as e:
                print(f"ERRO: Erro ao processar tabela '{table}': {e}")
                continue
        
        conn.close()
        
        print(f"\nOK: Insercao concluida!")
        print(f"   Tabelas processadas: {success_count}/{len(tables)}")
        
        return success_count > 0
        
    except Exception as e:
        print(f"ERRO: Erro na insercao: {e}")
        return False

def main():
    """Função principal"""
    try:
        success = insert_all_data()
        return 0 if success else 1
        
    except Exception as e:
        print(f"ERRO: Erro na insercao: {e}")
        return 1

if __name__ == "__main__":
    exit(main())