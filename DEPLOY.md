# Deploy para Produção - Hetzner

## Pré-requisitos

1. Servidor Hetzner com Docker e Docker Compose instalados
2. Banco PostgreSQL configurado (pode ser na própria Hetzner ou serviço externo)
3. Domínio apontando para o servidor

## Configuração

### 1. Configurar variáveis de ambiente

Edite o arquivo `.env.production` com suas configurações:

```bash
# Database - substitua pelos dados do seu PostgreSQL na Hetzner
POSTGRES_HOST=seu_host_postgres
POSTGRES_DB=paridaderisco_prod
POSTGRES_USER=seu_usuario
POSTGRES_PASSWORD=sua_senha_segura

# Frontend - substitua pelo seu domínio
REACT_APP_API_URL=https://seu-dominio.com/api

# Security
SECRET_KEY=gere_uma_chave_secreta_forte
```

### 2. Executar migração do banco

Antes do primeiro deploy:

```bash
# Executar scripts de migração no servidor de produção
python migration/migrate.py
```

### 3. Deploy

```bash
# Dar permissão de execução
chmod +x deploy.sh

# Executar deploy
./deploy.sh
```

## Estrutura dos arquivos criados

- `.env.production` - Variáveis de ambiente de produção
- `docker-compose.prod.yml` - Configuração Docker para produção
- `deploy.sh` - Script automatizado de deploy
- `nginx.conf` - Configuração do proxy reverso (opcional)

## Monitoramento

Verificar status:
```bash
docker-compose -f docker-compose.prod.yml ps
```

Ver logs:
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

## Considerações de Segurança

1. Use HTTPS em produção (configure SSL no nginx)
2. Configure firewall no servidor
3. Use senhas fortes para banco de dados
4. Configure backup automático do banco
5. Monitore logs de erro

## Backup

Configure backup automático do banco PostgreSQL:
```bash
# Exemplo de script de backup
pg_dump -h $POSTGRES_HOST -U $POSTGRES_USER $POSTGRES_DB > backup_$(date +%Y%m%d_%H%M%S).sql
```