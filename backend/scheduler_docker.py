#!/usr/bin/env python3
"""
Scheduler Docker - Versão otimizada para ambiente Docker
========================================================

Esta versão do scheduler foi adaptada para funcionar em containers Docker:
- Melhor handling de sinais (SIGTERM)
- Configuração via variáveis de ambiente
- Logs otimizados para Docker
- Sem emojis para evitar problemas de encoding
- Healthcheck endpoints
"""

import os
import sys
import time
import logging
import threading
import signal
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import json

# Bibliotecas para agendamento
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.executors.pool import ThreadPoolExecutor
from apscheduler.jobstores.memory import MemoryJobStore

# Bibliotecas do projeto
from dotenv import load_dotenv
from postgres_adapter import PostgreSQLClient

# Importar funções de atualização
try:
    from atualizar_dados import atualizar_dados
    from app import atualizar_precos_rtd
except ImportError as e:
    print(f"WARNING: Erro ao importar módulos: {e}")

# Carregar variáveis de ambiente
load_dotenv()

class SchedulerDocker:
    """
    Scheduler otimizado para ambiente Docker
    """
    
    def __init__(self):
        self.scheduler = None
        self.supabase = None
        self.logger = None
        self.running = False
        self.shutdown_requested = False
        self.jobs_status = {}
        self.last_update_times = {}
        
        # Configurações via environment variables
        self.config = {
            "timezone": os.getenv("SCHEDULER_TIMEZONE", "America/Sao_Paulo"),
            "max_workers": int(os.getenv("SCHEDULER_MAX_WORKERS", "3")),
            "coalesce": os.getenv("SCHEDULER_COALESCE", "false").lower() == "true",
            "misfire_grace_time": int(os.getenv("SCHEDULER_MISFIRE_GRACE", "300")),
            "log_level": os.getenv("SCHEDULER_LOG_LEVEL", "INFO"),
            "healthcheck_port": int(os.getenv("SCHEDULER_HEALTHCHECK_PORT", "8081"))
        }
        
        self.setup_logging()
        self.setup_signal_handlers()
        self.setup_database()
        self.setup_scheduler()
        
    def setup_logging(self):
        """Configura logging otimizado para Docker"""
        # Formato simples para Docker logs
        log_format = '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
        
        # Logger principal
        self.logger = logging.getLogger('SchedulerDocker')
        self.logger.setLevel(getattr(logging, self.config["log_level"]))
        
        # Handler para stdout (capturado pelo Docker)
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter(log_format))
        self.logger.addHandler(handler)
        
        # Configurar outros loggers para reduzir verbosidade
        logging.getLogger('apscheduler').setLevel(logging.WARNING)
        logging.getLogger('urllib3').setLevel(logging.WARNING)
        
        self.logger.info("Sistema de logging Docker inicializado")
        
    def setup_signal_handlers(self):
        """Configura handlers para sinais Docker"""
        try:
            signal.signal(signal.SIGTERM, self.signal_handler)
            signal.signal(signal.SIGINT, self.signal_handler)
        except ValueError:
            # Signal handlers só funcionam na thread principal
            self.logger.warning("Signal handlers nao disponíveis em thread secundária")
        
    def signal_handler(self, signum, frame):
        """Handler para sinais de shutdown do Docker"""
        self.logger.info(f"Recebido sinal {signum}. Iniciando shutdown graceful...")
        self.shutdown_requested = True
        self.stop()
        
    def setup_database(self):
        """Inicializa conexão com banco com retry"""
        max_retries = 10
        retry_delay = 5
        
        for attempt in range(max_retries):
            try:
                self.supabase = PostgreSQLClient()
                self.logger.info("Conexao com PostgreSQL estabelecida")
                return
            except Exception as e:
                self.logger.warning(f"Tentativa {attempt + 1}/{max_retries} falhou: {e}")
                if attempt < max_retries - 1:
                    self.logger.info(f"Aguardando {retry_delay}s antes da próxima tentativa...")
                    time.sleep(retry_delay)
                else:
                    self.logger.error("Não foi possível conectar ao PostgreSQL após todas as tentativas")
                    raise
                    
    def setup_scheduler(self):
        """Configura o APScheduler"""
        jobstores = {'default': MemoryJobStore()}
        executors = {'default': ThreadPoolExecutor(self.config["max_workers"])}
        job_defaults = {
            'coalesce': self.config["coalesce"],
            'max_instances': 1,
            'misfire_grace_time': self.config["misfire_grace_time"]
        }
        
        self.scheduler = BackgroundScheduler(
            jobstores=jobstores,
            executors=executors,
            job_defaults=job_defaults,
            timezone=self.config["timezone"]
        )
        
        self.logger.info("Scheduler APScheduler configurado")
        
    def job_wrapper(self, job_name: str, job_function, *args, **kwargs):
        """Wrapper para jobs com logging Docker-friendly"""
        if self.shutdown_requested:
            self.logger.info(f"Job {job_name} cancelado devido ao shutdown")
            return
            
        start_time = datetime.now()
        self.jobs_status[job_name] = {
            "status": "running",
            "start_time": start_time.isoformat(),
            "last_error": None
        }
        
        self.logger.info(f"INICIANDO JOB: {job_name}")
        
        try:
            result = job_function(*args, **kwargs)
            
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            self.jobs_status[job_name].update({
                "status": "completed",
                "end_time": end_time.isoformat(),
                "duration_seconds": duration,
                "last_success": end_time.isoformat()
            })
            
            self.last_update_times[job_name] = end_time
            self.logger.info(f"JOB CONCLUIDO: {job_name} em {duration:.2f}s")
            
            return result
            
        except Exception as e:
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            self.jobs_status[job_name].update({
                "status": "error",
                "end_time": end_time.isoformat(),
                "duration_seconds": duration,
                "last_error": str(e)
            })
            
            self.logger.error(f"ERRO NO JOB {job_name}: {e}")
            raise
            
    def atualizar_dados_yahoo(self):
        """Job para atualizar dados via Yahoo Finance"""
        self.logger.info("Executando atualizacao via Yahoo Finance...")
        return atualizar_dados()
        
    def atualizar_precos_rtd_job(self):
        """Job para atualizar preços via API RTD"""
        self.logger.info("Executando atualizacao de precos via RTD...")
        if self.supabase:
            return atualizar_precos_rtd(self.supabase)
        else:
            raise Exception("Conexao com banco de dados nao disponivel")
            
    def verificar_saude_dados(self):
        """Job para verificar a saúde dos dados"""
        self.logger.info("Verificando saude dos dados...")
        
        try:
            principais_ativos = ['BOVA11.SA', 'CDI', 'XFIX11.SA', 'IB5M11.SA']
            hoje = datetime.now().date()
            problemas = []
            
            for ticker in principais_ativos:
                response = self.supabase.table('dados_historicos') \
                    .select('data') \
                    .eq('ticker', ticker) \
                    .order('data', desc=True) \
                    .limit(1) \
                    .execute()
                
                if response.data:
                    ultima_data = datetime.strptime(response.data[0]['data'], '%Y-%m-%d').date()
                    dias_sem_atualizacao = (hoje - ultima_data).days
                    
                    if dias_sem_atualizacao > 3:
                        problemas.append(f"{ticker}: {dias_sem_atualizacao} dias sem atualizacao (ultima: {ultima_data})")
                else:
                    problemas.append(f"{ticker}: Nenhum dado encontrado")
            
            if problemas:
                self.logger.warning(f"Problemas nos dados: {'; '.join(problemas)}")
                return {"status": "warning", "problemas": problemas}
            else:
                self.logger.info("Verificacao de saude: OK")
                return {"status": "ok", "verificado_em": datetime.now().isoformat()}
                
        except Exception as e:
            self.logger.error(f"Erro na verificacao de saude: {e}")
            raise
            
    def adicionar_jobs(self):
        """Adiciona jobs baseado em variáveis de ambiente"""
        
        # Job 1: Yahoo Finance diário (configurável via ENV)
        yahoo_enabled = os.getenv("SCHEDULER_YAHOO_ENABLED", "true").lower() == "true"
        yahoo_hour = int(os.getenv("SCHEDULER_YAHOO_HOUR", "8"))
        yahoo_minute = int(os.getenv("SCHEDULER_YAHOO_MINUTE", "0"))
        
        if yahoo_enabled:
            self.scheduler.add_job(
                func=lambda: self.job_wrapper("atualizar_dados_yahoo", self.atualizar_dados_yahoo),
                trigger=CronTrigger(hour=yahoo_hour, minute=yahoo_minute),
                id="dados_yahoo_diario",
                name="Atualizacao Diaria Yahoo Finance",
                replace_existing=True
            )
            self.logger.info(f"Job Yahoo Finance agendado para {yahoo_hour:02d}:{yahoo_minute:02d}")
        
        # Job 2: RTD comercial (configurável)
        rtd_comercial_enabled = os.getenv("SCHEDULER_RTD_COMERCIAL_ENABLED", "true").lower() == "true"
        rtd_comercial_interval = int(os.getenv("SCHEDULER_RTD_COMERCIAL_INTERVAL", "30"))
        
        if rtd_comercial_enabled:
            minutes_pattern = f"*/{rtd_comercial_interval}"
            self.scheduler.add_job(
                func=lambda: self.job_wrapper("atualizar_precos_rtd", self.atualizar_precos_rtd_job),
                trigger=CronTrigger(minute=minutes_pattern, hour='9-17', day_of_week='mon-fri'),
                id="precos_rtd_comercial",
                name="Atualizacao Precos RTD (Comercial)",
                replace_existing=True
            )
            self.logger.info(f"Job RTD comercial agendado a cada {rtd_comercial_interval}min")
        
        # Job 3: RTD noturno
        rtd_noturno_enabled = os.getenv("SCHEDULER_RTD_NOTURNO_ENABLED", "true").lower() == "true"
        if rtd_noturno_enabled:
            self.scheduler.add_job(
                func=lambda: self.job_wrapper("atualizar_precos_rtd_noturno", self.atualizar_precos_rtd_job),
                trigger=CronTrigger(minute=0, hour='0-8,18-23'),
                id="precos_rtd_noturno",
                name="Atualizacao Precos RTD (Noturno)",
                replace_existing=True
            )
            self.logger.info("Job RTD noturno agendado")
        
        # Job 4: Verificação de saúde
        saude_enabled = os.getenv("SCHEDULER_SAUDE_ENABLED", "true").lower() == "true"
        saude_interval = int(os.getenv("SCHEDULER_SAUDE_INTERVAL", "120"))  # 2 horas
        
        if saude_enabled:
            self.scheduler.add_job(
                func=lambda: self.job_wrapper("verificar_saude", self.verificar_saude_dados),
                trigger=IntervalTrigger(minutes=saude_interval),
                id="verificar_saude",
                name="Verificacao Saude Dados",
                replace_existing=True
            )
            self.logger.info(f"Job verificacao saude agendado a cada {saude_interval}min")
        
        self.logger.info(f"Total de {len(self.scheduler.get_jobs())} jobs adicionados")
        
    def get_status(self) -> Dict:
        """Status do scheduler"""
        jobs = []
        for job in self.scheduler.get_jobs():
            next_run = job.next_run_time.isoformat() if job.next_run_time else None
            jobs.append({
                "id": job.id,
                "name": job.name,
                "next_run": next_run,
                "trigger": str(job.trigger)
            })
            
        return {
            "scheduler_running": self.running,
            "timestamp": datetime.now().isoformat(),
            "jobs": jobs,
            "jobs_status": self.jobs_status,
            "last_update_times": {k: v.isoformat() for k, v in self.last_update_times.items()},
            "config": self.config
        }
        
    def start(self):
        """Inicia o scheduler"""
        if not self.running:
            self.adicionar_jobs()
            self.scheduler.start()
            self.running = True
            self.logger.info("SCHEDULER INICIADO COM SUCESSO")
            
            # Executar uma verificação inicial de saúde
            try:
                self.job_wrapper("verificar_saude_inicial", self.verificar_saude_dados)
            except Exception as e:
                self.logger.warning(f"Verificacao inicial falhou: {e}")
        else:
            self.logger.warning("Scheduler já está rodando")
            
    def stop(self):
        """Para o scheduler"""
        if self.running:
            self.scheduler.shutdown(wait=True)
            self.running = False
            self.logger.info("SCHEDULER PARADO")
        else:
            self.logger.warning("Scheduler não está rodando")
            
    def run_forever(self):
        """Loop principal para Docker"""
        self.start()
        
        try:
            while not self.shutdown_requested:
                time.sleep(30)  # Check a cada 30 segundos
                
                # Verificar se scheduler ainda está ativo
                if self.running and not self.scheduler.running:
                    self.logger.error("Scheduler parou inesperadamente. Tentando reiniciar...")
                    try:
                        self.start()
                    except Exception as e:
                        self.logger.error(f"Falha ao reiniciar scheduler: {e}")
                        break
                        
        except KeyboardInterrupt:
            self.logger.info("Interrupção recebida")
        finally:
            self.stop()

def main():
    """Função principal para execução em Docker"""
    print("INICIANDO SCHEDULER DOCKER...")
    
    # Configurar encoding
    os.environ.setdefault('PYTHONIOENCODING', 'utf-8')
    
    try:
        scheduler = SchedulerDocker()
        
        # Executar indefinidamente
        scheduler.run_forever()
        
    except Exception as e:
        print(f"ERRO CRITICO: {e}")
        sys.exit(1)
    
    print("SCHEDULER DOCKER FINALIZADO")
    sys.exit(0)

if __name__ == "__main__":
    main()