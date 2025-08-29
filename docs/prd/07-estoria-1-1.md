# Estória 1.1: Configuração da Fundação do Monorepo e Banco de Dados

**Como um desenvolvedor,** eu quero configurar a estrutura do projeto usando o T3 Stack e migrar o schema do banco de dados para o Prisma, para que tenhamos uma base de código unificada e uma camada de dados com tipagem segura.

### Critérios de Aceitação:
- O projeto é inicializado usando o T3 Stack.
- O `schema.prisma` contém todos os modelos de dados que definimos.
- O comando `prisma migrate dev` é executado com sucesso, criando as tabelas no banco de dados.
