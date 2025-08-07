#!/usr/bin/env python3
"""
Script para executar o Scheduler de Atualização de Dados

Este script inicializa e executa o scheduler de forma simplificada,
sem interferência dos emojis que podem causar problemas no Windows.
"""

import os
import sys
import time
import signal

# Configurar encoding para UTF-8
os.environ['PYTHONIOENCODING'] = 'utf-8'

def signal_handler(signum, frame):
    """Handler para parar o scheduler com Ctrl+C"""
    print("\nParando scheduler...")
    sys.exit(0)

def main():
    """Função principal"""
    print("Iniciando Scheduler de Atualização de Dados...")
    
    # Configurar handler de sinal
    signal.signal(signal.SIGINT, signal_handler)
    
    try:
        # Importar e criar scheduler (sem emojis no log)
        from scheduler_atualizacao import SchedulerDados
        
        # Suprimir emojis temporariamente
        scheduler = SchedulerDados()
        
        # Iniciar scheduler
        scheduler.start()
        
        print("Scheduler iniciado com sucesso!")
        print("Jobs agendados:")
        print("- Atualização Yahoo Finance: Diária às 08:00")
        print("- Atualização RTD: A cada 30min (horário comercial)")
        print("- Verificação de saúde: A cada 2 horas")
        print("\nPressione Ctrl+C para parar")
        
        # Executar uma atualização inicial de preços RTD
        print("\nExecutando atualização inicial de preços...")
        try:
            scheduler.executar_job_manual('atualizar_precos_rtd')
            print("Atualização inicial iniciada em background")
        except Exception as e:
            print(f"Erro na atualização inicial: {e}")
        
        # Loop principal
        while True:
            time.sleep(60)  # Check a cada minuto
            
            # Mostrar status periodicamente
            if int(time.time()) % 3600 == 0:  # A cada hora
                status = scheduler.get_status()
                print(f"Status: {len(status['jobs'])} jobs agendados, "
                      f"{len(status['jobs_status'])} jobs executados")
                
    except KeyboardInterrupt:
        print("\nRecebido sinal de interrupção...")
    except Exception as e:
        print(f"Erro ao executar scheduler: {e}")
        return 1
    finally:
        try:
            if 'scheduler' in locals():
                scheduler.stop()
                print("Scheduler parado com sucesso")
        except:
            pass
    
    return 0

if __name__ == "__main__":
    sys.exit(main())