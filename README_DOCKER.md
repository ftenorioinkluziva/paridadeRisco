# 🐳 Docker Setup - Dashboard de Ativos Financeiros

## 🚀 Execução Rápida

```bash
# Executar toda a aplicação
docker-compose up -d

# Ver logs em tempo real
docker-compose logs -f

# Parar tudo
docker-compose down
```

## 📊 Acessos

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:5002/api
- **PostgreSQL**: localhost:5433

## ✅ O que está incluído

### 🎯 **Scheduler Automático Funcionando**
- **08:00 diário**: Atualização completa via Yahoo Finance
- **A cada 2h**: Verificação de saúde dos dados
- ~~09:00-17:00: Preços RTD (DESABILITADO)~~
- ~~Fora horário: Preços RTD (DESABILITADO)~~

### 🔧 **Serviços Docker**
- **backend**: Flask API + Scheduler integrado
- **frontend**: React dashboard
- **postgres**: Banco de dados PostgreSQL 15

## 📈 Status e Monitoramento

```bash
# Ver status dos containers
docker-compose ps

# Status da API
curl http://localhost:5002/api/status

# Status do scheduler
curl http://localhost:5002/api/scheduler/integrated/status

# Executar job manual (teste)
curl -X POST http://localhost:5002/api/scheduler/execute/verificar_saude
```

## ⚙️ Configurações (Opcionais)

### Alterar Horários
Edite as variáveis no `docker-compose.yml`:
```yaml
environment:
  - SCHEDULER_YAHOO_HOUR=9          # Mudar para 09:00
  - SCHEDULER_RTD_COMERCIAL_INTERVAL=15  # A cada 15min
  - SCHEDULER_SAUDE_INTERVAL=60     # Verificação a cada hora
```

### Reabilitar Jobs RTD (se necessário)
```yaml
environment:
  - SCHEDULER_RTD_COMERCIAL_ENABLED=true   # Reabilitar RTD comercial
  - SCHEDULER_RTD_NOTURNO_ENABLED=true     # Reabilitar RTD noturno
```

### Desabilitar outros Jobs
```yaml
environment:
  - SCHEDULER_YAHOO_ENABLED=false        # Desabilitar Yahoo Finance
  - SCHEDULER_SAUDE_ENABLED=false        # Desabilitar verificação saúde
```

### Modo Apenas API (sem scheduler)
```yaml
environment:
  - RUN_MODE=api-only
  - SCHEDULER_ENABLED=false
```

## 🔧 Troubleshooting

### Problema: Backend não sobe
```bash
# Ver logs detalhados
docker-compose logs backend

# Rebuild forçado
docker-compose build --no-cache backend
docker-compose up backend
```

### Problema: Dados não atualizam
```bash
# Verificar se scheduler está rodando
curl http://localhost:5002/api/scheduler/integrated/status

# Forçar atualização manual
curl -X POST http://localhost:5002/api/scheduler/execute/atualizar_dados_yahoo

# Ver saúde dos dados
curl -X POST http://localhost:5002/api/scheduler/execute/verificar_saude
```

### Problema: Conectividade
```bash
# Testar conectividade interna
docker-compose exec backend ping postgres
docker-compose exec backend curl http://localhost:5001/api/status

# Verificar network
docker network ls
```

## 🎯 **Solução do Problema Original**

✅ **Card "Desempenho Comparativo" nunca mais ficará desatualizado!**

O scheduler Docker garante:
- **Atualização diária às 08:00** via Yahoo Finance
- **Verificação de saúde** a cada 2 horas
- Recuperação automática de falhas  
- Zero manutenção manual

---

**Tudo pronto! Execute `docker-compose up -d` e está funcionando! 🎉**