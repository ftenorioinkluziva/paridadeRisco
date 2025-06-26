import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import CestasManager from './components/CestasManager';
import CestaComposition from './components/CestaComposition';
import TransactionManager from './components/TransactionManager/index';
import CustomDateRange from './components/CustomDateRange';
import DateRangeDisplay from './components/DateRangeDisplay';

// Configuração de API inteligente
const getApiUrl = () => {
  const hostname = window.location.hostname;
  
  console.log('Current hostname:', hostname);
  
  // Se estiver rodando localmente
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://127.0.0.1:5001/api';  // Alterado para 127.0.0.1
  }
  
  // Se estiver no Cloudflare Tunnel
  if (hostname === 'riskyparity.blackboxinovacao.com.br') {
    return 'https://apirisky.blackboxinovacao.com.br/api';
  }
  
  // Fallback
  return 'https://apirisky.blackboxinovacao.com.br/api';
};

const API_URL = getApiUrl();
console.log('Using API URL:', API_URL);


// Função para fazer chamadas API com fallback
const apiCall = async (endpoint, options = {}) => {
  const urls = [
    `${API_URL}${endpoint}`,
    // Fallback para HTTP se HTTPS falhar
    API_URL.includes('https://') ? `${API_URL.replace('https://', 'http://')}${endpoint}` : null
  ].filter(Boolean);
  
  for (const url of urls) {
    try {
      console.log(`Tentando: ${url}`);
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      if (response.ok) {
        console.log(`✅ Sucesso: ${url}`);
        return await response.json();
      } else {
        console.warn(`❌ Falhou (${response.status}): ${url}`);
      }
    } catch (error) {
      console.warn(`❌ Erro de rede: ${url}`, error.message);
    }
  }
  
  throw new Error('Não foi possível conectar com a API');
};

function App() {
  // Estados para armazenar dados
  const [ativos, setAtivos] = useState([]);
  const [selecionados, setSelecionados] = useState(['BOVA11.SA', 'CDI', 'XFIX11.SA', 'IB5M11.SA']);
  const [periodoComparativo, setPeriodoComparativo] = useState(1095); // 3 anos = 365*3
  const [dadosComparativos, setDadosComparativos] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [apiStatus, setApiStatus] = useState(null);

  const [mostrarCestaConfig, setMostrarCestaConfig] = useState(false);
  const [cestaAtivos, setCestaAtivos] = useState({});
  const [nomeCesta, setNomeCesta] = useState("Minha Cesta");
  const [exibirCesta, setExibirCesta] = useState(false);
  const [dadosCesta, setDadosCesta] = useState([]);

  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [isCustomDateRange, setIsCustomDateRange] = useState(false);
  
  // Estado para armazenar dados históricos processados para cálculos consistentes
  const [dadosProcessados, setDadosProcessados] = useState({});

  // Estado para controlar o gerenciador de cestas
  const [mostrarGerenciadorCestas, setMostrarGerenciadorCestas] = useState(false);

  // Referência para o formulário de pesos da cesta
  const cestaFormRef = useRef(null);

  // Função para testar a conexão com a API
  const testarConexaoAPI = async () => {
    try {
      console.log('🔍 Testando conexão com API...');
      const data = await apiCall('/status');
      console.log('✅ API Status:', data);
      setApiStatus(data);
      return true;
    } catch (error) {
      console.error('❌ Erro ao conectar com API:', error);
      setErro(`Não foi possível conectar à API. Tentativas feitas em: ${API_URL}`);
      return false;
    }
  };

  // Verificar status da API quando o componente carrega
  useEffect(() => {
    const verificarStatus = async () => {
      const conectado = await testarConexaoAPI();
      if (!conectado) {
        // Tentar novamente após 5 segundos
        setTimeout(() => {
          testarConexaoAPI();
        }, 5000);
      }
    };

    verificarStatus();
  }, []);

  // Carregar lista de ativos disponíveis
  useEffect(() => {
    const carregarAtivos = async () => {
      if (!apiStatus || apiStatus.status !== 'online') {
        return;
      }

      try {
        setCarregando(true);
        const data = await apiCall('/ativos');

        if (data && Array.isArray(data)) {
          setAtivos(data);
          console.log('✅ Ativos carregados:', data.length);

          // Se não houver ativos selecionados e temos dados, selecione os dois primeiros
          if (selecionados.length === 0 && data.length > 0) {
            const iniciais = data.slice(0, Math.min(2, data.length)).map(a => a.ticker);
            setSelecionados(iniciais);
          }
        }
        setErro(null);
      } catch (error) {
        console.error('Erro ao carregar ativos:', error);
        setErro('Erro ao carregar a lista de ativos. Verifique a conexão com o servidor.');
      } finally {
        setCarregando(false);
      }
    };

    carregarAtivos();
  }, [apiStatus, selecionados.length]);

  // Adicione esta função para calcular os dados da cesta ponderada
  const calcularCesta = useCallback((dadosProcessados, pesos) => {
    // Verificar se temos dados suficientes
    if (Object.keys(dadosProcessados).length === 0 || Object.keys(pesos).length === 0) {
      return;
    }
    
    // Normalizar pesos para garantir que somem 100%
    const totalPesos = Object.values(pesos).reduce((a, b) => a + b, 0);
    const pesosNormalizados = {};
    Object.entries(pesos).forEach(([ticker, peso]) => {
      pesosNormalizados[ticker] = peso / totalPesos;
    });
    
    // Encontrar a data mais antiga comum a todos os ativos
    let datasComuns = new Set();
    let primeiroLoop = true;
    
    Object.entries(dadosProcessados).forEach(([ticker, dados]) => {
      if (!pesosNormalizados[ticker]) return;
      
      const datasAtivo = new Set(dados.fechamentoAjustado.map(d => d.data));
      
      if (primeiroLoop) {
        datasComuns = datasAtivo;
        primeiroLoop = false;
      } else {
        datasComuns = new Set([...datasComuns].filter(data => datasAtivo.has(data)));
      }
    });
    
    // Converter para array e ordenar
    const datasOrdenadas = [...datasComuns].sort((a, b) => new Date(a) - new Date(b));
    
    if (datasOrdenadas.length === 0) {
      console.log("Nenhuma data comum encontrada entre os ativos da cesta");
      return;
    }
    
    // Criar objeto com os valores normalizados de cada ativo para cada data
    const valoresNormalizados = {};
    
    Object.entries(dadosProcessados).forEach(([ticker, dados]) => {
      if (!pesosNormalizados[ticker]) return;
      
      // Mapear fechamentos para um objeto data -> valor
      const fechamentoPorData = {};
      dados.fechamentoAjustado.forEach(item => {
        fechamentoPorData[item.data] = item.valor;
      });
      
      // Obter o valor inicial (primeira data comum)
      const valorInicial = fechamentoPorData[datasOrdenadas[0]];
      
      if (!valorInicial) return;
      
      // Calcular valores normalizados
      valoresNormalizados[ticker] = {};
      
      datasOrdenadas.forEach(data => {
        if (fechamentoPorData[data]) {
          // Retorno normalizado (base 0)
          valoresNormalizados[ticker][data] = (fechamentoPorData[data] / valorInicial - 1) * 100;
        }
      });
    });
    
    // Calcular o valor da cesta para cada data
    const cestaValores = [];
    
    datasOrdenadas.forEach(data => {
      let valorCesta = 0;
      let pesoTotal = 0;
      
      Object.entries(pesosNormalizados).forEach(([ticker, peso]) => {
        if (valoresNormalizados[ticker] && valoresNormalizados[ticker][data] !== undefined) {
          valorCesta += valoresNormalizados[ticker][data] * peso;
          pesoTotal += peso;
        }
      });
      
      // Ajustar para o peso total válido nesta data
      if (pesoTotal > 0) {
        valorCesta = valorCesta / pesoTotal * totalPesos / 100;
      }
      
      cestaValores.push({
        data,
        valor: valorCesta
      });
    });
    
    setDadosCesta(cestaValores);
    
    // Atualizar dadosComparativos com os valores da cesta
    setDadosComparativos(prev => ({
      ...prev,
      [nomeCesta]: cestaValores
    }));
    
  }, [nomeCesta]);

  // Função para calcular desvio padrão
  const calcularDesvPadrao = useCallback((valores) => {
    if (valores.length === 0) return 0;
    
    const media = valores.reduce((soma, valor) => soma + valor, 0) / valores.length;
    const variancia = valores.reduce((soma, valor) => soma + Math.pow(valor - media, 2), 0) / valores.length;
    
    return Math.sqrt(variancia);
  }, []);

  // Função para obter o último retorno acumulado (para mostrar no mesmo formato do gráfico)
  const getUltimoRetornoAcumulado = useCallback((ticker) => {
    if (!dadosComparativos[ticker] || !Array.isArray(dadosComparativos[ticker]) || dadosComparativos[ticker].length === 0) {
      return null;
    }
    
    // Ordenar dados por data e pegar o último valor
    const dadosOrdenados = [...dadosComparativos[ticker]].sort((a, b) => 
      new Date(a.data) - new Date(b.data)
    );
    
    // Retornar o último valor do período
    return dadosOrdenados[dadosOrdenados.length - 1].valor;
  }, [dadosComparativos]);

  // Função para processar dados históricos e calcular retornos de forma consistente
  const processarDadosHistoricos = useCallback((dadosHistoricos) => {
    const processados = {};
    const dadosComparativosTemp = {};
    
    // Para cada ativo, calcular retornos e estatísticas
    for (const [ticker, dados] of Object.entries(dadosHistoricos)) {
      if (!Array.isArray(dados) || dados.length === 0) continue;
      
      // Ordenar dados por data
      const dadosOrdenados = [...dados].sort((a, b) => 
        new Date(a.data) - new Date(b.data)
      );
      
      // Pegar o primeiro valor para normalização
      const primeiroValor = dadosOrdenados[0].fechamento;
      const ultimoValor = dadosOrdenados[dadosOrdenados.length - 1].fechamento;
      
      if (!primeiroValor) continue;
      
      // Calcular retorno total do período
      const retornoTotal = ((ultimoValor / primeiroValor) - 1) * 100;
      
      // Calcular retorno anualizado
      const diasTotais = (new Date(dadosOrdenados[dadosOrdenados.length - 1].data) - 
                         new Date(dadosOrdenados[0].data)) / (1000 * 60 * 60 * 24);
      const retornoAnualizado = ((1 + retornoTotal / 100) ** (365 / Math.max(diasTotais, 1)) - 1) * 100;
      
      // Calcular retornos diários e volatilidade
      const retornosDiarios = [];
      for (let i = 1; i < dadosOrdenados.length; i++) {
        if (dadosOrdenados[i-1].fechamento && dadosOrdenados[i].fechamento) {
          const retornoDiario = (dadosOrdenados[i].fechamento / dadosOrdenados[i-1].fechamento - 1) * 100;
          retornosDiarios.push(retornoDiario);
        }
      }
      
      // Calcular volatilidade anualizada
      const volatilidade = calcularDesvPadrao(retornosDiarios) * Math.sqrt(252);
      
      // Calcular drawdown máximo
      let maxDrawdown = 0;
      let picoDado = primeiroValor;
      
      for (const dado of dadosOrdenados) {
        if (dado.fechamento > picoDado) {
          picoDado = dado.fechamento;
        } else {
          const drawdown = (dado.fechamento / picoDado - 1) * 100;
          if (drawdown < maxDrawdown) {
            maxDrawdown = drawdown;
          }
        }
      }
      
      // Preparar dados para o gráfico comparativo (base 0)
      dadosComparativosTemp[ticker] = dadosOrdenados.map(dado => ({
        data: dado.data,
        valor: ((dado.fechamento / primeiroValor) - 1) * 100 // Retorno percentual desde o início
      }));
      
      // Armazenar estatísticas calculadas
      processados[ticker] = {
        dados: dadosOrdenados,
        primeiroValor,
        ultimoValor,
        retornoTotal,
        retornoAnualizado,
        volatilidade,
        maxDrawdown,
        retornosDiarios,
        fechamentoAjustado: dadosOrdenados.map(d => ({
          data: d.data,
          valor: d.fechamento
        }))
      };
    }
    
    setDadosProcessados(processados);
    setDadosComparativos(dadosComparativosTemp);

    // Calcular a cesta se ela estiver habilitada e houver ativos suficientes
    if (exibirCesta && Object.keys(cestaAtivos).length > 0) {
      calcularCesta(processados, cestaAtivos);
    }
  }, [calcularDesvPadrao, cestaAtivos, exibirCesta, calcularCesta]);

  // Função para lidar com a seleção de cestas
  const handleCestaSelect = (cesta) => {
    setNomeCesta(cesta.nome);
    setCestaAtivos(cesta.ativos);
    setExibirCesta(true);
    setMostrarGerenciadorCestas(false);
    
    // Recalcular cesta para exibição
    calcularCesta(dadosProcessados, cesta.ativos);
  };

  const handleCustomDateRangeChange = (days, startDate, endDate) => {
    // Update period state
    setPeriodoComparativo(days);
    
    // Store custom date range
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
    setIsCustomDateRange(true);
    
    // Log for debugging
    console.log(`Custom date range selected: ${startDate} to ${endDate} (${days} days)`);
  };
  
  //function to reset custom date range when a preset period is selected
  const handlePeriodoChange = (dias) => {
    setPeriodoComparativo(dias);
    // Clear custom date range when user selects a preset
    setIsCustomDateRange(false);
    setCustomStartDate(null);
    setCustomEndDate(null);
  };

  // Carregar dados históricos para cada ativo selecionado
  useEffect(() => {
    const carregarDadosHistoricos = async () => {
      if (selecionados.length === 0 || !apiStatus || apiStatus.status !== 'online') return;

      setCarregando(true);
      try {
        const dadosHistoricos = {};

        // Process each selected ticker
        for (const ticker of selecionados) {
          let endpoint;

          if (isCustomDateRange && customStartDate && customEndDate) {
            // Use the custom date range endpoint
            console.log(`Using custom date range for ${ticker}: ${customStartDate} to ${customEndDate}`);
            endpoint = `/historico-range/${ticker}?dataInicio=${customStartDate}&dataFim=${customEndDate}`;
          } else {
            // Use the existing period-based endpoint
            endpoint = `/historico/${ticker}?dias=${periodoComparativo}`;
          }

          try {
            const data = await apiCall(endpoint);
            if (data && Array.isArray(data)) {
              dadosHistoricos[ticker] = data;
            } else {
              console.warn(`No data returned for ${ticker} or unexpected format`);
            }
          } catch (error) {
            console.warn(`Error loading data for ${ticker}:`, error);
          }
        }

        // Process the data
        processarDadosHistoricos(dadosHistoricos);

        setErro(null);
      } catch (error) {
        console.error('Erro ao carregar dados históricos:', error);
        setErro('Erro ao carregar dados históricos. Verifique a conexão com o servidor.');
      } finally {
        setCarregando(false);
      }
    };

    carregarDadosHistoricos();
  }, [selecionados, periodoComparativo, customStartDate, customEndDate, isCustomDateRange, apiStatus, processarDadosHistoricos]);
  
  // Manipular seleção/desseleção de ativos
  const handleSelecaoAtivo = (ticker) => {
    if (selecionados.includes(ticker)) {
      setSelecionados(selecionados.filter(t => t !== ticker));
    } else {
      setSelecionados([...selecionados, ticker]);
    }
  };

  // Funções para manipular a cesta
  const handlePesoChange = (ticker, valor) => {
    setCestaAtivos(prev => ({
      ...prev,
      [ticker]: parseFloat(valor) || 0
    }));
  };

  // Atualizar a cesta com os pesos definidos
  const atualizarCesta = async () => {
    if (Object.keys(cestaAtivos).length === 0) {
      setErro("Adicione pelo menos um ativo à cesta");
      return;
    }

    // Filtrar ativos com peso > 0
    const pesosFiltrados = {};
    let somaTotal = 0;

    Object.entries(cestaAtivos).forEach(([ticker, peso]) => {
      if (peso > 0) {
        pesosFiltrados[ticker] = peso;
        somaTotal += peso;
      }
    });

    if (somaTotal === 0) {
      setErro("A soma dos pesos deve ser maior que zero");
      return;
    }

    // Normalizar pesos para 100%
    Object.keys(pesosFiltrados).forEach(ticker => {
      pesosFiltrados[ticker] = (pesosFiltrados[ticker] / somaTotal) * 100;
    });

    setCestaAtivos(pesosFiltrados);
    setExibirCesta(true);
    setMostrarCestaConfig(false);

    // Recalcular cesta
    calcularCesta(dadosProcessados, pesosFiltrados);

    // Perguntar ao usuário se deseja salvar a cesta
    const desejaSalvar = window.confirm(
      `Deseja salvar a cesta "${nomeCesta}" para uso futuro?`
    );

    if (desejaSalvar) {
      try {
        setCarregando(true);

        const cestaDados = {
          nome: nomeCesta,
          descricao: `Cesta criada em ${new Date().toLocaleDateString()}`,
          ativos: pesosFiltrados
        };

        await apiCall('/cesta', {
          method: 'POST',
          body: JSON.stringify(cestaDados)
        });

        setErro(null);
        alert(`Cesta "${nomeCesta}" salva com sucesso!`);
      } catch (error) {
        console.error('Erro ao salvar cesta:', error);
        setErro("Erro ao salvar cesta. Verifique a conexão com o servidor.");
      } finally {
        setCarregando(false);
      }
    }
  };

  // Preparar dados para o gráfico
  const prepararDadosGrafico = useCallback(() => {
    if (Object.keys(dadosComparativos).length === 0) return [];

    // Encontrar todas as datas únicas
    const todasDatas = new Set();
    Object.values(dadosComparativos).forEach(dados => {
      if (Array.isArray(dados)) {
        dados.forEach(item => {
          if (item && item.data) {
            todasDatas.add(item.data);
          }
        });
      }
    });

    // Criar array de datas ordenadas
    const datasOrdenadas = Array.from(todasDatas).sort();

    // Criar dados para o gráfico com base 0
    return datasOrdenadas.map(data => {
      const ponto = { data };
      
      Object.entries(dadosComparativos).forEach(([ticker, dados]) => {
        if (Array.isArray(dados)) {
          const dataPoint = dados.find(d => d && d.data === data);
          if (dataPoint && dataPoint.valor !== null && dataPoint.valor !== undefined) {
            ponto[ticker] = dataPoint.valor;
          }
        }
      });
      
      return ponto;
    });
  }, [dadosComparativos]);

  const dadosGrafico = prepararDadosGrafico();

  // Cores para as linhas do gráfico
  const cores = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2'];

  // Formatar data para exibição
  const formatarData = (data) => {
    if (!data) return '';
    const d = new Date(data);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };
  
  // Obter o nome de exibição de um ativo
  const getNomeAtivo = useCallback((ticker) => {
    const ativo = ativos.find(a => a.ticker === ticker);
    return ativo ? ativo.nome : ticker;
  }, [ativos]);
  
  // Mapear períodos para dias
  const periodos = {
    '30 dias': 30,
    '90 dias': 90,
    '6 meses': 180,
    '1 ano': 365,
    '3 anos': 1095,
    '5 anos': 1825
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard de Ativos Financeiros</h1>
            <p className="text-blue-100 mt-1">
              Análise comparativa de investimentos
            </p>
          </div>
          <div className="text-right text-sm">
            <div>API: {API_URL}</div>
            <div>Status: {apiStatus ? '🟢 Online' : '🔴 Offline'}</div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        {erro && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <strong>Erro de Conectividade:</strong> {erro}
            <button 
              onClick={() => window.location.reload()} 
              className="ml-4 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
            >
              Tentar Novamente
            </button>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Painel lateral esquerdo */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <h2 className="text-xl font-semibold mb-3 text-gray-800">Selecione os Ativos</h2>
              {carregando && ativos.length === 0 ? (
                <p className="text-gray-500">Carregando ativos...</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {ativos.map((ativo) => (
                    <button
                      key={ativo.ticker}
                      className={`px-3 py-1 rounded text-sm transition-colors duration-200 ${
                        selecionados.includes(ativo.ticker)
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                      onClick={() => handleSelecaoAtivo(ativo.ticker)}
                    >
                      {ativo.nome}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              {/* Display current date range information */}
              {isCustomDateRange && customStartDate && customEndDate && (
                <DateRangeDisplay 
                  startDate={customStartDate} 
                  endDate={customEndDate} 
                  periodoComparativo={periodoComparativo} 
                />
              )}

              <CustomDateRange onDateRangeChange={handleCustomDateRangeChange} />
              
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(periodos).map(([nome, dias]) => (
                  <button
                    key={nome}
                    className={`px-3 py-1 rounded text-sm transition-colors duration-200 ${
                      periodoComparativo === dias && !isCustomDateRange
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                    onClick={() => handlePeriodoChange(dias)}
                  >
                    {nome}
                  </button>
                ))}
              </div>
              
              <div className="flex justify-between items-center mb-3">
                <div>
                  <button 
                    onClick={() => setMostrarCestaConfig(!mostrarCestaConfig)}
                    className="px-3 py-1 rounded text-sm bg-purple-500 text-white hover:bg-purple-600 mr-2"
                  >
                    {mostrarCestaConfig ? 'Fechar' : 'Criar Cesta'}
                  </button>
                  <button 
                    onClick={() => setMostrarGerenciadorCestas(true)}
                    className="px-3 py-1 rounded text-sm bg-blue-500 text-white hover:bg-blue-600"
                  >
                    Gerenciar Cestas
                  </button>
                </div>
              </div>
              
              {/* Botão para alternar visibilidade da cesta */}
              {exibirCesta && (
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="toggle-cesta" 
                      checked={exibirCesta}
                      onChange={() => setExibirCesta(!exibirCesta)}
                      className="mr-2"
                    />
                    <label htmlFor="toggle-cesta" className="text-sm">
                      Exibir {nomeCesta}
                    </label>
                  </div>
                  <button
                    onClick={() => setMostrarCestaConfig(true)}
                    className="text-blue-500 text-sm hover:text-blue-700"
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>

            {/* Painel de configuração da cesta */}
            {mostrarCestaConfig && (
              <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <h2 className="text-lg font-semibold mb-3 text-gray-800">Configurar Cesta de Ativos</h2>
                
                <div className="mb-4">
                  <label htmlFor="nome-cesta" className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Cesta
                  </label>
                  <input
                    type="text"
                    id="nome-cesta"
                    value={nomeCesta}
                    onChange={(e) => setNomeCesta(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="Ex: Minha Cesta Balanceada"
                  />
                </div>
                
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Composição (Pesos %)</h3>
                  <form ref={cestaFormRef}>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {ativos.filter(ativo => selecionados.includes(ativo.ticker)).map(ativo => (
                        <div key={ativo.ticker} className="flex items-center">
                          <label className="inline-block w-28 truncate text-sm" title={ativo.nome}>
                            {ativo.nome}:
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={cestaAtivos[ativo.ticker] || 0}
                            onChange={(e) => handlePesoChange(ativo.ticker, e.target.value)}
                            className="w-20 p-1 border border-gray-300 rounded text-right"
                          />
                          <span className="ml-1 text-sm">%</span>
                        </div>
                      ))}
                    </div>
                  </form>
                </div>
                
                <div className="flex justify-between">
                  <button
                    onClick={() => setMostrarCestaConfig(false)}
                    className="px-3 py-1 rounded text-sm bg-gray-200 hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={atualizarCesta}
                    className="px-3 py-1 rounded text-sm bg-blue-500 text-white hover:bg-blue-600"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            )}

            {/* Tabela de Estatísticas */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-semibold mb-3 text-gray-800">Estatísticas dos Ativos</h2>
              {carregando ? (
                <p className="text-gray-500">Carregando estatísticas...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ativo</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Retorno (%)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selecionados.map(ticker => {
                        const ativo = ativos.find(a => a.ticker === ticker);
                        const dados = dadosProcessados[ticker];
                        const retornoAcumulado = getUltimoRetornoAcumulado(ticker);
                        
                        return (
                          <tr key={ticker} className="hover:bg-gray-50">
                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                              {ativo ? ativo.nome : ticker}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-900">
                              {ticker === 'CDI' ? '-' : dados ? `R$ ${dados.ultimoValor?.toFixed(2)}` : '-'}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                              <span className={`${
                                retornoAcumulado > 0 
                                ? 'text-green-600' 
                                : 'text-red-600'
                              }`}>
                                {retornoAcumulado !== null ? `${retornoAcumulado.toFixed(2)}%` : '-'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {exibirCesta && dadosCesta.length > 0 && (
                        <tr className="bg-purple-50 hover:bg-purple-100">
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-purple-800">
                            {nomeCesta}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-900">-</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                            <span className={`${
                              dadosCesta[dadosCesta.length - 1].valor > 0 
                              ? 'text-green-600' 
                              : 'text-red-600'
                            }`}>
                              {dadosCesta[dadosCesta.length - 1].valor.toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Painel principal - Gráficos */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <h2 className="text-xl font-semibold mb-3 text-gray-800">Desempenho Comparativo</h2>
              
              {carregando ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : dadosGrafico.length > 0 ? (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dadosGrafico} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="data" 
                        tickFormatter={(data) => {
                          const d = new Date(data);
                          return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
                        }}
                      />
                      <YAxis 
                        domain={['auto', 'auto']} 
                        tickFormatter={(value) => `${value.toFixed(2)}%`}
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          // Buscar o nome completo do ativo baseado no ticker
                          const ativoNome = getNomeAtivo(name);
                          return [`${value.toFixed(2)}%`, ativoNome];
                        }}
                        labelFormatter={formatarData}
                        itemSorter={(item) => -item.value} // Ordenar itens do maior para o menor valor
                      />
                      <Legend verticalAlign="top" height={36} />
                      
                      {/* Primeiro exibir as linhas dos ativos selecionados */}
                      {selecionados.map((ticker, index) => (
                        <Line
                          key={ticker}
                          type="monotone"
                          dataKey={ticker}
                          stroke={cores[index % cores.length]}
                          name={getNomeAtivo(ticker)}
                          dot={false}
                          activeDot={{ r: 6 }}  
                          connectNulls={true}                      
                        />
                      ))}
                      
                      {/* Depois exibir a linha da cesta, se estiver ativa */}
                      {exibirCesta && dadosCesta.length > 0 && (
                        <Line
                          key={nomeCesta}
                          type="monotone"
                          dataKey={nomeCesta}
                          stroke="#ff00ff"  // Magenta para destacar
                          strokeWidth={3}
                          name={nomeCesta}
                          dot={false}
                          activeDot={{ r: 7 }} 
                          connectNulls={true}                       
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex justify-center items-center h-64 bg-gray-50 rounded">
                  <p className="text-gray-500">Selecione pelo menos um ativo para visualizar dados</p>
                </div>
              )}
            </div>
            {/* Painel principal - Transações */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">

            <TransactionManager />
            </div>
            {/* Cards de Ativos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {selecionados.map((ticker, index) => {
                const dados = dadosProcessados[ticker];
                const retornoAcumulado = getUltimoRetornoAcumulado(ticker);
                
                return (
                  <div 
                    key={ticker} 
                    className="bg-white rounded-lg shadow-md p-4 border-l-4" 
                    style={{ borderLeftColor: cores[index % cores.length] }}
                  >
                    <h3 className="text-lg font-semibold">{getNomeAtivo(ticker)}</h3>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <p className="text-sm text-gray-500">Preço Atual</p>
                        <p className="text-lg font-bold">
                          {ticker === 'CDI' ? '-' : dados ? `R$ ${dados.ultimoValor?.toFixed(2)}` : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Retorno Acumulado</p>
                        <p className={`text-lg font-bold ${
                          retornoAcumulado > 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                        }`}>
                          {retornoAcumulado !== null ? `${retornoAcumulado.toFixed(2)}%` : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Volatilidade</p>
                        <p className="text-lg font-bold">
                          {dados ? `${dados.volatilidade?.toFixed(2)}%` : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Drawdown Máx</p>
                        <p className="text-lg font-bold text-red-600">
                          {dados ? `${dados.maxDrawdown?.toFixed(2)}%` : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Visualização da Composição da Cesta */}
            {exibirCesta && (
              <CestaComposition 
                nome={nomeCesta}
                ativos={ativos}
                cestaAtivos={cestaAtivos}
                getNomeAtivo={getNomeAtivo}
              />
            )}

            {/* Informações Adicionais */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-semibold mb-3 text-gray-800">Sobre os Ativos</h2>
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 rounded">
                  <h3 className="font-medium text-blue-800">BOVA11 (Ibovespa)</h3>
                  <p className="text-sm text-gray-700">ETF que acompanha o índice Ibovespa, principal indicador do desempenho das ações mais negociadas na B3.</p>
                </div>
                <div className="p-3 bg-green-50 rounded">
                  <h3 className="font-medium text-green-800">XFIX11 (IFIX)</h3>
                  <p className="text-sm text-gray-700">ETF que replica o IFIX, índice que mede o desempenho dos Fundos de Investimento Imobiliário.</p>
                </div>
                <div className="p-3 bg-purple-50 rounded">
                  <h3 className="font-medium text-purple-800">IB5M11/B5P211 (IMAB)</h3>
                  <p className="text-sm text-gray-700">ETFs que acompanham o IMA-B, índice de títulos públicos atrelados à inflação (NTN-B/IPCA+).</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded">
                  <h3 className="font-medium text-yellow-800">CDI</h3>
                  <p className="text-sm text-gray-700">Certificado de Depósito Interbancário, referência para investimentos de renda fixa no Brasil.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 text-white text-center p-4 mt-10">
        <p className="text-sm">
          Desenvolvido com React e Tailwind CSS | Dados provenientes de Yahoo Finance e Banco Central do Brasil
        </p>
      </footer>

      {/* Modal para gerenciamento de cestas */}
      {mostrarGerenciadorCestas && (
        <CestasManager 
          ativos={ativos}
          selecionados={selecionados}
          onCestaSelect={handleCestaSelect}
          onClose={() => setMostrarGerenciadorCestas(false)}
        />
      )}
    </div>
  );
}

export default App;