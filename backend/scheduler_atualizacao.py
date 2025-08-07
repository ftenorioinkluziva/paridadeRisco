#!/usr/bin/env python3
"""
Scheduler Automático para Atualização de Dados Financeiros
==========================================================

Este script implementa um sistema de agendamento automático para atualização
dos dados financeiros usando APScheduler. Inclui:
- Agendamento de múltiplas tarefas
- Sistema de logging robusto
- Tratamento de erros
- Monitoramento de status
- API de controle remoto
"""

import os
import sys
import time
import logging
import threading
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import signal
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

# Importar funções de atualização existentes
try:
    from atualizar_dados import atualizar_dados
    from app import atualizar_precos_rtd
except ImportError as e:
    print(f"⚠️ Erro ao importar módulos: {e}")
    print("Certifique-se de que atualizar_dados.py e app.py estão no mesmo diretório")
    sys.exit(1)

# Carregar variáveis de ambiente
load_dotenv()

class SchedulerDados:
    """
    Classe principal para gerenciamento do scheduler de atualização de dados
    """
    
    def __init__(self):
        self.scheduler = None
        self.supabase = None
        self.logger = None
        self.running = False
        self.jobs_status = {}
        self.last_update_times = {}
        
        # Configurações
        self.config = {
            "timezone": "America/Sao_Paulo",
            "max_workers": 3,
            "coalesce": False,  # Permitir execuções em paralelo se necessário
            "misfire_grace_time": 300,  # 5 minutos de tolerância para jobs atrasados
            "log_file": "scheduler_atualizacao.log",
            "log_level": "INFO"
        }
        
        self.setup_logging()
        self.setup_database()
        self.setup_scheduler()
        
    def setup_logging(self):
        """Configura o sistema de logging"""
        log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        
        # Configurar logger principal
        self.logger = logging.getLogger('SchedulerDados')
        self.logger.setLevel(getattr(logging, self.config["log_level"]))
        
        # Handler para arquivo
        file_handler = logging.FileHandler(self.config["log_file"], encoding='utf-8')
        file_handler.setFormatter(logging.Formatter(log_format))
        
        # Handler para console
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(logging.Formatter(log_format))
        
        # Adicionar handlers
        self.logger.addHandler(file_handler)
        self.logger.addHandler(console_handler)
        
        self.logger.info("Sistema de logging inicializado")
        
    def setup_database(self):
        """Inicializa conexão com banco de dados"""
        try:
            self.supabase = PostgreSQLClient()
            self.logger.info("Conexão com PostgreSQL estabelecida")
        except Exception as e:
            self.logger.error(f"Erro ao conectar com PostgreSQL: {e}")
            raise
            
    def setup_scheduler(self):
        """Configura o scheduler APScheduler"""
        # Configuração de stores e executors
        jobstores = {
            'default': MemoryJobStore()
        }
        
        executors = {
            'default': ThreadPoolExecutor(self.config["max_workers"])
        }
        
        job_defaults = {
            'coalesce': self.config["coalesce"],
            'max_instances': 1,
            'misfire_grace_time': self.config["misfire_grace_time"]
        }
        
        # Criar scheduler
        self.scheduler = BackgroundScheduler(
            jobstores=jobstores,
            executors=executors,
            job_defaults=job_defaults,
            timezone=self.config["timezone"]
        )
        
        self.logger.info("Scheduler APScheduler configurado")
        
    def job_wrapper(self, job_name: str, job_function, *args, **kwargs):
        """
        Wrapper para jobs que adiciona logging e controle de erro
        """
        start_time = datetime.now()
        self.jobs_status[job_name] = {
            "status": "running",
            "start_time": start_time.isoformat(),
            "last_error": None
        }
        
        self.logger.info(f"🚀 Iniciando job: {job_name}")
        
        try:
            # Executar a função
            result = job_function(*args, **kwargs)
            
            # Atualizar status de sucesso
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            self.jobs_status[job_name].update({
                "status": "completed",
                "end_time": end_time.isoformat(),
                "duration_seconds": duration,
                "last_success": end_time.isoformat()
            })
            
            self.last_update_times[job_name] = end_time
            
            self.logger.info(f"✅ Job {job_name} concluído em {duration:.2f}s")
            
            return result
            
        except Exception as e:
            # Atualizar status de erro
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            self.jobs_status[job_name].update({
                "status": "error",
                "end_time": end_time.isoformat(),
                "duration_seconds": duration,
                "last_error": str(e)
            })
            
            self.logger.error(f"❌ Erro no job {job_name}: {e}")
            
            # Re-raise para que o scheduler saiba que houve erro
            raise
            
    def atualizar_dados_yahoo(self):
        """Job para atualizar dados via Yahoo Finance"""
        self.logger.info("Executando atualização via Yahoo Finance...")
        return atualizar_dados()
        
    def atualizar_precos_rtd_job(self):
        """Job para atualizar preços via API RTD"""
        self.logger.info("Executando atualização de preços via RTD...")
        if self.supabase:
            return atualizar_precos_rtd(self.supabase)
        else:
            raise Exception("Conexão com banco de dados não disponível")
            
    def verificar_saude_dados(self):
        """Job para verificar a saúde dos dados"""
        self.logger.info("Verificando saúde dos dados...")
        
        try:
            # Verificar dados recentes para principais ativos
            principais_ativos = ['BOVA11.SA', 'CDI', 'XFIX11.SA', 'IB5M11.SA']
            
            hoje = datetime.now().date()
            ontem = hoje - timedelta(days=1)
            
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
                    
                    if dias_sem_atualizacao > 3:  # Mais de 3 dias sem atualização
                        problemas.append(f"{ticker}: {dias_sem_atualizacao} dias sem atualização (última: {ultima_data})")
                else:
                    problemas.append(f"{ticker}: Nenhum dado encontrado")
            
            if problemas:
                self.logger.warning(f"Problemas encontrados nos dados: {'; '.join(problemas)}")
                return {"status": "warning", "problemas": problemas}
            else:
                self.logger.info("Verificação de saúde dos dados: OK")
                return {"status": "ok", "verificado_em": datetime.now().isoformat()}
                
        except Exception as e:
            self.logger.error(f"Erro na verificação de saúde: {e}")
            raise
            
    def adicionar_jobs(self):
        """Adiciona os jobs ao scheduler"""
        
        # Job 1: Atualização completa via Yahoo Finance (uma vez por dia, 08:00)
        self.scheduler.add_job(
            func=lambda: self.job_wrapper("atualizar_dados_yahoo", self.atualizar_dados_yahoo),
            trigger=CronTrigger(hour=8, minute=0),
            id="dados_yahoo_diario",
            name="Atualização Diária Yahoo Finance",
            replace_existing=True
        )
        
        # Job 2: Atualização de preços via RTD (a cada 30 minutos durante horário comercial)
        self.scheduler.add_job(
            func=lambda: self.job_wrapper("atualizar_precos_rtd", self.atualizar_precos_rtd_job),
            trigger=CronTrigger(minute='0,30', hour='9-17', day_of_week='mon-fri'),
            id="precos_rtd_comercial",
            name="Atualização Preços RTD (Horário Comercial)",
            replace_existing=True
        )
        
        # Job 3: Atualização de preços via RTD (uma vez por hora fora do horário comercial)
        self.scheduler.add_job(
            func=lambda: self.job_wrapper("atualizar_precos_rtd_noturno", self.atualizar_precos_rtd_job),
            trigger=CronTrigger(minute=0, hour='0-8,18-23'),
            id="precos_rtd_noturno",
            name="Atualização Preços RTD (Fora Horário Comercial)",
            replace_existing=True
        )
        
        # Job 4: Verificação de saúde dos dados (a cada 2 horas)
        self.scheduler.add_job(
            func=lambda: self.job_wrapper("verificar_saude", self.verificar_saude_dados),
            trigger=IntervalTrigger(hours=2),
            id="verificar_saude",
            name="Verificação de Saúde dos Dados",
            replace_existing=True
        )
        
        # Job 5: Atualização de emergência (quando solicitada manualmente)
        # Este job não é agendado automaticamente
        
        self.logger.info("Jobs adicionados ao scheduler")
        
    def executar_job_manual(self, job_name: str):
        """Executa um job manualmente"""
        jobs_disponiveis = {
            "atualizar_dados_yahoo": self.atualizar_dados_yahoo,
            "atualizar_precos_rtd": self.atualizar_precos_rtd_job,
            "verificar_saude": self.verificar_saude_dados
        }
        
        if job_name not in jobs_disponiveis:
            raise ValueError(f"Job '{job_name}' não encontrado. Disponíveis: {list(jobs_disponiveis.keys())}")
        
        self.logger.info(f"Executando job manual: {job_name}")
        
        # Executar em thread separada para não bloquear
        thread = threading.Thread(
            target=lambda: self.job_wrapper(f"{job_name}_manual", jobs_disponiveis[job_name])
        )
        thread.start()
        
        return f"Job {job_name} iniciado manualmente"
        
    def get_status(self) -> Dict:
        """Retorna status detalhado do scheduler"""
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
            "last_update_times": {k: v.isoformat() for k, v in self.last_update_times.items()}
        }
        
    def start(self):
        """Inicia o scheduler"""
        if not self.running:
            self.adicionar_jobs()
            self.scheduler.start()
            self.running = True
            self.logger.info("🚀 Scheduler iniciado com sucesso")
        else:
            self.logger.warning("Scheduler já está rodando")
            
    def stop(self):
        """Para o scheduler"""
        if self.running:
            self.scheduler.shutdown()
            self.running = False
            self.logger.info("🛑 Scheduler parado")
        else:
            self.logger.warning("Scheduler não está rodando")
            
    def restart(self):
        """Reinicia o scheduler"""
        self.logger.info("🔄 Reiniciando scheduler...")
        self.stop()
        time.sleep(2)
        self.start()
        

# Instância global do scheduler
scheduler_instance = None

def signal_handler(signum, frame):
    """Handler para sinais do sistema (Ctrl+C, etc.)"""
    global scheduler_instance
    print(f"\nRecebido sinal {signum}. Parando scheduler...")
    if scheduler_instance:
        scheduler_instance.stop()
    sys.exit(0)

def main():
    """Função principal"""
    global scheduler_instance
    
    print("🚀 Iniciando Scheduler de Atualização de Dados Financeiros...")
    
    # Configurar handlers de sinal
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        # Criar e iniciar scheduler
        scheduler_instance = SchedulerDados()
        scheduler_instance.start()
        
        print(f"✅ Scheduler iniciado com sucesso!")
        print(f"📋 Status disponível em: /api/scheduler/status")
        print(f"📝 Logs sendo salvos em: {scheduler_instance.config['log_file']}")
        print("🔥 Pressione Ctrl+C para parar")
        
        # Manter o programa rodando
        try:
            while True:
                time.sleep(30)  # Check a cada 30 segundos
                
                # Verificar se o scheduler ainda está ativo
                if not scheduler_instance.scheduler.running:
                    print("⚠️ Scheduler parou inesperadamente. Tentando reiniciar...")
                    scheduler_instance.start()
                    
        except KeyboardInterrupt:
            pass
            
    except Exception as e:
        print(f"❌ Erro ao iniciar scheduler: {e}")
        sys.exit(1)
    finally:
        if scheduler_instance:
            scheduler_instance.stop()

if __name__ == "__main__":
    main()