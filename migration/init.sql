-- Inicialização do banco PostgreSQL
-- Este arquivo é executado automaticamente quando o container PostgreSQL é criado

-- Criar extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Configurar timezone
SET timezone = 'UTC';

-- Mensagem de inicialização
SELECT 'PostgreSQL inicializado para migração Supabase' as status;