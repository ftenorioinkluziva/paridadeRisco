# Documento de Arquitetura Fullstack ParidadeRisco

## Introdução

Este documento outlines the complete fullstack architecture for ParidadeRisco, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

### Template Inicial ou Projeto Existente
O projeto será baseado no **T3 Stack**. Esta decisão acelera o desenvolvimento inicial, aproveitando uma estrutura de monorepo bem estabelecida com Next.js, TypeScript, tRPC, Prisma e Tailwind CSS pré-configurados, alinhando-se ao objetivo de modernização.

### Log de Alterações
| Data | Versão | Descrição | Autor |
| :--- | :--- | :--- | :--- |
| 29/08/2025 | 1.0 | Versão inicial da arquitetura full-stack TypeScript. | Winston (Arquiteto) |

## Arquitetura de Alto Nível

### Resumo Técnico
A arquitetura será uma aplicação web full-stack moderna e com tipagem segura, implantada em uma plataforma serverless. O Next.js servirá tanto para o frontend em React quanto para as rotas de API do backend. A comunicação entre cliente e servidor será gerenciada pelo tRPC, garantindo segurança de tipos de ponta a ponta. O Prisma atuará como nosso ORM para interagir com o banco de dados PostgreSQL, e o Tailwind CSS será usado para a estilização da interface do usuário.

### Escolha de Plataforma e Infraestrutura
* **Plataforma:** **Vercel** para a implantação do Next.js. É a solução nativa, oferecendo a melhor performance, escalabilidade e integração contínua.
* **Banco de Dados:** Um provedor de **PostgreSQL** gerenciado (como **Supabase** ou Neon), que se integra perfeitamente com o Prisma.
* **Regiões de Implantação:** `sa-east-1` (São Paulo) para minimizar a latência para usuários no Brasil.

### Estrutura do Repositório
* **Estrutura:** **Monorepo**, gerenciado pelas ferramentas do próprio T3 Stack.
* **Organização:** O código do frontend (componentes React) e do backend (rotas de API tRPC) coexistirão dentro da mesma aplicação Next.js, simplificando o desenvolvimento e garantindo a segurança de tipos.

### Diagrama de Arquitetura de Alto Nível
```mermaid
graph TD
    A[Usuário] --> B{Vercel};
    subgraph "Infraestrutura na AWS (sa-east-1)"
        B -- HTTPS --> C[Next.js App];
        C -- tRPC --> D[API Routes (Serverless)];
        D -- Prisma Client --> E[(PostgreSQL DB)];
    end
    style E fill:#336791,stroke:#333,stroke-width:2px,color:#fff
Padrões de Arquitetura
Full-stack com Tipagem Segura: O tRPC elimina a necessidade de gerenciar tipos de API manualmente, prevenindo bugs entre o frontend e o backend.

Serverless-First: As rotas de API do Next.js são implantadas como funções serverless, garantindo escalabilidade automática e otimização de custos.

ORM (Object-Relational Mapping): O Prisma simplifica as operações de banco de dados e fornece segurança de tipos também na camada de dados.

Tech Stack
Tabela da Pilha de Tecnologia
Categoria	Tecnologia	Versão	Propósito	Racional
Linguagem Frontend	TypeScript	5.x	Linguagem primária de desenvolvimento	Tipagem forte, excelente ferramental
Framework Frontend	Next.js / React	14.x	Framework para UI e backend	Renderização no servidor, roteamento, API
Biblioteca de UI	Shadcn/UI	Mais recente	Componentes de UI acessíveis e estilizáveis	Moderno, "copie e cole", sem dependências de UI
Gerenc. de Estado	Zustand / TanStack Query	4.x / 5.x	Gerenciamento de estado global e de servidor	Leve, simples e poderoso para dados de API
Linguagem Backend	TypeScript	5.x	Linguagem primária para a lógica da API	Consistência de linguagem com o frontend
Framework Backend	Next.js	14.x	Rotas de API e lógica de servidor	Unifica o desenvolvimento full-stack
Estilo da API	tRPC	11.x	Comunicação de API com tipagem segura	Elimina a necessidade de gerenciar tipos de API
Banco de Dados	PostgreSQL	16.x	Banco de dados relacional principal	Robusto, confiável e ótimo para dados financeiros
ORM	Prisma	5.x	Camada de acesso ao banco de dados	Tipagem segura, migrações fáceis, ótima DX
Autenticação	NextAuth.js	5.x	Autenticação e gerenciamento de sessão	Padrão da indústria para Next.js, seguro
Teste de Frontend	Jest / React Testing Library	29.x	Testes unitários e de componentes	Padrão do ecossistema React
Teste de Backend	Vitest	1.x	Testes unitários para a lógica da API	Rápido, compatível com a sintaxe do Jest
Estilização	Tailwind CSS	3.x	Framework de CSS utility-first	Rápida prototipagem e design consistente
CI/CD	GitHub Actions	N/A	Automação de build, teste e implantação	Integrado ao repositório GitHub

Exportar para as Planilhas
Modelos de Dados
Schema do Banco de Dados (schema.prisma)
Snippet de código

// 1. Definição dos Enums (Tipos de Dados Customizados)
enum AssetCalculationType {
  PRECO      // Para ativos como Ações, ETFs
  PERCENTUAL // Para ativos como CDI
}
enum TransactionType {
  COMPRA
  VENDA
}

// 2. Definição dos Modelos (Tabelas)
model User {
  id         String      @id @default(cuid())
  name       String
  email      String      @unique
  phone      String
  password   String
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
  
  cestas     Cesta[]
  portfolio  Portfolio?
  transacoes Transacao[]
}

model Portfolio {
  id          String   @id @default(cuid())
  cashBalance Decimal  @db.Decimal(12, 2)
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])
}

model Cesta {
  id         String           @id @default(cuid())
  name       String
  userId     String
  user       User             @relation(fields: [userId], references: [id])
  ativos     AtivosEmCestas[]
}

model Ativo {
  id              String               @id @default(cuid())
  ticker          String               @unique
  name            String
  type            String
  calculationType AssetCalculationType
  dadosHistoricos DadoHistorico[]
  cestas          AtivosEmCestas[]
  transacoes      Transacao[]
}

model AtivosEmCestas {
  cestaId          String
  cesta            Cesta            @relation(fields: [cestaId], references: [id])
  ativoId          String
  ativo            Ativo            @relation(fields: [ativoId], references: [id])
  targetPercentage Decimal          @db.Decimal(5, 2)

  @@id([cestaId, ativoId])
}

model DadoHistorico {
  id               String    @id @default(cuid())
  date             DateTime
  price            Decimal?  @db.Decimal(10, 2)
  percentageChange Decimal?  @db.Decimal(10, 4)
  ativoId          String
  ativo            Ativo     @relation(fields: [ativoId], references: [id])

  @@unique([ativoId, date])
}

model Transacao {
  id            String          @id @default(cuid())
  type          TransactionType
  shares        Decimal         @db.Decimal(18, 8)
  pricePerShare Decimal         @db.Decimal(10, 2)
  date          DateTime
  
  ativoId       String
  ativo         Ativo           @relation(fields: [ativoId], references: [id])
  
  userId        String
  user          User            @relation(fields: [userId], references: [id])
}
Especificação da API (tRPC)
Roteador: auth
Propósito: Gerenciar o registro e a autenticação de usuários.

Procedimentos: register, login.

Roteador: asset
Propósito: Fornecer dados públicos sobre os ativos financeiros.

Procedimentos: list, getById, getHistory.

Roteador: portfolio (Protegido)
Propósito: Gerenciar a carteira de investimentos e as transações do usuário autenticado.

Procedimentos: get, addTransaction, listTransactions, getRebalancePlan.

Roteador: cesta (Protegido)
Propósito: Gerenciar as cestas (modelos de alocação).

Procedimentos: list, getById, create.

Componentes
Lista de Componentes
Frontend (React / Next.js)
Componente de Autenticação (AuthUI)

Painel Principal (DashboardView)

Gerenciador de Portfólio (PortfolioManager)

Gerenciador de Transações (TransactionManager)

Visualizador de Cestas (CestaViewer)

Backend (API tRPC / Next.js)
Serviço de Autenticação (AuthService)

Serviço de Ativos (AssetService)

Serviço de Portfólio (PortfolioService)

Serviço de Cestas (CestaService)

Camada de Dados
Cliente Prisma (ORM)

Serviços Externos
Buscador de Dados Financeiros (FinancialDataFetcher)

Diagrama de Componentes
Snippet de código

graph TD
    subgraph Frontend (Navegador)
        AuthUI
        DashboardView
        PortfolioManager
        TransactionManager
        CestaViewer
    end
    subgraph Backend (Vercel Serverless)
        A[AuthService]
        B[AssetService]
        C[PortfolioService]
        D[CestaService]
        F[FinancialDataFetcher]
    end
    subgraph "Banco de Dados"
        E[(PostgreSQL DB)]
    end
    subgraph "APIs Externas"
        G[Yahoo Finance / BCB]
    end
    AuthUI --> A
    DashboardView --> C
    PortfolioManager --> C
    TransactionManager --> C
    CestaViewer --> D
    A --> |Prisma| E
    B --> |Prisma| E
    C --> |Prisma| E
    D --> |Prisma| E
    F --> |Prisma| E
    F --> G
APIs Externas
A lógica de integração com as APIs do Yahoo Finance e do Banco Central do Brasil será replicada a partir do sistema Python existente. A equipe de desenvolvimento investigará os detalhes técnicos (URLs exatas, limites de taxa) durante a implementação.

Fluxos de Trabalho Principais (Core Workflows)
Fluxo de Trabalho: Autenticação de Usuário
Snippet de código

sequenceDiagram
    participant Usuário
    participant Frontend (React)
    participant Backend (API tRPC)
    participant Prisma Client
    participant DB [(PostgreSQL)]

    Usuário->>Frontend (React): Insere e-mail e senha, clica em Login
    Frontend (React)->>Backend (API tRPC): Chama a mutação `auth.login` com os dados
    Backend (API tRPC)->>Prisma Client: Busca usuário pelo e-mail
    Prisma Client->>DB: SELECT * FROM "User" WHERE email = ...
    DB-->>Prisma Client: Retorna dados do usuário (com senha hasheada)
    Prisma Client-->>Backend (API tRPC): Retorna objeto User
    Backend (API tRPC)->>Backend (API tRPC): Compara o hash da senha enviada com o hash do DB
    alt Credenciais Válidas
        Backend (API tRPC)->>Backend (API tRPC): Gera Token JWT
        Backend (API tRPC)-->>Frontend (React): Retorna o Token JWT
        Frontend (React)->>Usuário: Armazena o token e redireciona para o Dashboard
    else Credenciais Inválidas
        Backend (API tRPC)-->>Frontend (React): Retorna erro de autenticação
        Frontend (React)->>Usuário: Exibe mensagem de erro
    end
Fluxo de Trabalho: Plano de Rebalanceamento
Snippet de código

sequenceDiagram
    participant Usuário
    participant Frontend (React)
    participant Backend (API tRPC)
    participant Prisma Client
    participant DB [(PostgreSQL)]

    Usuário->>Frontend (React): Seleciona uma Cesta (ex: "Risky Parity") e clica em "Rebalancear"
    Frontend (React)->>Backend (API tRPC): Chama a query `portfolio.getRebalancePlan` com o ID da Cesta
    
    Backend (API tRPC)->>Prisma Client: 1. Busca a Cesta alvo e suas alocações (%)
    Prisma Client->>DB: SELECT * FROM "Cesta" WHERE id = ...
    DB-->>Prisma Client: Retorna dados da Cesta
    Prisma Client-->>Backend (API tRPC): Retorna alocações alvo
    
    Backend (API tRPC)->>Prisma Client: 2. Busca o portfólio e todas as transações do usuário
    Prisma Client->>DB: SELECT * FROM "Portfolio" & "Transacao" WHERE userId = ...
    DB-->>Prisma Client: Retorna saldo e transações
    Prisma Client-->>Backend (API tRPC): Retorna dados do portfólio do usuário
    
    Backend (API tRPC)->>Backend (API tRPC): 3. Calcula a carteira atual (valor total e % de cada ativo)
    Backend (API tRPC)->>Backend (API tRPC): 4. Compara a carteira atual com as % da Cesta alvo
    Backend (API tRPC)->>Backend (API tRPC): 5. Gera a lista de recomendações (comprar/vender)
    
    Backend (API tRPC)-->>Frontend (React): Retorna o plano de rebalanceamento
    Frontend (React)->>Usuário: Exibe as sugestões de compra e venda
Arquitetura de Frontend
Arquitetura de Componentes
Organização dos Componentes
Plaintext

src/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   └── layout.tsx
├── components/
│   └── ui/
├── features/
│   ├── portfolio/
│   └── transactions/
├── server/
│   └── api/
└── lib/
Template de Componente
Componentes funcionais React com TypeScript e Tailwind CSS.

Gerenciamento de Estado
TanStack Query (React Query) para estado do servidor (dados da API).

Zustand para estado global do cliente (UI).

Arquitetura de Roteamento
Next.js App Router com rotas protegidas para o dashboard.

Comunicação com a API (Frontend Services)
Cliente tRPC centralizado para comunicação segura com o backend.

Arquitetura de Backend
Arquitetura de Serviço (Serverless)
Backend serverless usando rotas de API do Next.js.

Roteadores tRPC organizados por funcionalidade em src/server/api/routers/.

Arquitetura de Banco de Dados
Schema: schema.prisma é a única fonte de verdade.

Camada de Acesso: Exclusivamente via Prisma Client.

Arquitetura de Autenticação
NextAuth.js para gerenciamento de sessão.

Procedimentos tRPC protegidos (protectedProcedure) para endpoints que exigem login.

Estrutura Unificada do Projeto (Monorepo)
A estrutura seguirá o padrão do T3 Stack, conforme detalhado anteriormente.

Fluxo de Trabalho de Desenvolvimento, Implantação, Segurança, Testes, Padrões de Código e Tratamento de Erros
As diretrizes para estas seções foram definidas e aprovadas, focando em CI/CD via Vercel, segurança com NextAuth e tRPC/Zod, e testes usando a pirâmide de testes com Vitest e React Testing Library.