@echo off
REM Script para executar o Scheduler no Windows
REM 
REM Este script configura o environment correto e executa o scheduler

echo Iniciando Scheduler de Atualizacao de Dados...

REM Configurar encoding
set PYTHONIOENCODING=utf-8
set PYTHONUTF8=1

REM Executar o scheduler
python run_scheduler.py

pause