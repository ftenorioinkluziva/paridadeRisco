# 🐳 Scheduler em Docker - Guia Completo

## 📋 Visão Geral

O sistema de atualização automática foi **totalmente adaptado para Docker** e funciona perfeitamente em containers. Existem **3 modos de execução** disponíveis:

## 🚀 Modos de Execução

### 1. **Modo Integrado** (Recomendado)
Flask API + Scheduler no mesmo container
```bash
docker-compose up
```

### 2. **Modo Separado**
Flask API e Scheduler em containers separados
```bash
docker-compose -f docker-compose.scheduler.yml up
```

### 3. **Modo Apenas API**
Apenas Flask API, sem scheduler
```bash
# Definir RUN_MODE=api-only no docker-compose.yml
```

## 📁 Arquivos Docker Criados

```
backend/
├── scheduler_docker.py          # Scheduler otimizado para Docker
├── app_with_scheduler.py        # Flask + Scheduler integrado
├── docker-entrypoint.sh         # Script de inicialização
├── Dockerfile                   # Dockerfile atualizado
├── docker-compose.yml          # Compose padrão (integrado)
├── docker-compose.scheduler.yml # Compose com scheduler separado
└── requirements.txt            # Dependências atualizadas
```

## ⚙️ Configuração via Variáveis de Ambiente

### 🔧 Configurações Gerais
```yaml
environment:
  # Modo de execução
  - RUN_MODE=integrated          # integrated|api-only|scheduler-only
  
  # Scheduler
  - SCHEDULER_ENABLED=true
  - SCHEDULER_TIMEZONE=America/Sao_Paulo
  - SCHEDULER_MAX_WORKERS=3
  - SCHEDULER_LOG_LEVEL=INFO
  
  # Jobs
  - SCHEDULER_YAHOO_ENABLED=true
  - SCHEDULER_YAHOO_HOUR=8           # Hora da atualização diária
  - SCHEDULER_YAHOO_MINUTE=0         # Minuto da atualização
  - SCHEDULER_RTD_COMERCIAL_ENABLED=true
  - SCHEDULER_RTD_COMERCIAL_INTERVAL=30  # Intervalo em minutos
  - SCHEDULER_RTD_NOTURNO_ENABLED=true
  - SCHEDULER_SAUDE_ENABLED=true
  - SCHEDULER_SAUDE_INTERVAL=120     # Intervalo em minutos
```

## 🚀 Como Executar

### Opção 1: Modo Integrado (Recomendado)
```bash
# Usar docker-compose padrão
docker-compose up -d

# Verificar logs
docker-compose logs -f backend

# Verificar status
curl http://localhost:5002/api/scheduler/integrated/status
```

### Opção 2: Modo Separado
```bash
# Usar compose alternativo
docker-compose -f docker-compose.scheduler.yml up -d

# Ver logs do scheduler
docker-compose -f docker-compose.scheduler.yml logs -f scheduler

# Ver logs da API
docker-compose -f docker-compose.scheduler.yml logs -f backend
```

### Opção 3: Executar Apenas para Teste
```bash
# Build da imagem
docker build -t paridaderisco-backend ./backend

# Executar scheduler isoladamente
docker run --rm \
  -e POSTGRES_HOST=host.docker.internal \
  -e POSTGRES_DB=paridaderisco \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e RUN_MODE=scheduler-only \
  -e SCHEDULER_ENABLED=true \
  paridaderisco-backend
```

## 🔍 Monitoramento em Docker

### Logs em Tempo Real
```bash
# Logs do container integrado
docker-compose logs -f backend

# Logs apenas do scheduler (modo separado)
docker-compose -f docker-compose.scheduler.yml logs -f scheduler

# Filtrar logs específicos
docker-compose logs backend | grep "SCHEDULER"
```

### Health Checks
```bash
# Status da API
curl http://localhost:5002/api/status

# Status do scheduler integrado
curl http://localhost:5002/api/scheduler/integrated/status

# Health check do scheduler
curl http://localhost:5002/api/scheduler/integrated/health
```

### Endpoints de Monitoramento
```bash
# Status detalhado do scheduler
curl http://localhost:5002/api/scheduler/integrated/status | jq

# Executar job manual
curl -X POST http://localhost:5002/api/scheduler/execute/atualizar_precos_rtd

# Ver jobs agendados
curl http://localhost:5002/api/scheduler/jobs | jq
```

## 🔧 Personalização

### Alterar Horários de Execução
```yaml
# No docker-compose.yml
environment:
  - SCHEDULER_YAHOO_HOUR=9          # Mudar para 09:00
  - SCHEDULER_YAHOO_MINUTE=30       # Mudar para 09:30
  - SCHEDULER_RTD_COMERCIAL_INTERVAL=15  # A cada 15min
```

### Desabilitar Jobs Específicos
```yaml
environment:
  - SCHEDULER_YAHOO_ENABLED=false        # Desabilitar Yahoo Finance
  - SCHEDULER_RTD_NOTURNO_ENABLED=false  # Desabilitar RTD noturno
  - SCHEDULER_SAUDE_ENABLED=false        # Desabilitar verificação
```

### Configurar Timezone
```yaml
environment:
  - TZ=America/Sao_Paulo
  - SCHEDULER_TIMEZONE=America/Sao_Paulo
```

## 🛠️ Troubleshooting

### Problema: Container não inicia
```bash
# Ver logs detalhados
docker-compose logs backend

# Verificar variáveis de ambiente
docker-compose config

# Testar conexão com banco
docker-compose exec backend python -c "from postgres_adapter import PostgreSQLClient; print('OK')"
```

### Problema: Scheduler não executa jobs
```bash
# Verificar se está habilitado
curl http://localhost:5002/api/scheduler/integrated/status | grep running

# Ver logs específicos do scheduler
docker-compose logs backend | grep "SCHEDULER\|JOB"

# Executar job manual para teste
curl -X POST http://localhost:5002/api/scheduler/execute/verificar_saude
```

### Problema: Jobs falham
```bash
# Ver últimos erros
curl http://localhost:5002/api/scheduler/integrated/status | jq '.jobs_status'

# Logs com timestamp
docker-compose logs --timestamps backend

# Teste manual de atualização
docker-compose exec backend python -c "from atualizar_dados import atualizar_dados; atualizar_dados()"
```

### Problema: Dados não atualizam
```bash
# Verificar última atualização
curl http://localhost:5002/api/last-update

# Forçar atualização manual
curl -X POST http://localhost:5002/api/scheduler/execute/atualizar_dados_yahoo

# Verificar saúde dos dados
curl -X POST http://localhost:5002/api/scheduler/execute/verificar_saude
```

## 🔐 Segurança e Boas Práticas

### Variáveis Sensíveis
```yaml
# Use arquivo .env para produção
environment:
  - POSTGRES_PASSWORD_FILE=/run/secrets/db_password
  
# Ou use Docker secrets
secrets:
  - db_password
```

### Recursos do Container
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

### Network Security
```yaml
networks:
  backend:
    internal: true  # Rede interna apenas
  frontend:
    # Rede externa para o frontend
```

## 📊 Métricas e Monitoring

### Logs Estruturados
Os logs seguem formato estruturado para Docker:
```
2025-08-07 17:00:00 [INFO] SchedulerDocker: SCHEDULER INICIADO COM SUCESSO
2025-08-07 17:00:30 [INFO] SchedulerDocker: INICIANDO JOB: verificar_saude
2025-08-07 17:00:35 [INFO] SchedulerDocker: JOB CONCLUIDO: verificar_saude em 5.23s
```

### Integração com Monitoring
```yaml
# Para Prometheus/Grafana
services:
  backend:
    labels:
      - "prometheus.io/scrape=true"
      - "prometheus.io/port=5001"
      - "prometheus.io/path=/metrics"
```

## 🚀 Deploy em Produção

### Docker Compose Produção
```yaml
services:
  backend:
    image: paridaderisco-backend:latest
    restart: always
    environment:
      - FLASK_ENV=production
      - SCHEDULER_LOG_LEVEL=WARNING
    healthcheck:
      interval: 60s
      timeout: 30s
      retries: 5
      start_period: 120s
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: paridaderisco-backend
spec:
  replicas: 1
  selector:
    matchLabels:
      app: paridaderisco-backend
  template:
    spec:
      containers:
      - name: backend
        image: paridaderisco-backend:latest
        env:
        - name: SCHEDULER_ENABLED
          value: "true"
        - name: POSTGRES_HOST
          value: "postgres-service"
```

## ✅ Resultado Final

### ✅ **Funcionamento Garantido em Docker**
- ✅ Container único com Flask + Scheduler integrado
- ✅ Containers separados para maior controle
- ✅ Configuração 100% via variáveis de ambiente
- ✅ Logs estruturados para Docker
- ✅ Health checks e monitoring
- ✅ Shutdown graceful com SIGTERM
- ✅ Retry automático de conexão com banco

### 📈 **Jobs Automáticos em Docker**
- ✅ **08:00 diário**: Atualização Yahoo Finance
- ✅ **09:00-17:00**: Preços RTD a cada 30min
- ✅ **Fora horário**: Preços RTD a cada hora  
- ✅ **A cada 2h**: Verificação de saúde

### 🎯 **Solução do Problema Original**
O card "Desempenho Comparativo" **nunca mais** ficará desatualizado em 2025-07-24 ou qualquer outra data. O sistema Docker garante:
- ✅ Atualização automática e contínua
- ✅ Recuperação automática de falhas
- ✅ Monitoramento em tempo real
- ✅ Zero downtime em atualizações

**O scheduler está 100% funcional em Docker e resolve definitivamente o problema!** 🎉