# Requisitos

## Funcionais
- **FR1:** O sistema deve fornecer uma interface para que novos usuários possam se cadastrar na plataforma.
- **FR2:** O formulário de cadastro deve exigir os campos "Nome", "E-mail" e "Telefone" como obrigatórios.
- **FR3:** O sistema deve permitir que usuários cadastrados se autentiquem usando seu e-mail e uma senha.
- **FR4:** Após o login bem-sucedido, o usuário deve ser redirecionado para o seu painel principal (dashboard).

## Não Funcionais
- **NFR1 (Segurança):** As senhas dos usuários devem ser armazenadas de forma segura no banco de dados, utilizando um algoritmo de hash forte com salt (conforme implementado pelo NextAuth.js e Prisma).
- **NFR2 (Segurança):** A senha do usuário deve ter no mínimo 8 caracteres.
- **NFR3 (Segurança):** A comunicação entre o cliente e o servidor durante o login e o cadastro deve ser criptografada via HTTPS.
- **NFR4 (Desempenho):** O processo de login (desde o envio das credenciais até o redirecionamento) deve ser concluído em menos de 1 segundo.
