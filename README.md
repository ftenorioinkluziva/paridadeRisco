# ParidadeRisco

Este repositório contém a aplicação de backend em Flask e o frontend em React.

## Configuração das variáveis de ambiente

Crie um arquivo `.env` na raiz do repositório com as seguintes variáveis (veja `.env.example`):

```
SUPABASE_URL=seu_url_supabase
SUPABASE_KEY=sua_chave_supabase
# Opcional para `atualizar_precos.py`
RTD_API_URL=url_da_api_rtd
```

As aplicações do diretório `backend` carregam essas variáveis automaticamente com `python-dotenv`.

## Executando com Docker Compose

Copie o `.env.example` para `.env` e preencha os valores. Em seguida execute:

```
docker-compose up --build
```

