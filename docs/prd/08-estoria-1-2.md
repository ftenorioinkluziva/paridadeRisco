# Estória 1.2: Implementação do Cadastro e Autenticação de Usuários

**Como um usuário,** eu quero poder me cadastrar e fazer login na plataforma, para que eu possa acessar minhas informações de portfólio de forma segura.

### Critérios de Aceitação:
- A API expõe os procedimentos `auth.register` e `auth.login` via tRPC.
- O registro funciona com os campos obrigatórios e armazena a senha com hash.
- O login valida as credenciais e retorna um token JWT.
- Existe um `protectedProcedure` no tRPC que bloqueia o acesso a usuários não autenticados.
