#!/usr/bin/env python3
"""
Script principal de migração do Supabase para PostgreSQL local
"""

import os
import sys
import argparse
import time
from datetime import datetime
from dotenv import load_dotenv

# Adicionar diretório migration ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from create_schema import main as create_schema_main
from extract_data import main as extract_data_main  
from insert_data import main as insert_data_main

def print_banner():
    """Exibe banner da migração"""
    print("=" * 60)
    print("MIGRACAO SUPABASE -> POSTGRESQL LOCAL")
    print("=" * 60)
    print(f"Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

def check_environment():
    """Verifica se todas as variáveis de ambiente necessárias estão definidas"""
    print("Verificando configuracoes...")
    
    required_vars = [
        'SUPABASE_URL',
        'SUPABASE_KEY', 
        'POSTGRES_HOST',
        'POSTGRES_DB',
        'POSTGRES_USER',
        'POSTGRES_PASSWORD'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"ERRO: Variaveis de ambiente faltando: {', '.join(missing_vars)}")
        print("   Configure o arquivo .env com as credenciais necessárias")
        return False
    
    print("OK: Todas as configuracoes estao presentes")
    return True

def run_step(step_name, step_function, skip_on_failure=False):
    """Executa um passo da migração com tratamento de erro"""
    print(f"\n{'='*20} {step_name.upper()} {'='*20}")
    
    start_time = time.time()
    
    try:
        result = step_function()
        
        if result == 0:
            elapsed = time.time() - start_time
            print(f"OK: {step_name} concluido em {elapsed:.2f}s")
            return True
        else:
            print(f"ERRO: {step_name} falhou com codigo: {result}")
            if not skip_on_failure:
                return False
            
    except Exception as e:
        print(f"ERRO: Erro em {step_name}: {e}")
        if not skip_on_failure:
            return False
    
    return True

def full_migration():
    """Executa migração completa"""
    print_banner()
    
    # Verificar ambiente
    if not check_environment():
        return 1
    
    # Criar diretório de dados
    os.makedirs('migration/data', exist_ok=True)
    
    steps = [
        ("Criação do Schema", create_schema_main),
        ("Extração de Dados", extract_data_main),
        ("Inserção de Dados", insert_data_main)
    ]
    
    for step_name, step_function in steps:
        if not run_step(step_name, step_function):
            print(f"\nERRO: Migration falhou no passo: {step_name}")
            return 1
    
    print("\n" + "="*60)
    print("MIGRACAO CONCLUIDA COM SUCESSO!")
    print("="*60)
    print("Proximos passos:")
    print("   1. Verificar dados: python verify_migration.py")
    print("   2. Configurar aplicacao para usar PostgreSQL local")
    print("   3. Testar funcionalidades")
    print("="*60)
    
    return 0

def main():
    """Função principal com argumentos de linha de comando"""
    parser = argparse.ArgumentParser(description='Migração Supabase → PostgreSQL')
    parser.add_argument('--step', choices=['schema', 'extract', 'insert', 'all'], 
                       default='all', help='Passo específico para executar')
    parser.add_argument('--skip-checks', action='store_true', 
                       help='Pular verificações de ambiente')
    
    args = parser.parse_args()
    
    # Carregar variáveis de ambiente
    load_dotenv()
    
    if not args.skip_checks and not check_environment():
        return 1
    
    if args.step == 'all':
        return full_migration()
    elif args.step == 'schema':
        print_banner()
        return run_step("Criação do Schema", create_schema_main)
    elif args.step == 'extract':
        print_banner()
        return run_step("Extração de Dados", extract_data_main)
    elif args.step == 'insert':
        print_banner()
        return run_step("Inserção de Dados", insert_data_main)
    
    return 0

if __name__ == "__main__":
    exit(main())