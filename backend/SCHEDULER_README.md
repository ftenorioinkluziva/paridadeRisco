# Sistema de Atualização Automática de Dados

## 📋 Visão Geral

Este sistema implementa um processo automático de atualização dos dados financeiros usando **APScheduler**. Ele resolve o problema dos dados pararem em 2025-07-24 no card "Desempenho Comparativo" através de atualizações automáticas e monitoradas.

## 🚀 Funcionalidades

### ✅ Jobs Automáticos Configurados

1. **Atualização Diária Yahoo Finance** (`08:00`)
   - Busca dados históricos completos via Yahoo Finance
   - Executa apenas em dias úteis
   - Duração: ~30 minutos

2. **Atualização de Preços RTD** (Horário comercial: `09:00-17:00`, a cada 30min)
   - Atualiza preços em tempo real via API RTD
   - Execução rápida (~5 minutos)
   - Apenas durante dias úteis

3. **Atualização de Preços RTD** (Fora horário comercial: a cada hora)
   - Mantém dados atualizados fora do horário de negociação
   - Inclui fins de semana com frequência reduzida

4. **Verificação de Saúde** (A cada 2 horas)
   - Monitora se os dados estão atualizados
   - Alerta quando há mais de 3 dias sem atualização
   - Gera relatórios de status

## 📁 Arquivos Criados

```
backend/
├── scheduler_atualizacao.py    # Script principal do scheduler
├── scheduler_config.json       # Configurações detalhadas
├── run_scheduler.py           # Script simplificado para execução
├── run_scheduler.bat          # Script para Windows
└── SCHEDULER_README.md        # Esta documentação
```

## 🔧 Como Usar

### Opção 1: Executar via Script Simplificado

```bash
# Linux/Mac
python run_scheduler.py

# Windows
run_scheduler.bat
```

### Opção 2: Controlar via API

```bash
# Iniciar scheduler
curl -X POST http://localhost:5002/api/scheduler/start

# Verificar status
curl http://localhost:5002/api/scheduler/status

# Executar job manual
curl -X POST http://localhost:5002/api/scheduler/execute/atualizar_precos_rtd

# Ver logs
curl http://localhost:5002/api/scheduler/logs?lines=50

# Parar scheduler
curl -X POST http://localhost:5002/api/scheduler/stop
```

### Opção 3: Executar Manualmente no Python

```python
from scheduler_atualizacao import SchedulerDados

# Criar e iniciar
scheduler = SchedulerDados()
scheduler.start()

# Executar job manual
scheduler.executar_job_manual('atualizar_dados_yahoo')

# Verificar status
status = scheduler.get_status()
print(status)

# Parar
scheduler.stop()
```

## 🛠️ Dependências

Instale as dependências necessárias:

```bash
pip install APScheduler yfinance bcb python-bcb
```

## 📊 Endpoints da API

### Status e Controle
- `GET /api/scheduler/status` - Status detalhado do scheduler
- `POST /api/scheduler/start` - Iniciar scheduler
- `POST /api/scheduler/stop` - Parar scheduler
- `POST /api/scheduler/restart` - Reiniciar scheduler

### Jobs
- `GET /api/scheduler/jobs` - Listar todos os jobs agendados
- `POST /api/scheduler/execute/<job_name>` - Executar job manualmente
- `GET /api/scheduler/logs?lines=N` - Ver logs recentes

### Jobs Disponíveis
- `atualizar_dados_yahoo` - Atualização completa via Yahoo Finance
- `atualizar_precos_rtd` - Atualização de preços via RTD
- `verificar_saude` - Verificação de saúde dos dados

## 📈 Monitoramento

### Logs
Os logs são salvos em `scheduler_atualizacao.log` com informações detalhadas:
- Início/fim de cada job
- Duração de execução
- Erros e problemas encontrados
- Status das atualizações

### Status em Tempo Real
```json
{
  "scheduler_running": true,
  "timestamp": "2025-08-07T17:00:00",
  "jobs": [
    {
      "id": "dados_yahoo_diario",
      "name": "Atualização Diária Yahoo Finance",
      "next_run": "2025-08-08T08:00:00"
    }
  ],
  "jobs_status": {
    "atualizar_precos_rtd_manual": {
      "status": "completed",
      "start_time": "2025-08-07T17:00:00",
      "end_time": "2025-08-07T17:00:30",
      "duration_seconds": 30.5
    }
  }
}
```

## ⚙️ Configurações

### Horários Personalizados
Edite `scheduler_config.json` para ajustar:
- Horários de execução
- Frequência de atualizações
- Timeouts e retry
- Configurações de alertas

### Exemplo de Personalização
```json
{
  "jobs": {
    "atualizar_dados_yahoo": {
      "enabled": true,
      "cron": {
        "hour": 9,        // Mudar para 09:00
        "minute": 30      // Mudar para 09:30
      }
    }
  }
}
```

## 🔄 Processo de Atualização

### Fluxo Típico
1. **08:00** - Atualização completa Yahoo Finance
2. **09:00-17:00** - Preços RTD a cada 30min
3. **18:00-08:00** - Preços RTD a cada hora
4. **A cada 2h** - Verificação de saúde

### Recuperação de Falhas
- **Retry automático**: 3 tentativas com delay de 60s
- **Tolerância**: 5 minutos para jobs atrasados
- **Auto-restart**: Reinicia automaticamente em caso de erro crítico

## 🚨 Solução de Problemas

### Problema: Scheduler não inicia
```bash
# Verificar dependências
pip list | grep APScheduler

# Verificar conexão com banco
python -c "from postgres_adapter import PostgreSQLClient; print('OK')"
```

### Problema: Jobs falham
```bash
# Ver logs detalhados
curl http://localhost:5002/api/scheduler/logs?lines=100

# Executar job manual para debug
curl -X POST http://localhost:5002/api/scheduler/execute/verificar_saude
```

### Problema: Dados ainda desatualizados
```bash
# Forçar atualização manual
curl -X POST http://localhost:5002/api/scheduler/execute/atualizar_dados_yahoo

# Verificar última atualização
curl http://localhost:5002/api/last-update
```

## 🔐 Segurança

### Variáveis de Ambiente Necessárias
```bash
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=paridaderisco
POSTGRES_USER=postgres
POSTGRES_PASSWORD=sua_senha
```

### Considerações
- O scheduler roda em background e persiste logs
- Não expõe credenciais nos logs
- Timeout configurável para evitar travamentos
- Limite de instâncias simultâneas por job

## 🚀 Deploy em Produção

### Docker (Recomendado)
Adicione ao `docker-compose.yml`:
```yaml
services:
  scheduler:
    build: ./backend
    command: python run_scheduler.py
    depends_on:
      - postgres
    environment:
      - POSTGRES_HOST=postgres
    volumes:
      - ./logs:/app/logs
```

### Systemd (Linux)
Crie `/etc/systemd/system/scheduler-dados.service`:
```ini
[Unit]
Description=Scheduler de Dados Financeiros
After=postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/backend
ExecStart=/usr/bin/python run_scheduler.py
Restart=always

[Install]
WantedBy=multi-user.target
```

### Windows Service
Use `nssm` para criar um serviço Windows:
```cmd
nssm install "SchedulerDados" "C:\Python\python.exe" "C:\projeto\backend\run_scheduler.py"
```

---

## 📞 Suporte

Em caso de problemas:
1. Consulte os logs em `scheduler_atualizacao.log`
2. Verifique status via `/api/scheduler/status`
3. Execute jobs manuais para debug
4. Reinicie o scheduler se necessário

O sistema está projetado para resolver definitivamente o problema de dados desatualizados no dashboard, mantendo as informações sempre atualizadas automaticamente.