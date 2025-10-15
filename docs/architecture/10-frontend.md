# Arquitetura de Frontend

## Arquitetura de Componentes
### Organização dos Componentes
```
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
```
### Template de Componente
Componentes funcionais React com TypeScript e Tailwind CSS.

## Gerenciamento de Estado
- **TanStack Query (React Query)** para estado do servidor (dados da API).
- **Zustand** para estado global do cliente (UI).

## Arquitetura de Roteamento
Next.js App Router com rotas protegidas para o dashboard.

## Comunicação com a API (Frontend Services)
Cliente tRPC centralizado para comunicação segura com o backend.
