# Documento de Arquitetura Brownfield do ParidadeRisco

## Introdução

Este documento captura o ESTADO ATUAL da base de código do ParidadeRisco, incluindo dívidas técnicas, soluções alternativas e padrões do mundo real. Ele serve como referência para agentes de IA que trabalham em melhorias.

### Escopo do Documento

Documentação abrangente de todo o sistema, conforme solicitado.

### Log de Alterações

| Data | Versão | Descrição | Autor |
| :--- | :--- | :--- | :--- |
| 28/08/2025 | 1.0 | Análise brownfield inicial | Mary (Analista) |

-----

## Referência Rápida - Arquivos Chave e Pontos de Entrada

### Arquivos Críticos para Entender o Sistema

  * **Entrada Principal (Backend)**: `backend/app.py`
  * **Rotas da API**: `backend/route.py`
  * **Lógica de Negócios Principal**: `backend/calculos_financeiros.py`
  * **Atualização de Dados**: `backend/atualizar_dados.py`
  * **Agendador de Tarefas**: `backend/scheduler_docker.py`
  * **Entrada Principal (Frontend)**: `frontend/src/App.js`
  * **Gerenciamento de Estado (Frontend)**: `frontend/src/contexts/PortfolioContext.js`
  * **Esquema do Banco de Dados**: `migration/init.sql`

-----

## Arquitetura de Alto Nível

### Resumo Técnico

O ParidadeRisco é uma aplicação full-stack que consiste em um backend de API **Flask** e um frontend **React**. Ele se conecta a um banco de dados **PostgreSQL** para persistência de dados e busca dados financeiros de fontes externas como Yahoo Finance e BCB. A arquitetura é projetada para atualizações de dados automatizadas e análise de portfólio financeiro.

### Pilha de Tecnologia Atual

| Categoria | Tecnologia | Versão | Notas |
| :--- | :--- | :--- | :--- |
| Backend | Flask (Python) | N/D | Framework principal da API |
| Frontend | React.js | N/D | Biblioteca principal da UI |
| Banco de Dados | PostgreSQL | N/D | Armazenamento de dados relacional |
| Visualização | Recharts | N/D | Biblioteca de gráficos para React |
| Agendamento | APScheduler | N/D | Para atualizações de dados automatizadas |
| Fontes de Dados | API do Yahoo Finance, API do BCB | N/D | Para dados de ativos financeiros |

### Verificação da Estrutura do Repositório

  * **Tipo**: Polyrepo (pastas separadas para `backend` e `frontend`).
  * **Gerenciador de Pacotes**: Presumivelmente `pip` (para Python) e `npm`/`yarn` (para React).
  * **Notável**: Estrutura clássica de cliente-servidor.

-----

## Árvore de Código-Fonte e Organização de Módulos

### Estrutura do Projeto (Atual)

```text
paridaderisco/
├── backend/
│   ├── app.py                 # App Flask principal e configuração
│   ├── route.py               # Definições de endpoint da API
│   ├── atualizar_dados.py     # Scripts para buscar dados externos
│   ├── scheduler_docker.py    # Agendador de tarefas para atualizações
│   ├── postgres_adapter.py    # Módulo de conexão com o banco de dados
│   └── calculos_financeiros.py# Lógica de cálculos financeiros
├── frontend/
│   └── src/
│       ├── App.js             # Componente raiz do React
│       ├── components/        # Componentes da UI (gerenciamento de portfólio, etc.)
│       ├── contexts/
│       │   └── PortfolioContext.js # Gerenciamento de estado global
│       └── config/
│           └── api.js         # Configuração da conexão com a API
└── migration/
    └── init.sql               # Esquema inicial do banco de dados
```

### Módulos Chave e Seus Propósitos

  * **`backend/app.py`**: Orquestra a aplicação Flask, conectando rotas, banco de dados e outras configurações.
  * **`frontend/src/App.js`**: Renderiza o painel principal e gerencia a navegação e o layout da UI.
  * **`backend/atualizar_dados.py`**: Contém a lógica crucial para manter os dados financeiros do sistema atualizados.
  * **`backend/calculos_financeiros.py`**: O núcleo da análise do produto, onde métricas como Sharpe, volatilidade e drawdown são calculadas.

-----

## Modelos de Dados e APIs

### Modelos de Dados

O esquema completo do banco de dados está definido em `migration/init.sql`. As tabelas principais incluem:

  * `ativos`: Rastreia os ativos financeiros.
  * `dados_historicos`: Armazena séries temporais de dados para os ativos.
  * `cestas`: Define as cestas de portfólio.
  * `transacoes`: Registra as transações do usuário.

### Especificações da API

  * Os endpoints da API são definidos em `backend/route.py` e expostos através da aplicação Flask.
  * O frontend se conecta a esses endpoints conforme configurado em `frontend/src/config/api.js`.

-----

## Dívida Técnica e Problemas Conhecidos

*(Esta seção requer uma análise de código mais aprofundada. Com base na sua solicitação de refatoração, esta seção deve ser preenchida após uma revisão detalhada do código.)*

### Dívida Técnica Crítica

1.  *A ser determinado...*
2.  *A ser determinado...*

### Soluções Alternativas e "Pegadinhas"

  * *A ser determinado...*

-----

## Pontos de Integração e Dependências Externas

### Serviços Externos

| Serviço | Propósito | Tipo de Integração | Arquivos Chave |
| :--- | :--- | :--- | :--- |
| Yahoo Finance | Obtenção de dados de ações e ETFs | API HTTP | `backend/atualizar_dados.py` |
| Banco Central do Brasil (BCB) | Obtenção de dados do CDI | API HTTP | `backend/atualizar_dados.py` |

### Pontos de Integração Internos

  * **Frontend para Backend**: O frontend React faz chamadas de API para o backend Flask para buscar dados e executar cálculos.
  * **Backend para Banco de Dados**: O backend se comunica com o banco de dados PostgreSQL através do `postgres_adapter.py` para todas as operações CRUD.

-----

## Desenvolvimento e Implantação

*(Esta seção é um espaço reservado e deve ser preenchida com os passos reais do seu projeto.)*

### Configuração de Desenvolvimento Local

1.  *Passos para configurar o ambiente de backend (Python)...*
2.  *Passos para configurar o ambiente de frontend (Node.js)...*
3.  *Passos para configurar o banco de dados PostgreSQL...*

### Processo de Build e Implantação

  * *Comando de Build*: *A ser determinado...*
  * *Implantação*: *A ser determinado...*

-----

## Realidade dos Testes

*(Esta seção é um espaço reservado. Nenhuma informação sobre testes foi fornecida.)*

### Cobertura de Teste Atual

  * Testes Unitários: *A ser determinado...*
  * Testes de Integração: *A ser determinado...*

### Executando Testes

```bash
# A ser determinado...
```