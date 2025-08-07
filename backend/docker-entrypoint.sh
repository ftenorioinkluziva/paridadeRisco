#!/bin/bash
# Docker entrypoint script para o backend com scheduler

set -e

# Função de log
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Verificar variáveis de ambiente obrigatórias
check_env() {
    local required_vars=(
        "POSTGRES_HOST"
        "POSTGRES_DB" 
        "POSTGRES_USER"
        "POSTGRES_PASSWORD"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            log "ERROR: Variável de ambiente $var não definida"
            exit 1
        fi
    done
}

# Aguardar PostgreSQL estar disponível
wait_for_postgres() {
    log "Aguardando PostgreSQL estar disponível..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if python -c "
import psycopg2
import os
try:
    conn = psycopg2.connect(
        host='${POSTGRES_HOST}',
        port='${POSTGRES_PORT:-5432}',
        database='${POSTGRES_DB}',
        user='${POSTGRES_USER}',
        password='${POSTGRES_PASSWORD}'
    )
    conn.close()
    print('PostgreSQL conectado com sucesso')
    exit(0)
except Exception as e:
    print(f'Tentativa {attempt}/{max_attempts}: {e}')
    exit(1)
" 2>/dev/null; then
            log "PostgreSQL está disponível!"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log "ERROR: PostgreSQL não ficou disponível após $max_attempts tentativas"
            exit 1
        fi
        
        log "Tentativa $attempt/$max_attempts falhou. Aguardando 2s..."
        sleep 2
        ((attempt++))
    done
}

# Executar migração se necessário
run_migration() {
    local migration_enabled=${MIGRATION_ENABLED:-false}
    
    if [[ "$migration_enabled" == "true" ]]; then
        log "Executando migrações de banco..."
        # Adicionar comandos de migração aqui se necessário
        # python migrate.py
    fi
}

# Função principal
main() {
    log "=== INICIANDO BACKEND COM SCHEDULER ==="
    
    # Configurar timezone se especificado
    if [[ -n "${TZ}" ]]; then
        log "Configurando timezone: ${TZ}"
        ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
    fi
    
    # Verificar variáveis de ambiente
    check_env
    
    # Aguardar banco de dados
    wait_for_postgres
    
    # Executar migração se habilitado
    run_migration
    
    # Mostrar configuração do scheduler
    log "=== CONFIGURAÇÃO DO SCHEDULER ==="
    log "Scheduler habilitado: ${SCHEDULER_ENABLED:-true}"
    log "Timezone: ${SCHEDULER_TIMEZONE:-America/Sao_Paulo}"
    log "Max workers: ${SCHEDULER_MAX_WORKERS:-3}"
    log "Log level: ${SCHEDULER_LOG_LEVEL:-INFO}"
    log "Yahoo Finance: ${SCHEDULER_YAHOO_ENABLED:-true} às ${SCHEDULER_YAHOO_HOUR:-8}:${SCHEDULER_YAHOO_MINUTE:-0}"
    log "RTD comercial: ${SCHEDULER_RTD_COMERCIAL_ENABLED:-true} a cada ${SCHEDULER_RTD_COMERCIAL_INTERVAL:-30}min"
    log "RTD noturno: ${SCHEDULER_RTD_NOTURNO_ENABLED:-true}"
    log "Verificação saúde: ${SCHEDULER_SAUDE_ENABLED:-true} a cada ${SCHEDULER_SAUDE_INTERVAL:-120}min"
    
    # Determinar modo de execução
    local run_mode=${RUN_MODE:-integrated}
    
    case $run_mode in
        "integrated")
            log "=== MODO INTEGRADO: Flask + Scheduler ==="
            exec python app_with_scheduler.py
            ;;
        "api-only")
            log "=== MODO APENAS API: Flask sem Scheduler ==="
            export SCHEDULER_ENABLED=false
            exec python app.py
            ;;
        "scheduler-only")
            log "=== MODO APENAS SCHEDULER ==="
            exec python scheduler_docker.py
            ;;
        *)
            log "ERROR: RUN_MODE inválido: $run_mode. Use: integrated, api-only, ou scheduler-only"
            exit 1
            ;;
    esac
}

# Capturar sinais para shutdown graceful
trap 'log "Recebido sinal de shutdown. Finalizando..."; exit 0' SIGTERM SIGINT

# Executar função principal
main "$@"