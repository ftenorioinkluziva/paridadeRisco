#!/usr/bin/env python3
"""
Teste simples para verificar se a API responde
"""

import requests
import time
import subprocess
import sys
import os

def start_server():
    """Inicia o servidor Flask em background"""
    try:
        # Mudar para o diretório do backend
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Iniciar o servidor
        process = subprocess.Popen(
            [sys.executable, 'app.py'],
            cwd=backend_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Aguardar um pouco para o servidor iniciar
        time.sleep(3)
        
        return process
    except Exception as e:
        print(f"Erro ao iniciar servidor: {e}")
        return None

def test_api():
    """Testa os endpoints da API"""
    base_url = "http://localhost:5001/api"
    
    tests = [
        ("/status", "Status da API"),
        ("/ativos", "Lista de ativos")
    ]
    
    results = []
    
    for endpoint, description in tests:
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=5)
            
            if response.status_code == 200:
                results.append(f"OK {description}: Success")
            else:
                results.append(f"ERRO {description}: HTTP {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            results.append(f"ERRO {description}: Erro de conexao - {e}")
    
    return results

def main():
    print("Testando API Flask...")
    
    # Iniciar servidor
    print("Iniciando servidor...")
    server_process = start_server()
    
    if not server_process:
        print("Falha ao iniciar servidor")
        return False
    
    try:
        # Testar API
        print("Testando endpoints...")
        results = test_api()
        
        # Mostrar resultados
        for result in results:
            print(result)
        
        # Determinar sucesso
        success = all("OK" in result for result in results)
        
        return success
        
    finally:
        # Finalizar servidor
        print("Finalizando servidor...")
        if server_process:
            server_process.terminate()
            server_process.wait()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)