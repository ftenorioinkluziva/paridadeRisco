# Deploy no Hetzner com Nginx Proxy Manager

Guia específico para deploy no seu servidor Hetzner que já possui Nginx Proxy Manager rodando.

## Infraestrutura Atual Detectada

```
✅ Nginx Proxy Manager (npm-app-1) - Portas 80, 81, 443
✅ n8n (n8n-n8n-1) - Porta 5678
```

## Passo 1: Verificar Rede do Docker

Primeiro, precisamos descobrir o nome exato da rede do seu Nginx Proxy Manager:

```bash
# No servidor Hetzner
docker network ls
```

Procure pela rede que o container `npm-app-1` está usando. Geralmente é algo como:
- `npm_default`
- `nginx-proxy-manager_default`
- Ou outra rede customizada

Para confirmar:
```bash
docker inspect npm-app-1 | grep NetworkMode
# OU
docker inspect npm-app-1 --format='{{json .NetworkSettings.Networks}}' | jq
```

## Passo 2: Ajustar docker-compose.yml (se necessário)

Se a rede não for `npm_default`, edite o arquivo `docker-compose.yml`:

```yaml
networks:
  npm_default:  # <- Substitua pelo nome real da rede
    external: true
```

Exemplo se a rede for `nginx-proxy-manager_default`:
```yaml
networks:
  paridaderisco-network:
    driver: bridge
  nginx-proxy-manager_default:  # Nome real da rede
    external: true
```

## Passo 3: Enviar Código para o Servidor

### Opção A: Git (Recomendado)
```bash
# No servidor
cd ~
git clone https://github.com/ftenorioinkluziva/paridadeRisco.git
cd paridaderisco/t3-paridaderisco
```

### Opção B: rsync do seu computador local
```bash
# No seu computador (Windows/WSL ou Git Bash)
rsync -avz --exclude 'node_modules' --exclude '.next' \
  /c/projetos/paridadeRisco/t3-paridaderisco/ \
  usuario@SEU_IP_HETZNER:~/paridaderisco/
```

## Passo 4: Configurar Variáveis de Ambiente

```bash
# No servidor
cd ~/paridaderisco/t3-paridaderisco

# Copiar template
cp .env.production.example .env

# Editar
nano .env
```

**Configure o .env:**
```env
# Database (já configurado - Neon)
DATABASE_URL="postgresql://neondb_owner:npg_3cDUb2ihLJQG@ep-steep-term-admfsqey-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# NextAuth Secret (pode manter o mesmo ou gerar novo)
NEXTAUTH_SECRET="a3f5c7d9e3b4f8a1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7"

# IMPORTANTE: Configure com seu domínio ou IP
NEXTAUTH_URL="https://paridaderisco.seu-dominio.com"
# OU temporariamente:
# NEXTAUTH_URL="http://IP_DO_SERVIDOR:3000"
```

## Passo 5: Fazer Deploy

```bash
# Dar permissão ao script
chmod +x deploy.sh

# Executar deploy
./deploy.sh
```

**OU manualmente:**
```bash
docker compose build --no-cache
docker compose up -d
```

## Passo 6: Verificar Container

```bash
# Ver todos os containers
docker ps

# Deve aparecer:
# - paridaderisco-app (porta 3000)
# - npm-app-1 (portas 80, 81, 443)
# - n8n-n8n-1 (porta 5678)

# Ver logs
docker-compose logs -f app

# Testar health check
curl http://localhost:3000/api/health
```

## Passo 7: Configurar Proxy no Nginx Proxy Manager

1. **Acessar Nginx Proxy Manager**
   - Abra: `http://SEU_IP:81`
   - Login padrão (se ainda não mudou):
     - Email: `admin@example.com`
     - Senha: `changeme`

2. **Adicionar Proxy Host**
   - Clique em "Proxy Hosts" → "Add Proxy Host"

3. **Configuração do Proxy:**

   **Aba "Details":**
   - **Domain Names:** `paridaderisco.seu-dominio.com` (ou subdomínio)
   - **Scheme:** `http`
   - **Forward Hostname / IP:** `paridaderisco-app` (nome do container)
   - **Forward Port:** `3000`
   - **Cache Assets:** ✅ (opcional)
   - **Block Common Exploits:** ✅
   - **Websockets Support:** ✅ (importante para Next.js)

   **Aba "SSL":**
   - **SSL Certificate:** Selecione ou crie novo com Let's Encrypt
   - **Force SSL:** ✅
   - **HTTP/2 Support:** ✅
   - **HSTS Enabled:** ✅ (recomendado)

4. **Salvar**

## Passo 8: Configurar DNS

No seu provedor de DNS (Cloudflare, etc):

```
Tipo: A
Nome: paridaderisco (ou @)
Conteúdo: IP_DO_SERVIDOR_HETZNER
TTL: Auto
Proxy: Desativado (ícone cinza)
```

## Passo 9: Testar

```bash
# Verificar se o proxy está funcionando
curl -I https://paridaderisco.seu-dominio.com

# Deve retornar 200 OK
```

Acesse no navegador: `https://paridaderisco.seu-dominio.com`

## Estrutura de Rede Final

```
Internet
    ↓
[Hetzner Server]
    ↓
nginx-proxy-manager (npm-app-1)
    ↓ (proxy reverso)
paridaderisco-app:3000
    ↓
Neon PostgreSQL (cloud)
```

## Comandos Úteis

### Gerenciamento da Aplicação
```bash
# Ver logs
docker-compose logs -f app

# Reiniciar
docker-compose restart

# Parar
docker-compose down

# Atualizar
git pull && ./deploy.sh
```

### Debug de Rede
```bash
# Ver redes Docker
docker network ls

# Ver containers em uma rede
docker network inspect npm_default

# Verificar se containers estão na mesma rede
docker inspect paridaderisco-app | grep Networks -A 10
docker inspect npm-app-1 | grep Networks -A 10
```

## Troubleshooting

### Erro 502 Bad Gateway no Nginx Proxy Manager

**Causa:** Container não está acessível ou nome incorreto

**Solução:**
```bash
# Verificar se containers estão na mesma rede
docker network inspect npm_default | grep paridaderisco

# Se não aparecer, verificar nome da rede no docker-compose.yml
# Ou adicionar manualmente:
docker network connect npm_default paridaderisco-app
```

### Erro de NEXTAUTH_URL

**Causa:** URL incorreta no .env

**Solução:**
```bash
# Editar .env
nano .env

# Mudar para:
NEXTAUTH_URL="https://paridaderisco.seu-dominio.com"

# Reiniciar container
docker-compose restart
```

### Container não inicia

```bash
# Ver logs detalhados
docker-compose logs app

# Reconstruir
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### SSL não funciona

1. Verificar se portas 80 e 443 estão abertas:
```bash
sudo ufw status
```

2. Verificar se DNS está apontando corretamente:
```bash
nslookup paridaderisco.seu-dominio.com
```

3. Tentar gerar certificado novamente no Nginx Proxy Manager

## Acesso Direto (Opcional)

Se manteve a porta 3000 exposta, pode acessar diretamente:
- `http://IP_DO_SERVIDOR:3000`

**Para remover acesso direto** (mais seguro), edite `docker-compose.yml`:
```yaml
# Remova a seção:
# ports:
#   - "3000:3000"

# Mantenha apenas:
expose:
  - "3000"
```

Depois:
```bash
docker-compose down
docker-compose up -d
```

## Segurança

1. **Firewall:** Apenas portas 80, 443 e 22 (SSH) devem estar abertas
```bash
sudo ufw status
```

2. **Nginx Proxy Manager:** Mude a senha padrão
   - Acesse em `http://IP:81`
   - Vá em "Users" → Editar Admin

3. **Variáveis de Ambiente:** Nunca commite `.env` no Git

## Monitoramento

```bash
# Ver uso de recursos
docker stats

# Ver todos os containers
docker ps -a

# Health check da aplicação
curl http://localhost:3000/api/health
```

## Checklist de Deploy ✅

- [ ] Código enviado para o servidor
- [ ] Rede Docker verificada e configurada
- [ ] Arquivo `.env` criado e configurado
- [ ] Deploy executado com sucesso
- [ ] Container rodando (`docker ps`)
- [ ] Health check OK (`curl http://localhost:3000/api/health`)
- [ ] Proxy Host criado no Nginx Proxy Manager
- [ ] DNS configurado
- [ ] SSL configurado
- [ ] Aplicação acessível via HTTPS
- [ ] NEXTAUTH_URL atualizado para domínio final

## Próximos Passos

1. Testar todas as funcionalidades da aplicação
2. Configurar backup automático (Neon já faz isso)
3. Configurar monitoramento (Uptime Kuma, etc)
4. Documentar acessos e credenciais

---

**Suporte:** Para ver logs ou debug, use `docker-compose logs -f app`
