#!/usr/bin/env python3
"""
Script para verificar se a migração foi bem-sucedida
"""

import os
import psycopg2
from supabase import create_client
from dotenv import load_dotenv
from datetime import datetime

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

def get_supabase_client():
    """Cria cliente do Supabase"""
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_KEY')
    
    if not url or not key:
        raise ValueError("SUPABASE_URL e SUPABASE_KEY devem estar definidas")
    
    return create_client(url, key)

def get_table_count(connection, table_name, is_postgres=True):
    """Conta registros em uma tabela"""
    try:
        if is_postgres:
            cursor = connection.cursor()
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            cursor.close()
            return count
        else:
            # Supabase
            response = connection.table(table_name).select('*', count='exact').execute()
            return response.count if hasattr(response, 'count') else len(response.data)
    except Exception as e:
        print(f"   ERRO ao contar {table_name}: {e}")
        return None

def compare_table_counts():
    """Compara contagem de registros entre Supabase e PostgreSQL"""
    tables = [
        'ativos',
        'dados_historicos',
        'cestas',
        'transacoes', 
        'investment_funds',
        'cash_balance'
    ]
    
    print("📊 Comparando contagem de registros...\n")
    
    try:
        # Conectar aos bancos
        postgres_conn = get_postgres_connection()
        supabase_client = get_supabase_client()
        
        print(f"{'Tabela':<20} {'Supabase':<15} {'PostgreSQL':<15} {'Status':<10}")
        print("-" * 65)
        
        total_supabase = 0
        total_postgres = 0
        matches = 0
        
        for table in tables:
            supabase_count = get_table_count(supabase_client, table, False)
            postgres_count = get_table_count(postgres_conn, table, True)
            
            if supabase_count is not None and postgres_count is not None:
                status = "OK" if supabase_count == postgres_count else "DIFF"
                total_supabase += supabase_count
                total_postgres += postgres_count
                if supabase_count == postgres_count:
                    matches += 1
            else:
                status = "❓ ERROR"
            
            print(f"{table:<20} {supabase_count or 'N/A':<15} {postgres_count or 'N/A':<15} {status}")
        
        print("-" * 65)
        print(f"{'TOTAL':<20} {total_supabase:<15} {total_postgres:<15}")
        print(f"\n📈 Resumo: {matches}/{len(tables)} tabelas com contagem idêntica")
        
        postgres_conn.close()
        
        return matches == len(tables)
        
    except Exception as e:
        print(f"ERRO na comparacao: {e}")
        return False

def verify_data_integrity():
    """Verifica integridade dos dados migrados"""
    print("\nVerificando integridade dos dados...\n")
    
    try:
        postgres_conn = get_postgres_connection()
        cursor = postgres_conn.cursor()
        
        integrity_checks = [
            # Verificar se há ativos
            ("Ativos cadastrados", "SELECT COUNT(*) FROM ativos"),
            
            # Verificar dados históricos recentes
            ("Dados históricos recentes", """
                SELECT COUNT(*) FROM dados_historicos 
                WHERE data >= CURRENT_DATE - INTERVAL '30 days'
            """),
            
            # Verificar se há pelo menos um ativo com preço atual
            ("Ativos com preço atual", """
                SELECT COUNT(*) FROM ativos 
                WHERE preco_atual IS NOT NULL AND preco_atual > 0
            """),
            
            # Verificar consistência de datas
            ("Dados com datas válidas", """
                SELECT COUNT(*) FROM dados_historicos 
                WHERE data IS NOT NULL AND data <= CURRENT_DATE
            """),
            
            # Verificar se há transações (se existirem)
            ("Transações registradas", "SELECT COUNT(*) FROM transacoes")
        ]
        
        all_passed = True
        
        for check_name, query in integrity_checks:
            try:
                cursor.execute(query)
                result = cursor.fetchone()[0]
                status = "OK" if result > 0 else "EMPTY"
                
                if result == 0 and check_name in ["Ativos cadastrados", "Ativos com preço atual"]:
                    status = "FAIL"
                    all_passed = False
                
                print(f"{check_name:<30}: {result:>10} registros {status}")
                
            except Exception as e:
                print(f"{check_name:<30}: ERRO - {e}")
                all_passed = False
        
        cursor.close()
        postgres_conn.close()
        
        return all_passed
        
    except Exception as e:
        print(f"ERRO na verificacao de integridade: {e}")
        return False

def check_database_structure():
    """Verifica se as tabelas foram criadas corretamente"""
    print("\n🏗️ Verificando estrutura do banco...\n")
    
    expected_tables = [
        'ativos',
        'dados_historicos', 
        'cestas',
        'transacoes',
        'investment_funds',
        'cash_balance'
    ]
    
    try:
        postgres_conn = get_postgres_connection()
        cursor = postgres_conn.cursor()
        
        # Listar tabelas existentes
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        
        existing_tables = [row[0] for row in cursor.fetchall()]
        
        print("Tabelas esperadas vs existentes:")
        all_exist = True
        
        for table in expected_tables:
            exists = table in existing_tables
            status = "EXISTS" if exists else "MISSING"
            print(f"  {table:<20}: {status}")
            
            if not exists:
                all_exist = False
        
        # Verificar índices importantes
        cursor.execute("""
            SELECT indexname 
            FROM pg_indexes 
            WHERE schemaname = 'public'
            ORDER BY indexname
        """)
        
        indexes = [row[0] for row in cursor.fetchall()]
        print(f"\n📋 Índices criados: {len(indexes)}")
        
        cursor.close()
        postgres_conn.close()
        
        return all_exist
        
    except Exception as e:
        print(f"ERRO na verificacao de estrutura: {e}")
        return False

def main():
    """Função principal de verificação"""
    print("=" * 60)
    print("VERIFICACAO DA MIGRACAO")
    print("=" * 60)
    print(f"Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    checks = [
        ("Estrutura do Banco", check_database_structure),
        ("Contagem de Registros", compare_table_counts),
        ("Integridade dos Dados", verify_data_integrity)
    ]
    
    results = []
    
    for check_name, check_function in checks:
        print(f"\n{'='*20} {check_name.upper()} {'='*20}")
        
        try:
            result = check_function()
            results.append(result)
            
            if result:
                print(f"OK {check_name}: PASSOU")
            else:
                print(f"ERRO {check_name}: FALHOU")
                
        except Exception as e:
            print(f"ERRO em {check_name}: {e}")
            results.append(False)
    
    # Resumo final
    print("\n" + "="*60)
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print("🎉 MIGRAÇÃO VERIFICADA COM SUCESSO!")
        print("   Todos os testes passaram. A migração está completa.")
    else:
        print(f"⚠️ MIGRAÇÃO PARCIALMENTE VERIFICADA")
        print(f"   {passed}/{total} testes passaram.")
        print("   Revise os erros acima antes de usar o banco local.")
    
    print("="*60)
    
    return 0 if passed == total else 1

if __name__ == "__main__":
    exit(main())