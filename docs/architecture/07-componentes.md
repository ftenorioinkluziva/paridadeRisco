# Componentes

## Lista de Componentes

### Frontend (React / Next.js)
- Componente de Autenticação (AuthUI)
- Painel Principal (DashboardView)
- Gerenciador de Portfólio (PortfolioManager)
- Gerenciador de Transações (TransactionManager)
- Visualizador de Cestas (CestaViewer)

### Backend (API tRPC / Next.js)
- Serviço de Autenticação (AuthService)
- Serviço de Ativos (AssetService)
- Serviço de Portfólio (PortfolioService)
- Serviço de Cestas (CestaService)

### Camada de Dados
- Cliente Prisma (ORM)

### Serviços Externos
- Buscador de Dados Financeiros (FinancialDataFetcher)

## Diagrama de Componentes
```mermaid
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
```
