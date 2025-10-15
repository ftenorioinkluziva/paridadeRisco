# Guia de Deploy - ParidadeRisco

Este guia explica como fazer deploy da aplicação ParidadeRisco no servidor Hetzner usando Docker.

## Pré-requisitos

1. **Servidor Hetzner com Docker instalado**
   - Docker Engine
   - Docker Compose

2. **Banco de dados PostgreSQL (Neon)**
   - Já configurado e acessível

3. **Código-fonte da aplicação**

## Estrutura dos Arquivos Docker

- `Dockerfile` - Multi-stage build otimizado para Next.js
- `docker-compose.yml` - Orquestração do container
- `.dockerignore` - Arquivos excluídos do build
- `.env` - Variáveis de ambiente (criar baseado no .env.production.example)
- `deploy.sh` - Script automatizado de deploy

## Passos para Deploy

### 1. Preparar o Servidor Hetzner

```bash
# Conectar ao servidor via SSH
ssh seu-usuario@seu-servidor-hetzner.com

# Verificar se Docker está instalado
docker --version
docker-compose --version

# Criar diretório para a aplicação
mkdir -p ~/paridaderisco
cd ~/paridaderisco
```

### 2. Enviar Código para o Servidor

**Opção A: Via Git (Recomendado)**
```bash
# No servidor
git clone https://github.com/seu-usuario/paridaderisco.git
cd paridaderisco/t3-paridaderisco
```

**Opção B: Via SCP**
```bash
# No seu computador local
scp -r t3-paridaderisco seu-usuario@seu-servidor:~/paridaderisco/
```

**Opção C: Via rsync (mais eficiente)**
```bash
# No seu computador local
rsync -avz --exclude 'node_modules' --exclude '.next' \
  t3-paridaderisco/ seu-usuario@seu-servidor:~/paridaderisco/
```

### 3. Configurar Variáveis de Ambiente

```bash
# No servidor, dentro da pasta da aplicação
cd ~/paridaderisco/t3-paridaderisco

# Criar arquivo .env baseado no exemplo
cp .env.production.example .env

# Editar com seus valores
nano .env
```

**Conteúdo do .env:**
```env
# Database
DATABASE_URL="postgresql://neondb_owner:npg_3cDUb2ihLJQG@ep-steep-term-admfsqey-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# NextAuth
NEXTAUTH_SECRET="sua-secret-key-aqui"
NEXTAUTH_URL="http://SEU_IP_SERVIDOR:3000"
```

### 4. Executar o Deploy

**Método 1: Usando o script de deploy (Recomendado)**
```bash
# Dar permissão de execução
chmod +x deploy.sh

# Executar deploy
./deploy.sh
```

**Método 2: Manual**
```bash
# Build da imagem
docker-compose build --no-cache

# Subir containers
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f app
```

### 5. Verificar o Deploy

```bash
# Verificar se o container está rodando
docker-compose ps

# Ver logs em tempo real
docker-compose logs -f app

# Testar a aplicação
curl http://localhost:3000

# Ver uso de recursos
docker stats paridaderisco-app
```

## Comandos Úteis

### Gerenciamento de Containers

```bash
# Parar aplicação
docker-compose down

# Reiniciar aplicação
docker-compose restart

# Ver logs
docker-compose logs -f app

# Acessar terminal do container
docker exec -it paridaderisco-app sh

# Reconstruir e reiniciar
docker-compose up -d --build
```

### Atualizações

```bash
# Puxar código atualizado (se usando Git)
git pull

# Rebuild e redeploy
./deploy.sh

# OU manualmente:
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Monitoramento

```bash
# Ver uso de recursos
docker stats paridaderisco-app

# Ver logs das últimas 100 linhas
docker-compose logs --tail=100 app

# Seguir logs em tempo real
docker-compose logs -f app

# Ver health check
docker inspect paridaderisco-app | grep -A 10 Health
```

### Backup e Limpeza

```bash
# Fazer backup do banco (se necessário)
# O banco está no Neon, então já tem backup automático

# Limpar imagens antigas
docker image prune -f

# Limpar volumes não utilizados
docker volume prune -f

# Limpar tudo (CUIDADO!)
docker system prune -a --volumes
```

## Configuração de Nginx (Proxy Reverso)

Se você quiser usar Nginx como proxy reverso:

```nginx
# /etc/nginx/sites-available/paridaderisco
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Habilitar:
```bash
sudo ln -s /etc/nginx/sites-available/paridaderisco /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL/HTTPS com Certbot

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com

# Renovação automática (já configurada pelo certbot)
sudo certbot renew --dry-run
```

## Troubleshooting

### Container não inicia
```bash
# Ver logs detalhados
docker-compose logs app

# Verificar se a porta 3000 está livre
sudo netstat -tulpn | grep 3000

# Reconstruir do zero
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Erro de conexão com banco
```bash
# Verificar variável DATABASE_URL no .env
cat .env | grep DATABASE_URL

# Testar conexão do container
docker exec -it paridaderisco-app sh
# Dentro do container:
wget -O- http://localhost:3000
```

### Performance lenta
```bash
# Ver uso de recursos
docker stats

# Aumentar recursos do container (editar docker-compose.yml)
# Adicionar:
# deploy:
#   resources:
#     limits:
#       cpus: '2'
#       memory: 2G
```

## Segurança

1. **Firewall**: Configure para permitir apenas portas necessárias
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

2. **Variáveis de Ambiente**: Nunca commite o arquivo `.env` no Git

3. **NEXTAUTH_SECRET**: Use uma secret forte
```bash
openssl rand -base64 32
```

4. **Atualizações**: Mantenha Docker e sistema atualizados
```bash
sudo apt update && sudo apt upgrade -y
```

## Suporte

Para problemas ou dúvidas:
1. Verifique os logs: `docker-compose logs -f app`
2. Verifique a documentação do Next.js
3. Consulte a documentação do Docker

## Checklist de Deploy

- [ ] Docker e Docker Compose instalados
- [ ] Código enviado para o servidor
- [ ] Arquivo .env configurado corretamente
- [ ] DATABASE_URL apontando para Neon
- [ ] NEXTAUTH_SECRET configurado
- [ ] NEXTAUTH_URL com domínio/IP correto
- [ ] Portas liberadas no firewall
- [ ] Deploy executado com sucesso
- [ ] Aplicação acessível via navegador
- [ ] Logs sem erros críticos
- [ ] (Opcional) Nginx configurado
- [ ] (Opcional) SSL configurado
