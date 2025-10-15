# Deploy Rápido - Hetzner

## Passo a Passo Resumido

### 1. Verificar Rede Docker do Nginx Proxy Manager

```bash
# No servidor Hetzner via SSH
docker network ls
docker inspect npm-app-1 | grep NetworkMode
```

Se a rede não for `npm_default`, ajuste no `docker-compose.yml`

### 2. Enviar Código para o Servidor

```bash
# Opção A: Git
cd ~ && git clone SEU_REPO

# Opção B: rsync (do seu PC)
rsync -avz --exclude 'node_modules' \
  t3-paridaderisco/ usuario@IP:~/paridaderisco/
```

### 3. Configurar .env

```bash
cd ~/paridaderisco/t3-paridaderisco

# Copiar exemplo
cp .env.production.example .env

# Editar (use nano, vim, ou vi)
nano .env
```

Configurar:
- `DATABASE_URL` - URL do Neon (já configurada)
- `NEXTAUTH_SECRET` - Secret key existente
- `NEXTAUTH_URL` - URL do domínio (ex: `https://paridaderisco.seu-dominio.com`)

### 4. Deploy

```bash
# Dar permissão ao script
chmod +x deploy.sh

# Executar deploy
./deploy.sh
```

### 5. Configurar Nginx Proxy Manager

1. Acesse: `http://SEU_IP:81`
2. Adicione Proxy Host:
   - **Domain:** `paridaderisco.seu-dominio.com`
   - **Forward Host:** `paridaderisco-app`
   - **Forward Port:** `3000`
   - **Websockets:** ✅
   - **SSL:** Configure Let's Encrypt

### 6. Verificar

```bash
# Ver status
docker-compose ps

# Ver logs
docker-compose logs -f app

# Testar
curl http://localhost:3000/api/health
```

## Comandos Essenciais

```bash
# Parar
docker-compose down

# Iniciar
docker-compose up -d

# Reiniciar
docker-compose restart

# Ver logs
docker-compose logs -f app

# Atualizar código e redeploy
git pull && ./deploy.sh
```

## Acesso

**Com Nginx Proxy Manager**: `https://paridaderisco.seu-dominio.com`
**Direto (opcional)**: `http://SEU_IP:3000`
**Health Check**: `http://SEU_IP:3000/api/health`

## Documentação Completa

- **DEPLOY-HETZNER-NPM.md** - Guia completo para Nginx Proxy Manager
- **DEPLOY.md** - Documentação detalhada geral
