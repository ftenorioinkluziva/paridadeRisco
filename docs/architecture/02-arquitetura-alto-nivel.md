# Arquitetura de Alto Nível

## Resumo Técnico
A arquitetura será uma aplicação web full-stack moderna e com tipagem segura, implantada em uma plataforma serverless. O Next.js servirá tanto para o frontend em React quanto para as rotas de API do backend. A comunicação entre cliente e servidor será gerenciada pelo tRPC, garantindo segurança de tipos de ponta a ponta. O Prisma atuará como nosso ORM para interagir com o banco de dados PostgreSQL, e o Tailwind CSS será usado para a estilização da interface do usuário.

## Escolha de Plataforma e Infraestrutura
* **Plataforma:** **Vercel** para a implantação do Next.js. É a solução nativa, oferecendo a melhor performance, escalabilidade e integração contínua.
* **Banco de Dados:** Um provedor de **PostgreSQL** gerenciado (como **Supabase** ou Neon), que se integra perfeitamente com o Prisma.
* **Regiões de Implantação:** `sa-east-1` (São Paulo) para minimizar a latência para usuários no Brasil.

## Estrutura do Repositório
* **Estrutura:** **Monorepo**, gerenciado pelas ferramentas do próprio T3 Stack.
* **Organização:** O código do frontend (componentes React) e do backend (rotas de API tRPC) coexistirão dentro da mesma aplicação Next.js, simplificando o desenvolvimento e garantindo a segurança de tipos.

## Diagrama de Arquitetura de Alto Nível
```mermaid
graph TD
    A[Usuário] --> B{Vercel};
    subgraph "Infraestrutura na AWS (sa-east-1)"
        B -- HTTPS --> C[Next.js App];
        C -- tRPC --> D[API Routes (Serverless)];
        D -- Prisma Client --> E[(PostgreSQL DB)];
    end
    style E fill:#336791,stroke:#333,stroke-width:2px,color:#fff
```
