# 🚀 Migração Supabase → PostgreSQL Local

Este conjunto de scripts permite migrar todos os dados do Supabase para um banco PostgreSQL local.

## 📋 Pré-requisitos

1. **Python 3.8+** instalado
2. **PostgreSQL** local ou via Docker
3. **Acesso ao Supabase** com credenciais válidas

## 🛠️ Configuração

### 1. Instalar dependências

```bash
pip install -r migration/requirements.txt
```

### 2. Configurar variáveis de ambiente

Copie o arquivo de exemplo e configure suas credenciais:

```bash
cp migration/.env.example migration/.env
```

Edite o arquivo `migration/.env`:

```env
# Supabase Configuration (Source)
SUPABASE_URL=https://sua-url.supabase.co
SUPABASE_KEY=sua-chave-anon

# PostgreSQL Configuration (Destination)  
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=paridaderisco
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Migration Configuration
BATCH_SIZE=1000
VERIFY_DATA=true
```

### 3. Preparar PostgreSQL

#### Opção A: Usar Docker (Recomendado)

```bash
# Iniciar PostgreSQL via Docker Compose
docker-compose up postgres -d

# Verificar se está rodando
docker-compose logs postgres
```

#### Opção B: PostgreSQL Local

Certifique-se de que o PostgreSQL está rodando e crie o banco:

```sql
CREATE DATABASE paridaderisco;
```

## 🚀 Executar Migração

### Migração Completa (Recomendado)

```bash
cd migration
python migrate.py
```

### Migração por Etapas

```bash
# 1. Criar apenas o schema
python migrate.py --step schema

# 2. Extrair apenas os dados
python migrate.py --step extract

# 3. Inserir apenas os dados
python migrate.py --step insert
```

### Scripts Individuais

```bash
# Criar schema
python create_schema.py

# Extrair dados do Supabase
python extract_data.py

# Inserir dados no PostgreSQL
python insert_data.py
```

## ✅ Verificação

Após a migração, verifique se tudo ocorreu corretamente:

```bash
python verify_migration.py
```

Este script irá:
- ✅ Verificar se todas as tabelas foram criadas
- ✅ Comparar contagem de registros entre Supabase e PostgreSQL
- ✅ Validar integridade dos dados migrados

## 📁 Estrutura dos Arquivos

```
migration/
├── README.md                 # Este arquivo
├── requirements.txt          # Dependências Python
├── .env.example             # Exemplo de configuração
├── migrate.py               # Script principal de migração
├── create_schema.py         # Criação do schema PostgreSQL
├── extract_data.py          # Extração de dados do Supabase
├── insert_data.py           # Inserção no PostgreSQL
├── verify_migration.py      # Verificação da migração
├── init.sql                 # Inicialização do PostgreSQL
└── data/                    # Dados extraídos (criado automaticamente)
    ├── ativos.json
    ├── dados_historicos.json
    ├── cestas.json
    ├── transacoes.json
    ├── investment_funds.json
    ├── cash_balance.json
    └── extraction_summary.json
```

## 🗄️ Tabelas Migradas

- **ativos**: Informações dos ativos financeiros
- **dados_historicos**: Histórico de preços e indicadores
- **cestas**: Cestas de investimento personalizadas
- **transacoes**: Histórico de transações
- **investment_funds**: Fundos de investimento
- **cash_balance**: Saldo em caixa

## 🔧 Configuração da Aplicação

Após a migração bem-sucedida, configure a aplicação para usar o PostgreSQL local:

### 1. Atualizar backend/app.py

Substitua a configuração do Supabase por PostgreSQL:

```python
# Remover configuração Supabase
# supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Adicionar configuração PostgreSQL
import psycopg2
import psycopg2.extras

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv('POSTGRES_HOST', 'localhost'),
        port=os.getenv('POSTGRES_PORT', '5432'),
        database=os.getenv('POSTGRES_DB', 'paridaderisco'),
        user=os.getenv('POSTGRES_USER', 'postgres'),
        password=os.getenv('POSTGRES_PASSWORD', 'postgres')
    )
```

### 2. Atualizar .env da aplicação

```env
# PostgreSQL Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=paridaderisco
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

## 🐛 Solução de Problemas

### Erro de Conexão PostgreSQL

```bash
# Verificar se PostgreSQL está rodando
docker-compose ps postgres

# Ver logs do PostgreSQL
docker-compose logs postgres
```

### Erro de Conexão Supabase

- Verifique se `SUPABASE_URL` e `SUPABASE_KEY` estão corretas
- Teste a conexão: `curl -H "apikey: SUA_CHAVE" SUA_URL/rest/v1/`

### Erro de Permissões

```bash
# Dar permissão de execução aos scripts
chmod +x migration/*.py
```

### Limpeza em Caso de Erro

```bash
# Remover dados extraídos para tentar novamente
rm -rf migration/data/

# Resetar banco PostgreSQL
docker-compose down postgres
docker volume rm paridaderisco_postgres_data
docker-compose up postgres -d
```

## 📊 Monitoramento

Durante a migração, você verá:

- 📥 Progresso da extração de dados
- 🔄 Status de cada tabela processada  
- ✅ Confirmação de registros inseridos
- 📈 Resumo final com estatísticas

## 🎯 Próximos Passos

1. ✅ Execute `python verify_migration.py`
2. 🔧 Configure a aplicação para usar PostgreSQL
3. 🧪 Teste todas as funcionalidades
4. 🚀 Deploy da aplicação atualizada

## 📞 Suporte

Em caso de problemas:

1. Verifique os logs de erro detalhados
2. Execute a verificação: `python verify_migration.py`
3. Revise as configurações no arquivo `.env`
4. Teste conexões individuais com cada banco