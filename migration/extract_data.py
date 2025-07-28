#!/usr/bin/env python3
"""
Script para extrair dados do Supabase
"""

import os
import json
import pandas as pd
from supabase import create_client
from dotenv import load_dotenv
from tqdm import tqdm

# Carregar variáveis de ambiente
load_dotenv()

def get_supabase_client():
    """Cria cliente do Supabase"""
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_KEY')
    
    if not url or not key:
        raise ValueError("SUPABASE_URL e SUPABASE_KEY devem estar definidas")
    
    return create_client(url, key)

def extract_table_data(supabase, table_name, batch_size=1000):
    """Extrai dados de uma tabela do Supabase com paginação"""
    print(f"Extraindo dados da tabela '{table_name}'...")
    
    all_data = []
    offset = 0
    
    while True:
        try:
            # Buscar dados com paginação
            response = supabase.table(table_name) \
                .select('*') \
                .range(offset, offset + batch_size - 1) \
                .execute()
            
            if not response.data or len(response.data) == 0:
                break
            
            all_data.extend(response.data)
            
            print(f"  Extraidos {len(response.data)} registros (total: {len(all_data)})")
            
            # Se retornou menos que o batch_size, chegou ao fim
            if len(response.data) < batch_size:
                break
                
            offset += batch_size
            
        except Exception as e:
            print(f"ERRO: Erro ao extrair dados da tabela {table_name}: {e}")
            break
    
    print(f"OK: Total extraido de '{table_name}': {len(all_data)} registros")
    return all_data

def save_data_to_json(data, table_name, output_dir="migration/data"):
    """Salva dados extraídos em arquivo JSON"""
    os.makedirs(output_dir, exist_ok=True)
    
    filename = f"{output_dir}/{table_name}.json"
    
    # Converter pandas timestamps e decimais para strings
    def convert_for_json(obj):
        if pd.isna(obj):
            return None
        if isinstance(obj, pd.Timestamp):
            return obj.isoformat()
        return obj
    
    # Processar dados para serialização JSON
    processed_data = []
    for record in data:
        processed_record = {}
        for key, value in record.items():
            processed_record[key] = convert_for_json(value)
        processed_data.append(processed_record)
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(processed_data, f, indent=2, ensure_ascii=False, default=str)
    
    print(f"Dados salvos em: {filename}")
    return filename

def extract_all_tables():
    """Extrai dados de todas as tabelas principais"""
    tables = [
        'ativos',
        'dados_historicos', 
        'cestas',
        'transacoes',
        'investment_funds',
        'cash_balance'
    ]
    
    try:
        print("Iniciando extracao de dados do Supabase...")
        
        # Conectar ao Supabase
        supabase = get_supabase_client()
        print("OK: Conectado ao Supabase")
        
        batch_size = int(os.getenv('BATCH_SIZE', 1000))
        extracted_data = {}
        
        # Extrair cada tabela
        for table in tqdm(tables, desc="Extraindo tabelas"):
            try:
                data = extract_table_data(supabase, table, batch_size)
                
                if data:
                    extracted_data[table] = data
                    save_data_to_json(data, table)
                else:
                    print(f"AVISO: Tabela '{table}' esta vazia ou nao existe")
                    
            except Exception as e:
                print(f"ERRO: Erro ao processar tabela '{table}': {e}")
                continue
        
        # Salvar resumo da extração
        summary = {
            'extraction_date': pd.Timestamp.now().isoformat(),
            'tables_extracted': len(extracted_data),
            'total_records': sum(len(data) for data in extracted_data.values()),
            'table_counts': {table: len(data) for table, data in extracted_data.items()}
        }
        
        with open('migration/data/extraction_summary.json', 'w') as f:
            json.dump(summary, f, indent=2)
        
        print(f"\nOK: Extracao concluida!")
        print(f"   Tabelas extraidas: {summary['tables_extracted']}")
        print(f"   Total de registros: {summary['total_records']}")
        
        return extracted_data
        
    except Exception as e:
        print(f"ERRO: Erro na extracao: {e}")
        return None

def main():
    """Função principal"""
    try:
        data = extract_all_tables()
        return 0 if data else 1
        
    except Exception as e:
        print(f"ERRO: Erro na extracao: {e}")
        return 1

if __name__ == "__main__":
    exit(main())