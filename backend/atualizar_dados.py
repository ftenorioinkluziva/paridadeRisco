import pandas as pd
import numpy as np
import yfinance as yf
import matplotlib.pyplot as plt
import seaborn as sns
import requests
from datetime import datetime, timedelta, date
from dateutil.relativedelta import relativedelta
from bcb import sgs  # Biblioteca para acessar dados do Banco Central do Brasil
from postgres_adapter import PostgreSQLClient
import os
import json
from dotenv import load_dotenv

# Carregar variáveis do arquivo .env
load_dotenv()

# Configurações do PostgreSQL
POSTGRES_HOST = os.environ.get('POSTGRES_HOST', 'localhost')
POSTGRES_PORT = os.environ.get('POSTGRES_PORT', '5432')
POSTGRES_DB = os.environ.get('POSTGRES_DB', 'paridaderisco')
POSTGRES_USER = os.environ.get('POSTGRES_USER', 'postgres')
POSTGRES_PASSWORD = os.environ.get('POSTGRES_PASSWORD', 'postgres')

# Verificar se as variáveis de ambiente estão definidas
if not POSTGRES_HOST or not POSTGRES_DB or not POSTGRES_USER or not POSTGRES_PASSWORD:
    raise RuntimeError(
        "Variáveis de ambiente POSTGRES_HOST, POSTGRES_DB, POSTGRES_USER e POSTGRES_PASSWORD precisam estar definidas"
    )

# Inicializar o cliente PostgreSQL
try:
    supabase = PostgreSQLClient()
    print("Conexão com PostgreSQL estabelecida com sucesso.")
except Exception as e:
    print(f"Erro ao conectar com o PostgreSQL: {str(e)}")
    print("Verifique se o PostgreSQL está rodando e as credenciais estão corretas.")
    exit(1)

# Configuração de visualização
sns.set(style='whitegrid')
plt.rcParams['figure.figsize'] = (14, 8)

# Funções de utilidade para trabalhar com datas
def data_atual():
    """Retorna a data atual formatada como string YYYY-MM-DD"""
    return datetime.now().strftime('%Y-%m-%d')

def data_anos_atras(anos=5):
    """Retorna a data de X anos atrás formatada como string YYYY-MM-DD"""
    return (datetime.now() - relativedelta(years=anos)).strftime('%Y-%m-%d')

# Função para obter a data do último registro no banco
def obter_ultimo_registro_data(ticker):
    """
    Obtém a data do registro mais recente para um ticker específico
    
    Args:
        ticker (str): O ticker do ativo
        
    Returns:
        str: Data do último registro no formato 'YYYY-MM-DD' ou None se não houver registros
    """
    try:
        response = supabase.table('dados_historicos') \
            .select('data') \
            .eq('ticker', ticker) \
            .order('data', desc=True) \
            .limit(1) \
            .execute()
            
        if response.data and len(response.data) > 0:
            # Converter para string se for um objeto datetime
            data = response.data[0]['data']
            if isinstance(data, (date, datetime)):
                return data.strftime('%Y-%m-%d')
            return data
        return None
    except Exception as e:
        print(f"⚠️ Erro ao consultar último registro para {ticker}: {str(e)}")
        return None

# Função para verificar se um ativo já existe no banco
def ativo_existe(ticker):
    """
    Verifica se um ativo já existe na tabela 'ativos'
    
    Args:
        ticker (str): O ticker do ativo
        
    Returns:
        bool: True se o ativo existe, False caso contrário
    """
    try:
        response = supabase.table('ativos').select('id').eq('ticker', ticker).execute()
        return len(response.data) > 0
    except Exception as e:
        print(f"⚠️ Erro ao verificar existência do ativo {ticker}: {str(e)}")
        return False

# Função para buscar dados históricos, considerando a última data no banco
def buscar_dados_historicos(ticker, nome):
    """
    Busca dados históricos do Yahoo Finance a partir da última data no banco
    
    Args:
        ticker (str): O ticker do ativo no Yahoo Finance
        nome (str): Nome descritivo do ativo
        
    Returns:
        pandas.DataFrame: DataFrame com os dados históricos ou None em caso de erro/sem novos dados
    """
    try:
        # Buscar último registro no banco
        ultima_data = obter_ultimo_registro_data(ticker)
        
        # Definir a data inicial da busca
        if ultima_data:
            # Se existe registro, buscar a partir do dia seguinte
            data_inicial = datetime.strptime(ultima_data, '%Y-%m-%d') + timedelta(days=1)
            print(f"  Buscando dados para {nome} a partir de {data_inicial.strftime('%Y-%m-%d')}")
        else:
            # Caso contrário, usar a data padrão (5 anos atrás)
            data_inicial = datetime.now() - relativedelta(years=5)
            print(f"  Buscando dados históricos completos para {nome} (5 anos)")
        
        data_final = datetime.now()
        
        # Se a data inicial for maior ou igual à data atual, não há novos dados
        if data_inicial.date() >= data_final.date():
            print(f"  ✅ Dados para {nome} já estão atualizados até {ultima_data}")
            return None
        
        # Se a diferença for de apenas 1 dia, também não há novos dados úteis
        if (data_final.date() - data_inicial.date()).days <= 1:
            print(f"  ✅ Dados para {nome} estão atualizados (diferença mínima)")
            return None
        
        # Buscar dados do Yahoo Finance
        dados = yf.download(
            ticker, 
            start=data_inicial.strftime('%Y-%m-%d'), 
            end=data_final.strftime('%Y-%m-%d'),
            auto_adjust=True, 
            progress=False
        )
        
        if not dados.empty and len(dados) > 0:
            print(f"  ✅ Obtidos {len(dados)} novos registros para {ticker}")
            return dados
        
        print(f"  ✅ Nenhum novo dado disponível para {ticker}")
        return None
            
    except Exception as e:
        print(f"  ⚠️ Erro ao obter dados para {ticker}: {str(e)}")
        return None

# Função para preparar informações básicas do ativo para o banco de dados
def preparar_info_ativo(dados, nome, ticker):
    """
    Prepara informações básicas do ativo para inserção no banco de dados
    
    Args:
        dados (pandas.DataFrame): DataFrame com dados históricos
        nome (str): Nome descritivo do ativo
        ticker (str): O ticker do ativo
        
    Returns:
        dict: Dicionário com as informações básicas do ativo ou None em caso de erro
    """
    try:
        # Verificar se os dados têm múltiplos índices
        if isinstance(dados.columns, pd.MultiIndex):
            # Extrair os dados para as colunas necessárias
            close_col = ('Close', ticker)
            
            # Verificar se a coluna existe
            if close_col not in dados.columns:
                close_cols = [col for col in dados.columns if col[0] == 'Close']
                if close_cols:
                    close_col = close_cols[0]
                else:
                    raise ValueError(f"Não foi possível encontrar coluna 'Close' para {ticker}")
            
            # Obter o preço atual
            preco_atual = float(dados[close_col].iloc[-1])
        else:
            # Se não for multi-índice, usa o dataframe diretamente
            preco_atual = float(dados['Close'].iloc[-1])
        
        # Criar dicionário com informações básicas do ativo
        info_ativo = {
            'ticker': ticker,
            'nome': nome,
            'preco_atual': preco_atual,
            'data_atualizacao': datetime.now().isoformat()
        }
        
        print(f"\nInformações básicas para {nome}:")
        print(f"  Ticker: {info_ativo['ticker']}")
        print(f"  Nome: {info_ativo['nome']}")
        print(f"  Preço atual: {info_ativo['preco_atual']:.2f}")
        print(f"  Data de atualização: {info_ativo['data_atualizacao']}")
        
        return info_ativo
    except Exception as e:
        print(f"⚠️ Erro ao preparar informações básicas para {nome}: {str(e)}")
        return None

# Função para preparar dados para o Supabase - corrigida para lidar com Multi-Índice
def preparar_dados_historicos(dados_multi, ticker, nome):
    """
    Prepara os dados históricos para inserção no banco de dados
    
    Args:
        dados_multi (pandas.DataFrame): DataFrame com dados históricos
        ticker (str): O ticker do ativo
        nome (str): Nome descritivo do ativo
        
    Returns:
        list: Lista de dicionários com os dados formatados para o banco ou lista vazia em caso de erro
    """
    try:
        # Verificar se os dados têm múltiplos índices
        if isinstance(dados_multi.columns, pd.MultiIndex):
            print(f"  Processando dataframe com multi-índice para preparação")
            
            # Extrair os dados para cada coluna necessária
            dados = pd.DataFrame()
            
            # Mapear colunas do multi-índice
            colunas_mapeadas = {
                'Open': ('Open', ticker),
                'High': ('High', ticker),
                'Low': ('Low', ticker),
                'Close': ('Close', ticker),
                'Volume': ('Volume', ticker)
            }
            
            # Verificar cada coluna e adicionar ao dataframe
            for nome_col, multi_col in colunas_mapeadas.items():
                if multi_col in dados_multi.columns:
                    dados[nome_col] = dados_multi[multi_col]
                else:
                    # Tentar alternativas
                    alt_cols = [col for col in dados_multi.columns if col[0] == multi_col[0]]
                    if alt_cols:
                        dados[nome_col] = dados_multi[alt_cols[0]]
                    else:
                        dados[nome_col] = None
        else:
            # Se não for multi-índice, usa o dataframe diretamente
            dados = dados_multi.copy()
        
        # Resetar o índice para transformar a data em uma coluna
        dados = dados.reset_index()
        
        # Calcular Retorno_Diario para uso em outros módulos
        if 'Close' in dados.columns:
            close_values = dados['Close'].values
            retornos = np.zeros_like(close_values)
            for i in range(1, len(close_values)):
                if close_values[i-1] != 0:
                    retornos[i] = (close_values[i] / close_values[i-1] - 1) * 100
            dados['Retorno_Diario'] = retornos
        
        # Renomear colunas para o formato do banco de dados
        colunas_renomeadas = {
            'Date': 'data',
            'Open': 'abertura', 
            'High': 'maxima', 
            'Low': 'minima', 
            'Close': 'fechamento',
            'Volume': 'volume',
            'Retorno_Diario': 'retorno_diario'
        }
        
        # Renomear apenas as colunas que existem no DataFrame
        colunas_para_renomear = {k: v for k, v in colunas_renomeadas.items() if k in dados.columns}
        dados = dados.rename(columns=colunas_para_renomear)
        
        # Adicionar colunas de identificação
        dados['ticker'] = ticker
        dados['nome_ativo'] = nome
        
        # Converter a coluna de data para string no formato ISO
        if isinstance(dados['data'].iloc[0], pd.Timestamp):
            dados['data'] = dados['data'].dt.strftime('%Y-%m-%d')
        elif isinstance(dados['data'].iloc[0], (date, datetime)):
            dados['data'] = dados['data'].apply(lambda x: x.strftime('%Y-%m-%d') if x is not None else None)

        # NOVO: Calcular indicadores técnicos
        dados = calcular_indicadores_tecnicos(dados)
        
        # ✅ Converter NaN e NaT para None para evitar erro no Supabase
        dados = dados.replace({np.nan: None})
        
        # Converter para o formato que o Supabase espera
        registros = dados.to_dict('records')
        
        return registros
    except Exception as e:
        print(f"⚠️ Erro ao preparar dados históricos para {nome}: {str(e)}")
        return []

# Função para inserir ou atualizar informações do ativo
def upsert_ativo(info_ativo):
    """
    Insere ou atualiza informações de um ativo no banco de dados
    
    Args:
        info_ativo (dict): Dicionário com informações do ativo
        
    Returns:
        bool: True se a operação foi bem-sucedida, False caso contrário
    """
    if not info_ativo:
        return False
    
    try:
        # Usar upsert para inserir ou atualizar
        resultado = supabase.table('ativos').upsert(info_ativo, on_conflict='ticker').execute()
            
        print(f"✅ Informações básicas de {info_ativo['nome']} inseridas/atualizadas na tabela ativos")
        return True
    except Exception as e:
        print(f"⚠️ Erro ao inserir/atualizar {info_ativo['nome']}: {str(e)}")
        print("Verifique se a tabela 'ativos' existe e tem a estrutura correta.")
        return False

# Função para inserir ou atualizar dados históricos
def calcular_indicadores_tecnicos(df):
    """
    Calcula indicadores técnicos para um DataFrame de preços:
    - mm20: Média móvel de 20 períodos
    - bb2s: Banda de Bollinger superior (2 desvios padrão)
    - bb2i: Banda de Bollinger inferior (2 desvios padrão)
    
    Args:
        df (pandas.DataFrame): DataFrame com dados históricos ordenados por data
        
    Returns:
        pandas.DataFrame: DataFrame original com indicadores adicionados
    """
    if df.empty:
        return df
    
    # Garantir que o DataFrame está ordenado por data
    if 'data' in df.columns:
        df = df.sort_values('data')
    
    # Calcular Média Móvel de 20 períodos
    df['mm20'] = df['fechamento'].rolling(window=20).mean()
    
    # Calcular desvio padrão para as Bandas de Bollinger
    std_20 = df['fechamento'].rolling(window=20).std()
    
    # Calcular Bandas de Bollinger (2 desvios padrão)
    df['bb2s'] = df['mm20'] + (std_20 * 2)  # Banda superior
    df['bb2i'] = df['mm20'] - (std_20 * 2)  # Banda inferior
    
    return df


    if not dados_historicos:
        return False
    
    try:
        print(f"Inserindo dados históricos para {ticker}...")
        print(f"Total de registros a processar: {len(dados_historicos)}")
        
        # Imprimir exemplo de registro para depuração
        if len(dados_historicos) > 0:
            print("Amostra de registro a ser inserido:")
            print({k: str(v) if v is not None else None for k, v in dados_historicos[0].items()})
        
        # Processar em lotes para melhor performance
        tamanho_lote = 100
        total_lotes = (len(dados_historicos) - 1) // tamanho_lote + 1
        
        for i in range(0, len(dados_historicos), tamanho_lote):
            lote = dados_historicos[i:i+tamanho_lote]
            
            # Garantir que cada registro tenha apenas as colunas existentes na tabela
            lote_filtrado = []
            for registro in lote:
                registro_filtrado = {
                    'ticker': registro.get('ticker'),
                    'nome_ativo': registro.get('nome_ativo'),
                    'data': registro.get('data'),
                    'abertura': registro.get('abertura'),
                    'maxima': registro.get('maxima'),
                    'minima': registro.get('minima'),
                    'fechamento': registro.get('fechamento'),
                    'fechamento_ajustado': registro.get('fechamento_ajustado'),
                    'volume': registro.get('volume'),
                    'retorno_diario': registro.get('retorno_diario'),
                    'pico': registro.get('pico'),
                    'drawdown': registro.get('drawdown')
                }
                lote_filtrado.append(registro_filtrado)
            
            # Usar upsert com as colunas de conflito corretas
            supabase.table('dados_historicos').upsert(
                lote_filtrado, 
                on_conflict='ticker,data'
            ).execute()
            
            print(f"  Processado lote {i//tamanho_lote + 1}/{total_lotes}")
        
        print(f"✅ Dados históricos processados para {ticker}")
        return True
    except Exception as e:
        print(f"⚠️ Erro ao inserir dados históricos de {ticker}: {str(e)}")
        return False

def inserir_dados_historicos(dados_historicos, ticker):
    if not dados_historicos:
        return False
    
    try:
        print(f"Inserindo dados históricos para {ticker}...")
        print(f"Total de registros a processar: {len(dados_historicos)}")
        
        # Imprimir exemplo de registro para depuração
        if len(dados_historicos) > 0:
            print("Amostra de registro a ser inserido:")
            print({k: str(v) if v is not None else None for k, v in dados_historicos[0].items()})
        
        # Processar em lotes para melhor performance
        tamanho_lote = 100
        total_lotes = (len(dados_historicos) - 1) // tamanho_lote + 1
        
        for i in range(0, len(dados_historicos), tamanho_lote):
            lote = dados_historicos[i:i+tamanho_lote]
            
            # Garantir que cada registro tenha apenas as colunas existentes na tabela
            lote_filtrado = []
            for registro in lote:
                registro_filtrado = {
                    'ticker': registro.get('ticker'),
                    'nome_ativo': registro.get('nome_ativo'),
                    'data': registro.get('data'),
                    'abertura': registro.get('abertura'),
                    'maxima': registro.get('maxima'),
                    'minima': registro.get('minima'),
                    'fechamento': registro.get('fechamento'),
                    'retorno_diario': registro.get('retorno_diario'),
                    'mm20': registro.get('mm20'),
                    'bb2s': registro.get('bb2s'),
                    'bb2i': registro.get('bb2i')
                }
                lote_filtrado.append(registro_filtrado)
            
            # Usar upsert com as colunas de conflito corretas
            supabase.table('dados_historicos').upsert(
                lote_filtrado, 
                on_conflict='ticker,data'
            ).execute()
            
            print(f"  Processado lote {i//tamanho_lote + 1}/{total_lotes}")
        
        print(f"✅ Dados históricos processados para {ticker}")
        return True
    except Exception as e:
        print(f"⚠️ Erro ao inserir dados históricos de {ticker}: {str(e)}")
        return False

# Processar dados do CDI do Banco Central
def processar_cdi():
    """
    Obtém e processa dados do CDI via API do Banco Central do Brasil
    
    Returns:
        pandas.DataFrame: DataFrame com dados do CDI ou None em caso de erro
    """
    try:
        print("\nObtendo dados do CDI via Banco Central do Brasil...")
        
        # Verificar a última data e o último valor no banco
        ultima_data = obter_ultimo_registro_data('CDI')
        ultimo_valor = None
        
        if ultima_data:
            # Buscar o último valor para usar como base de continuidade
            try:
                response = supabase.table('dados_historicos') \
                    .select('fechamento') \
                    .eq('ticker', 'CDI') \
                    .eq('data', ultima_data) \
                    .execute()
                
                if response.data and len(response.data) > 0:
                    ultimo_valor = response.data[0]['fechamento']
                    print(f"  Último valor do CDI no banco: {ultimo_valor} em {ultima_data}")
            except Exception as e:
                print(f"  ⚠️ Erro ao buscar último valor do CDI: {str(e)}")
        
        # Definir data inicial
        if ultima_data:
            data_inicial = datetime.strptime(ultima_data, '%Y-%m-%d') + timedelta(days=1)
            print(f"  Buscando CDI a partir de {data_inicial.strftime('%Y-%m-%d')}")
        else:
            data_inicial = datetime.now() - relativedelta(years=9)
            print(f"  Buscando histórico completo do CDI (9 anos)")
        
        data_final = datetime.now()
        
        # Verificar se precisamos buscar novos dados
        if data_inicial.date() >= data_final.date():
            print(f"  ✅ Dados do CDI já estão atualizados até {ultima_data}")
            return None
        
        # Código 12 = CDI na API do BCB
        try:
            cdi_diario = sgs.get({'CDI': 12}, 
                                 start=data_inicial.strftime('%Y-%m-%d'), 
                                 end=data_final.strftime('%Y-%m-%d'))
        except Exception as api_error:
            print(f"  ⚠️ Erro específico da API do BCB: {str(api_error)}")
            # Tentar com um período menor (últimos 30 dias)
            try:
                print("  Tentando com período reduzido (últimos 30 dias)...")
                data_inicial_reduzida = datetime.now() - timedelta(days=30)
                cdi_diario = sgs.get({'CDI': 12}, 
                                     start=data_inicial_reduzida.strftime('%Y-%m-%d'), 
                                     end=data_final.strftime('%Y-%m-%d'))
            except Exception as fallback_error:
                print(f"  ⚠️ Erro também com período reduzido: {str(fallback_error)}")
                return None
        
        if not cdi_diario.empty:
            print(f"  ✅ Obtidos {len(cdi_diario)} registros para CDI")
            
            # Convertendo taxa diária para valores acumulados
            cdi_diario['CDI_Acumulado'] = (1 + cdi_diario['CDI']/100).cumprod()
            
            # Se temos um valor anterior, usamos ele como base para manter a continuidade
            if ultimo_valor is not None:
                # Normalizando para manter a continuidade com o valor existente
                primeiro_valor_novo = cdi_diario['CDI_Acumulado'].iloc[0] / (1 + cdi_diario['CDI'].iloc[0]/100)
                fator_ajuste = ultimo_valor / 100
                cdi_diario['CDI_Indice'] = cdi_diario['CDI_Acumulado'] / primeiro_valor_novo * ultimo_valor
                print(f"  Mantendo continuidade com valor anterior: {ultimo_valor}")
            else:
                # Se não temos valor anterior, começamos de 100
                primeiro_valor = cdi_diario['CDI_Acumulado'].iloc[0]
                cdi_diario['CDI_Indice'] = cdi_diario['CDI_Acumulado'] / primeiro_valor * 100
                print("  Iniciando série do CDI com base 100")
            
            # Adicionando colunas para compatibilidade
            cdi_diario['Open'] = cdi_diario['CDI_Indice']
            cdi_diario['High'] = cdi_diario['CDI_Indice']
            cdi_diario['Low'] = cdi_diario['CDI_Indice']
            cdi_diario['Close'] = cdi_diario['CDI_Indice']
            cdi_diario['Volume'] = 0

            # Calcular retorno diário com base no 'Close'
            cdi_diario['Retorno_Diario'] = cdi_diario['Close'].pct_change() * 100
            # Colocar o valor correto para o primeiro dia
            if not cdi_diario.empty:
                cdi_diario.loc[cdi_diario.index[0], 'Retorno_Diario'] = cdi_diario['CDI'].iloc[0]
            
            return cdi_diario
        else:
            print("  ⚠️ Não foi possível obter dados do CDI para o período especificado.")
            return None
            
    except Exception as e:
        print(f"⚠️ Erro ao obter dados do CDI: {str(e)}")
        return None

# Função principal para atualizar dados
def atualizar_dados():
    """Função principal que coordena a atualização de todos os dados"""
    
    # Corrigir sequência de ID se necessário
    try:
        from fix_sequence import fix_sequence
        fix_sequence()
    except Exception as e:
        print(f"Aviso: Não foi possível corrigir sequência: {e}")
    
    # Lista de ativos com tickers corretos
    ativos = {
        'BOVA11.SA': 'BOVA11 (Ibovespa)',
        'XFIX11.SA': 'XFIX11 (IFIX)',
        'IB5M11.SA': 'IB5M11 (IMAB5+)',
        'B5P211.SA': 'B5P211 (IMAB5)',
        'FIXA11.SA': 'FIXA11 (Pré)',
        'USDBRL=X': 'USD/BRL (Dólar)'
    }
    
    # Dicionário para armazenar os dados
    dados_ativos = {}
    
    # 1. Obtendo dados para ETFs e ações via Yahoo Finance
    print("\n📊 Obtendo dados de ETFs e ações via Yahoo Finance...")
    
    for ticker, nome in ativos.items():
        try:
            print(f"\nProcessando {nome} ({ticker})...")
            
            # Buscar apenas dados novos
            dados = buscar_dados_historicos(ticker, nome)
            
            if dados is not None and not dados.empty and len(dados) > 0:
                dados_ativos[ticker] = dados
                
                # Preparar informações básicas do ativo
                info_ativo = preparar_info_ativo(dados, nome, ticker)
                if info_ativo:
                    # Inserir/atualizar informações do ativo
                    upsert_ativo(info_ativo)
                    
                    # Preparar e inserir dados históricos
                    dados_historicos = preparar_dados_historicos(dados, ticker, nome)
                    inserir_dados_historicos(dados_historicos, ticker)
            else:
                print(f"Não foram encontrados novos dados para {ticker}")
                
        except Exception as e:
            print(f"⚠️ Erro ao obter/processar dados para {ticker}: {str(e)}")
    
    # 2. Processando dados do CDI
    cdi_diario = processar_cdi()
    
    if cdi_diario is not None and not cdi_diario.empty:
        dados_ativos['CDI'] = cdi_diario

        # Preparar informações básicas do CDI
        nome_cdi = 'CDI'
        info_cdi = preparar_info_ativo(cdi_diario, nome_cdi, 'CDI')
        if info_cdi:
            # Inserir/atualizar informações do CDI
            upsert_ativo(info_cdi)
            
            # Preparar e inserir dados históricos do CDI
            dados_historicos_cdi = preparar_dados_historicos(cdi_diario, 'CDI', nome_cdi)
            inserir_dados_historicos(dados_historicos_cdi, 'CDI')
    
    print("\n✅ Processo de atualização do banco de dados concluído!")

# Executar o script
if __name__ == "__main__":
    print("\n🚀 Iniciando atualização de dados financeiros...")
    atualizar_dados()