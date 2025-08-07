#!/usr/bin/env python3
"""
App Flask com Scheduler Integrado para Docker
==============================================

Esta versão integra o Flask API com o Scheduler em um único processo,
otimizado para execução em containers Docker.
"""

import os
import sys
import threading
import time
from datetime import datetime

# Importar o app Flask original
from app import app, supabase

# Importar o scheduler Docker
from scheduler_docker import SchedulerDocker

# Variável global para o scheduler
scheduler_instance = None
scheduler_thread = None

def init_scheduler():
    """Inicializa o scheduler em thread separada"""
    global scheduler_instance
    
    scheduler_enabled = os.getenv("SCHEDULER_ENABLED", "true").lower() == "true"
    
    if not scheduler_enabled:
        print("SCHEDULER DESABILITADO via SCHEDULER_ENABLED=false")
        return
    
    try:
        print("INICIALIZANDO SCHEDULER...")
        scheduler_instance = SchedulerDocker()
        
        # Aguardar um pouco para o Flask subir
        time.sleep(5)
        
        # Iniciar scheduler
        scheduler_instance.start()
        print("SCHEDULER INICIADO COM SUCESSO")
        
        # Manter rodando
        scheduler_instance.run_forever()
        
    except Exception as e:
        print(f"ERRO NO SCHEDULER: {e}")

def start_scheduler_thread():
    """Inicia o scheduler em thread separada"""
    global scheduler_thread
    
    scheduler_thread = threading.Thread(target=init_scheduler, daemon=False)
    scheduler_thread.start()

# Adicionar endpoints específicos para o scheduler integrado
@app.route('/api/scheduler/integrated/status', methods=['GET'])
def get_integrated_scheduler_status():
    """Status do scheduler integrado"""
    global scheduler_instance
    
    if not scheduler_instance:
        return {"status": "not_initialized", "enabled": os.getenv("SCHEDULER_ENABLED", "true")}
    
    try:
        return scheduler_instance.get_status()
    except Exception as e:
        return {"error": str(e)}, 500

@app.route('/api/scheduler/integrated/health', methods=['GET'])
def scheduler_health():
    """Healthcheck do scheduler integrado"""
    global scheduler_instance
    
    if not scheduler_instance:
        return {"status": "unhealthy", "reason": "scheduler_not_initialized"}, 503
    
    if not scheduler_instance.running:
        return {"status": "unhealthy", "reason": "scheduler_not_running"}, 503
    
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == '__main__':
    print("INICIANDO APP FLASK COM SCHEDULER INTEGRADO")
    
    # Iniciar scheduler se habilitado
    scheduler_enabled = os.getenv("SCHEDULER_ENABLED", "true").lower() == "true"
    
    if scheduler_enabled:
        print("INICIANDO SCHEDULER EM THREAD SEPARADA...")
        start_scheduler_thread()
    else:
        print("SCHEDULER DESABILITADO - APENAS API FLASK")
    
    # Configurações Flask
    flask_host = os.getenv("FLASK_HOST", "0.0.0.0")
    flask_port = int(os.getenv("FLASK_PORT", "5001"))
    flask_debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    
    print(f"INICIANDO FLASK SERVER em {flask_host}:{flask_port}")
    print("ENDPOINTS DISPONÍVEIS:")
    print("- GET /api/status - Status da API")
    print("- GET /api/scheduler/integrated/status - Status do scheduler")
    print("- GET /api/scheduler/integrated/health - Health do scheduler")
    
    try:
        app.run(
            host=flask_host,
            port=flask_port,
            debug=flask_debug,
            use_reloader=False  # Importante: desabilitar reloader para evitar conflitos com threads
        )
    except KeyboardInterrupt:
        print("\nFINALIZANDO APLICAÇÃO...")
        if scheduler_instance:
            scheduler_instance.stop()
    except Exception as e:
        print(f"ERRO NO FLASK: {e}")
    finally:
        print("APLICAÇÃO FINALIZADA")