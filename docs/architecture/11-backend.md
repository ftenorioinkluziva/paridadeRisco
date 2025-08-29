# Arquitetura de Backend

## Arquitetura de Serviço (Serverless)
- Backend serverless usando rotas de API do Next.js.
- Roteadores tRPC organizados por funcionalidade em `src/server/api/routers/`.

## Arquitetura de Banco de Dados
- **Schema:** `schema.prisma` é a única fonte de verdade.
- **Camada de Acesso:** Exclusivamente via Prisma Client.

## Arquitetura de Autenticação
- NextAuth.js para gerenciamento de sessão.
- Procedimentos tRPC protegidos (`protectedProcedure`) para endpoints que exigem login.
