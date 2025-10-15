# Suposições Técnicas

Estas suposições são extraídas diretamente do `architecture.md` aprovado e servirão como as restrições técnicas para o desenvolvimento.

- **Estrutura do Repositório:** Monorepo, gerenciado com as ferramentas do T3 Stack.
- **Arquitetura de Serviço:** Serverless, utilizando as rotas de API do Next.js implantadas na Vercel.
- **Requisitos de Teste:** Seguir a abordagem da Pirâmide de Testes, com testes unitários (Vitest/RTL), testes de integração (tRPC) e testes E2E (Playwright/Cypress) para os fluxos críticos.

## Suposições Técnicas Adicionais:
- **Frontend:** Next.js 14 / React.
- **Backend:** API tRPC dentro do Next.js.
- **Banco de Dados:** PostgreSQL com Prisma ORM.
- **Autenticação:** NextAuth.js.
- **Estilização:** Tailwind CSS com Shadcn/UI.
