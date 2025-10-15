Documento de Requisitos do Produto (PRD) do ParidadeRisco
Metas e Contexto de Fundo
Metas
Aumentar a velocidade de desenvolvimento de novas funcionalidades.

Melhorar a manutenibilidade e a escalabilidade do código a longo prazo.

Unificar a pilha de tecnologia para otimizar a produtividade do desenvolvedor.

Contexto de Fundo
Estamos migrando de uma pilha de tecnologias dividida (Python/Flask no backend, React no frontend) para um monorepo TypeScript unificado. O objetivo é melhorar a consistência do projeto, garantir a segurança de tipos de ponta a ponta (end-to-end type safety) e aumentar a produtividade geral do desenvolvedor.

Log de Alterações
Data	Versão	Descrição	Autor
29/08/2025	1.0	Rascunho inicial do PRD para a nova arquitetura TypeScript.	John (GP)

Exportar para as Planilhas
Requisitos
Funcionais
FR1: O sistema deve fornecer uma interface para que novos usuários possam se cadastrar na plataforma.

FR2: O formulário de cadastro deve exigir os campos "Nome", "E-mail" e "Telefone" como obrigatórios.

FR3: O sistema deve permitir que usuários cadastrados se autentiquem usando seu e-mail e uma senha.

FR4: Após o login bem-sucedido, o usuário deve ser redirecionado para o seu painel principal (dashboard).

Não Funcionais
NFR1 (Segurança): As senhas dos usuários devem ser armazenadas de forma segura no banco de dados, utilizando um algoritmo de hash forte com salt (conforme implementado pelo NextAuth.js e Prisma).

NFR2 (Segurança): A senha do usuário deve ter no mínimo 8 caracteres.

NFR3 (Segurança): A comunicação entre o cliente e o servidor durante o login e o cadastro deve ser criptografada via HTTPS.

NFR4 (Desempenho): O processo de login (desde o envio das credenciais até o redirecionamento) deve ser concluído em menos de 1 segundo.

Objetivos de Design da Interface do Usuário
Visão Geral da UX: Modernizar completamente a interface do usuário, substituindo a implementação existente por uma nova baseada nas práticas mais recentes do React. O objetivo é criar uma experiência mais limpa, rápida e intuitiva, mantendo 100% da paridade funcional.

Telas Principais: Todas as telas existentes serão reconstruídas, incluindo, mas não se limitando a: Login, Cadastro, Painel Principal, Gerenciamento de Portfólio, Composição de Cestas e Rastreamento de Transações.

Acessibilidade: A nova interface deve seguir os padrões modernos de acessibilidade (WCAG AA).

Plataformas Alvo: A aplicação será responsiva, projetada para funcionar de forma otimizada em desktops e dispositivos móveis.

Suposições Técnicas
Estas suposições são extraídas diretamente do architecture.md aprovado e servirão como as restrições técnicas para o desenvolvimento.

Estrutura do Repositório: Monorepo, gerenciado com as ferramentas do T3 Stack.

Arquitetura de Serviço: Serverless, utilizando as rotas de API do Next.js implantadas na Vercel.

Requisitos de Teste: Seguir a abordagem da Pirâmide de Testes, com testes unitários (Vitest/RTL), testes de integração (tRPC) e testes E2E (Playwright/Cypress) para os fluxos críticos.

Suposições Técnicas Adicionais:

Frontend: Next.js 14 / React.

Backend: API tRPC dentro do Next.js.

Banco de Dados: PostgreSQL com Prisma ORM.

Autenticação: NextAuth.js.

Estilização: Tailwind CSS com Shadcn/UI.

Lista de Épicos
Épico 1: Modernização Full-Stack e Melhoria de Funcionalidades

Meta do Épico: Migrar o projeto para um monorepo TypeScript, reescrever o backend com Next.js/tRPC/Prisma, implementar um sistema de autenticação robusto, reimplementar a lógica de negócio principal e modernizar completamente a interface do usuário, criando uma base sólida e de alta performance.

Detalhes do Épico 1
Estória 1.1: Configuração da Fundação do Monorepo e Banco de Dados
Como um desenvolvedor, eu quero configurar a estrutura do projeto usando o T3 Stack e migrar o schema do banco de dados para o Prisma, para que tenhamos uma base de código unificada e uma camada de dados com tipagem segura.

Critérios de Aceitação:

O projeto é inicializado usando o T3 Stack.

O schema.prisma contém todos os modelos de dados que definimos.

O comando prisma migrate dev é executado com sucesso, criando as tabelas no banco de dados.

Estória 1.2: Implementação do Cadastro e Autenticação de Usuários
Como um usuário, eu quero poder me cadastrar e fazer login na plataforma, para que eu possa acessar minhas informações de portfólio de forma segura.

Critérios de Aceitação:

A API expõe os procedimentos auth.register e auth.login via tRPC.

O registro funciona com os campos obrigatórios e armazena a senha com hash.

O login valida as credenciais e retorna um token JWT.

Existe um protectedProcedure no tRPC que bloqueia o acesso a usuários não autenticados.

Estória 1.3: Reimplementação da Lógica de Negócio (Ativos e Portfólio)
Como um desenvolvedor, eu quero reimplementar os serviços de backend para ativos e portfólio em TypeScript, para que a aplicação possa gerenciar os dados financeiros conforme as regras de negócio.

Critérios de Aceitação:

A API expõe os roteadores asset, portfolio e cesta com todos os procedimentos definidos na arquitetura.

O serviço FinancialDataFetcher é reimplementado para buscar dados das APIs externas e salvá-los no banco de dados.

O procedimento portfolio.getRebalancePlan calcula corretamente as sugestões de compra/venda.

Estória 1.4: Modernização da Interface do Usuário (UI)
Como um usuário, eu quero interagir com uma interface moderna, rápida e responsiva, para que eu tenha uma experiência de usuário aprimorada ao gerenciar meu portfólio.

Critérios de Aceitação:

Todas as telas existentes (Login, Dashboard, Portfólio, etc.) são reconstruídas com a nova pilha de tecnologia de frontend (Shadcn/UI, Tailwind CSS).

A nova UI se conecta com sucesso à nova API tRPC para todas as operações de dados.

A paridade funcional total com a aplicação antiga é mantida.