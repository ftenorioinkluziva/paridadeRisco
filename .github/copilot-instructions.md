# Diretrizes para Agentes de IA - Projeto ParidadeRisco

Bem-vindo ao projeto ParidadeRisco! Estas são as diretrizes para ajudá-lo a entender a arquitetura, os fluxos de trabalho e as convenções deste codebase.

## Visão Geral do Projeto

O ParidadeRisco é um dashboard de paridade de risco financeiro que monitora e analisa ativos financeiros brasileiros. É composto por um backend em Flask, um frontend em React e um banco de dados PostgreSQL.

## Arquitetura

A aplicação é dividida em três componentes principais: `backend`, `frontend` e `migration`.

### 1. Backend (Flask API)

- **Localização**: `backend/`
- **Aplicação Principal**: `app.py` é o ponto de entrada que inicializa a API Flask e o agendador.
- **Rotas da API**: `route.py` define os endpoints, que consomem a lógica de `calculos_financeiros.py`.
- **Acesso ao Banco de Dados**: `postgres_adapter.py` centraliza toda a comunicação com o banco de dados PostgreSQL. **Sempre use este adaptador para consultas ao banco de dados.**
- **Cálculos Financeiros**: `calculos_financeiros.py` contém a lógica principal para métricas como volatilidade, Sharpe e drawdowns.
- **Atualização de Dados**: `atualizar_dados.py` é responsável por buscar dados do Yahoo Finance e do Banco Central do Brasil.
- **Agendador**: `scheduler_docker.py` usa APScheduler para automatizar as atualizações de dados.

### 2. Frontend (React)

- **Localização**: `frontend/`
- **Componente Principal**: `src/App.js` é o ponto de entrada do dashboard.
- **Gerenciamento de Estado**: `src/contexts/PortfolioContext.js` gerencia o estado global do portfólio.
- **Comunicação com a API**: `src/config/api.js` configura o cliente Axios para se comunicar com o backend.
- **Componentes Chave**:
    - `CestaComposition.js`: Gerencia a composição das "cestas" de ativos.
    - `TransactionManager.js`: Gerencia as transações do portfólio.

### 3. Migração e Banco de Dados

- **Localização**: `migration/`
- **Schema do Banco**: `migration/init.sql` define a estrutura das tabelas do PostgreSQL.
- **Scripts de Migração**: O diretório contém scripts para migrar dados de uma instância Supabase para o PostgreSQL local. O script principal é `migrate.py`.

## Fluxos de Trabalho de Desenvolvimento

### Ambiente (Docker - Recomendado)

A maneira mais fácil de executar o ambiente completo (backend, frontend, postgres) é com o Docker.

1.  **Construir e Iniciar os Serviços**:
    ```bash
    docker-compose up --build -d
    ```
2.  **Parar os Serviços**:
    ```bash
    docker-compose down
    ```

### Desenvolvimento Local

#### Backend

```bash
# Instalar dependências
pip install -r backend/requirements.txt

# Navegar para o diretório do backend
cd backend

# Iniciar o servidor Flask
python app.py
```

#### Frontend

```bash
# Instalar dependências
cd frontend
npm install

# Iniciar o servidor de desenvolvimento
npm start
```

### Testes

-   **Backend**: Execute os testes de API e conexão com o banco de dados.
    ```bash
    python backend/test_api.py
    python backend/test_postgres.py
    ```
-   **Frontend**: Execute os testes do React.
    ```bash
    cd frontend
    npm test
    ```

## Convenções do Projeto

-   **Variáveis de Ambiente**: O projeto usa um arquivo `.env` na raiz. Consulte o `README.md` principal para as variáveis necessárias, como as credenciais do PostgreSQL.
-   **Adaptador de Banco de Dados**: Toda a lógica de banco de dados no backend deve passar pelo `postgres_adapter.py`. Não escreva consultas SQL diretamente nas rotas ou na lógica de negócios.
-   **Cálculos Financeiros Centralizados**: Adicione novas métricas ou modifique as existentes em `calculos_financeiros.py` para manter a consistência.
-   **Gerenciamento de Estado no Frontend**: Para dados relacionados ao portfólio, utilize o `PortfolioContext`.

## Pontos de Integração

-   **API Backend**: O frontend se comunica com o backend através da URL definida em `REACT_APP_API_URL` (configurada em `frontend/.env`).
-   **Fontes de Dados Externas**: O script `atualizar_dados.py` depende das APIs do Yahoo Finance (`yfinance`) e do Banco Central do Brasil.
