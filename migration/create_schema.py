#!/usr/bin/env python3
"""
Script para criar o schema do banco PostgreSQL local
baseado na estrutura do Supabase
"""

import psycopg2
import os
from dotenv import load_dotenv

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

def create_database_schema(conn):
    """Cria todas as tabelas necessárias"""
    cursor = conn.cursor()
    
    # SQL para criar as tabelas
    sql_commands = [
        # Tabela de ativos
        """
        CREATE TABLE IF NOT EXISTS ativos (
            id SERIAL PRIMARY KEY,
            ticker VARCHAR(20) UNIQUE NOT NULL,
            nome VARCHAR(255) NOT NULL,
            preco_atual DECIMAL(15,8),
            data_atualizacao TIMESTAMP WITH TIME ZONE,
            retorno_acumulado DECIMAL(15,8),
            retorno_anualizado DECIMAL(15,8), 
            volatilidade DECIMAL(15,8),
            max_drawdown DECIMAL(15,8),
            sharpe DECIMAL(15,8),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
        """,
        
        # Tabela de dados históricos
        """
        CREATE TABLE IF NOT EXISTS dados_historicos (
            id SERIAL PRIMARY KEY,
            ticker VARCHAR(20) NOT NULL,
            nome_ativo VARCHAR(255),
            data DATE NOT NULL,
            abertura DECIMAL(15,8),
            maxima DECIMAL(15,8),
            minima DECIMAL(15,8),
            fechamento DECIMAL(15,8),
            fechamento_ajustado DECIMAL(15,8),
            volume BIGINT,
            retorno_diario DECIMAL(15,8),
            mm20 DECIMAL(15,8),
            bb2s DECIMAL(15,8),
            bb2i DECIMAL(15,8),
            pico DECIMAL(15,8),
            drawdown DECIMAL(15,8),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(ticker, data)
        )
        """,
        
        # Tabela de cestas
        """
        CREATE TABLE IF NOT EXISTS cestas (
            id SERIAL PRIMARY KEY,
            nome VARCHAR(255) NOT NULL,
            descricao TEXT,
            ativos JSONB NOT NULL,
            data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
        """,
        
        # Tabela de transações
        """
        CREATE TABLE IF NOT EXISTS transacoes (
            id SERIAL PRIMARY KEY,
            type VARCHAR(10) NOT NULL CHECK (type IN ('buy', 'sell')),
            ativo_id INTEGER,
            asset VARCHAR(50),
            quantity DECIMAL(15,8) NOT NULL,
            price DECIMAL(15,8) NOT NULL,
            date DATE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
        """,
        
        # Tabela de fundos de investimento
        """
        CREATE TABLE IF NOT EXISTS investment_funds (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            initial_investment DECIMAL(15,2) NOT NULL,
            current_value DECIMAL(15,2) NOT NULL,
            investment_date DATE NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
        """,
        
        # Tabela de saldo em caixa
        """
        CREATE TABLE IF NOT EXISTS cash_balance (
            id SERIAL PRIMARY KEY,
            value DECIMAL(15,2) NOT NULL DEFAULT 0.00,
            last_update TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
        """
    ]
    
    # Criar índices
    index_commands = [
        "CREATE INDEX IF NOT EXISTS idx_dados_historicos_ticker ON dados_historicos(ticker)",
        "CREATE INDEX IF NOT EXISTS idx_dados_historicos_data ON dados_historicos(data)",
        "CREATE INDEX IF NOT EXISTS idx_dados_historicos_ticker_data ON dados_historicos(ticker, data)",
        "CREATE INDEX IF NOT EXISTS idx_ativos_ticker ON ativos(ticker)",
        "CREATE INDEX IF NOT EXISTS idx_transacoes_ativo_id ON transacoes(ativo_id)",
        "CREATE INDEX IF NOT EXISTS idx_transacoes_asset ON transacoes(asset)",
        "CREATE INDEX IF NOT EXISTS idx_transacoes_date ON transacoes(date)"
    ]
    
    try:
        print("Criando tabelas...")
        for i, command in enumerate(sql_commands, 1):
            cursor.execute(command)
            print(f"  OK: Tabela {i}/{len(sql_commands)} criada")
        
        print("\nCriando índices...")
        for i, command in enumerate(index_commands, 1):
            cursor.execute(command)
            print(f"  OK: Indice {i}/{len(index_commands)} criado")
        
        conn.commit()
        print("\nOK: Schema criado com sucesso!")
        
    except Exception as e:
        conn.rollback()
        print(f"ERRO: Erro ao criar schema: {e}")
        raise
    finally:
        cursor.close()

def main():
    """Função principal"""
    try:
        print("Iniciando criacao do schema PostgreSQL...")
        
        # Conectar ao PostgreSQL
        conn = get_postgres_connection()
        print("OK: Conectado ao PostgreSQL")
        
        # Criar schema
        create_database_schema(conn)
        
        conn.close()
        print("OK: Migration de schema concluida!")
        
    except Exception as e:
        print(f"ERRO: Erro na migration: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())