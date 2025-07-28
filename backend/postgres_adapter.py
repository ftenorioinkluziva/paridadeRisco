"""
PostgreSQL Database Adapter
Substitui as chamadas do Supabase por PostgreSQL
"""

import psycopg2
import psycopg2.extras
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
import json
from decimal import Decimal

# Carregar variáveis de ambiente
load_dotenv()

class PostgreSQLAdapter:
    def __init__(self):
        self.connection = None
        self.connect()
    
    def convert_data_types(self, data):
        """Converte tipos de dados PostgreSQL para tipos compatíveis com JSON"""
        if isinstance(data, list):
            return [self.convert_data_types(item) for item in data]
        elif isinstance(data, dict):
            converted = {}
            # Lista de campos que devem ser convertidos para float
            numeric_fields = [
                'preco_atual', 'retorno_acumulado', 'retorno_anualizado', 
                'volatilidade', 'max_drawdown', 'sharpe', 'abertura', 
                'maxima', 'minima', 'fechamento', 'fechamento_ajustado',
                'retorno_diario', 'mm20', 'bb2s', 'bb2i', 'pico', 'drawdown',
                'quantity', 'price', 'initial_investment', 'current_value', 'value'
            ]
            
            for key, value in data.items():
                if key in numeric_fields and value is not None:
                    try:
                        converted[key] = float(value)
                    except (ValueError, TypeError):
                        converted[key] = value
                else:
                    converted[key] = self.convert_data_types(value)
            return converted
        elif isinstance(data, Decimal):
            return float(data)
        elif data is None:
            return None
        else:
            return data
    
    def connect(self):
        """Estabelece conexão com PostgreSQL"""
        try:
            self.connection = psycopg2.connect(
                host=os.getenv('POSTGRES_HOST', 'localhost'),
                port=os.getenv('POSTGRES_PORT', '5432'),
                database=os.getenv('POSTGRES_DB', 'paridaderisco'),
                user=os.getenv('POSTGRES_USER', 'postgres'),
                password=os.getenv('POSTGRES_PASSWORD', 'postgres')
            )
            print("Conexão com PostgreSQL estabelecida com sucesso.")
        except Exception as e:
            print(f"Erro ao conectar com PostgreSQL: {str(e)}")
            self.connection = None
    
    def execute_query(self, query, params=None, fetch=True):
        """Executa uma query no PostgreSQL"""
        if not self.connection:
            raise Exception("Conexão com PostgreSQL não estabelecida")
        
        try:
            cursor = self.connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cursor.execute(query, params)
            
            if fetch:
                result = cursor.fetchall()
                # Converter RealDictRow para dict e converter tipos de dados
                result = [dict(row) for row in result]
                result = self.convert_data_types(result)
            else:
                result = cursor.rowcount
                
            self.connection.commit()
            cursor.close()
            return result
        except Exception as e:
            self.connection.rollback()
            raise e
    
    def select(self, table, columns='*', where_conditions=None, order_by=None, limit=None, offset=None):
        """Simula o .select() do Supabase"""
        query = f"SELECT {columns} FROM {table}"
        params = []
        
        if where_conditions:
            where_clauses = []
            for condition in where_conditions:
                where_clauses.append(condition['clause'])
                if condition.get('params'):
                    params.extend(condition['params'])
            query += f" WHERE {' AND '.join(where_clauses)}"
        
        if order_by:
            query += f" ORDER BY {order_by}"
        
        if limit:
            query += f" LIMIT {limit}"
            
        if offset:
            query += f" OFFSET {offset}"
        
        return self.execute_query(query, params)
    
    def insert(self, table, data):
        """Simula o .insert() do Supabase"""
        columns = ', '.join(data.keys())
        placeholders = ', '.join(['%s'] * len(data))
        values = list(data.values())
        
        query = f"INSERT INTO {table} ({columns}) VALUES ({placeholders}) RETURNING *"
        result = self.execute_query(query, values)
        return result[0] if result else None
    
    def update(self, table, data, where_conditions):
        """Simula o .update() do Supabase"""
        set_clauses = []
        params = []
        
        for key, value in data.items():
            set_clauses.append(f"{key} = %s")
            params.append(value)
        
        where_clauses = []
        for condition in where_conditions:
            where_clauses.append(condition['clause'])
            if condition.get('params'):
                params.extend(condition['params'])
        
        query = f"UPDATE {table} SET {', '.join(set_clauses)} WHERE {' AND '.join(where_clauses)} RETURNING *"
        result = self.execute_query(query, params)
        return result[0] if result else None
    
    def delete(self, table, where_conditions):
        """Simula o .delete() do Supabase"""
        params = []
        where_clauses = []
        
        for condition in where_conditions:
            where_clauses.append(condition['clause'])
            if condition.get('params'):
                params.extend(condition['params'])
        
        query = f"DELETE FROM {table} WHERE {' AND '.join(where_clauses)}"
        return self.execute_query(query, params, fetch=False)
    
    def close(self):
        """Fecha a conexão"""
        if self.connection:
            self.connection.close()

class PostgreSQLTable:
    """Classe para simular a interface de tabela do Supabase"""
    
    def __init__(self, adapter, table_name):
        self.adapter = adapter
        self.table_name = table_name
        self._select_columns = '*'
        self._where_conditions = []
        self._order_by = None
        self._limit = None
        self._offset = None
    
    def select(self, columns='*'):
        """Define colunas para seleção"""
        self._select_columns = columns
        return self
    
    def eq(self, column, value):
        """Adiciona condição de igualdade"""
        self._where_conditions.append({
            'clause': f"{column} = %s",
            'params': [value]
        })
        return self
    
    def gte(self, column, value):
        """Adiciona condição maior ou igual"""
        self._where_conditions.append({
            'clause': f"{column} >= %s",
            'params': [value]
        })
        return self
    
    def lte(self, column, value):
        """Adiciona condição menor ou igual"""
        self._where_conditions.append({
            'clause': f"{column} <= %s",
            'params': [value]
        })
        return self
    
    def order(self, column, desc=False):
        """Define ordenação"""
        direction = 'DESC' if desc else 'ASC'
        self._order_by = f"{column} {direction}"
        return self
    
    def limit(self, count):
        """Define limite de registros"""
        self._limit = count
        return self
    
    def range(self, start, end):
        """Define range de registros (simula paginação do Supabase)"""
        self._limit = end - start + 1
        self._offset = start
        return self
    
    def execute(self):
        """Executa a query e retorna resultado no formato Supabase"""
        try:
            result = self.adapter.select(
                table=self.table_name,
                columns=self._select_columns,
                where_conditions=self._where_conditions if self._where_conditions else None,
                order_by=self._order_by,
                limit=self._limit,
                offset=self._offset
            )
            
            # Resetar condições para próxima query
            self._reset()
            
            # Simular formato de resposta do Supabase
            return MockSupabaseResponse(result)
        except Exception as e:
            self._reset()
            raise e
    
    def insert(self, data):
        """Insere dados e retorna resultado"""
        try:
            # Se data é uma lista, inserir múltiplos registros
            if isinstance(data, list):
                results = []
                for item in data:
                    result = self.adapter.insert(self.table_name, item)
                    if result:
                        results.append(result)
                return MockSupabaseResponse(results)
            else:
                result = self.adapter.insert(self.table_name, data)
                return MockSupabaseResponse([result] if result else [])
        except Exception as e:
            raise e
    
    def update(self, data):
        """Atualiza dados com as condições definidas"""
        try:
            if not self._where_conditions:
                raise Exception("Condições WHERE são obrigatórias para UPDATE")
            
            result = self.adapter.update(self.table_name, data, self._where_conditions)
            self._reset()
            return MockSupabaseResponse([result] if result else [])
        except Exception as e:
            self._reset()
            raise e
    
    def delete(self):
        """Deleta registros com as condições definidas"""
        try:
            if not self._where_conditions:
                raise Exception("Condições WHERE são obrigatórias para DELETE")
            
            count = self.adapter.delete(self.table_name, self._where_conditions)
            self._reset()
            return MockSupabaseResponse([], count=count)
        except Exception as e:
            self._reset()
            raise e
    
    def _reset(self):
        """Reseta condições da query"""
        self._select_columns = '*'
        self._where_conditions = []
        self._order_by = None
        self._limit = None
        self._offset = None

class MockSupabaseResponse:
    """Classe para simular resposta do Supabase"""
    
    def __init__(self, data, count=None):
        self.data = data
        self.count = count if count is not None else len(data) if data else 0

class PostgreSQLClient:
    """Cliente principal que simula o cliente Supabase"""
    
    def __init__(self):
        self.adapter = PostgreSQLAdapter()
    
    def table(self, table_name):
        """Retorna objeto de tabela para operações"""
        return PostgreSQLTable(self.adapter, table_name)
    
    def close(self):
        """Fecha conexão"""
        self.adapter.close()