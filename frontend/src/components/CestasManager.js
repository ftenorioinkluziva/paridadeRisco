//Componente de Gerenciamento de Cestas
import React, { useState, useEffect } from 'react';
import axios from 'axios';


const CestasManager = ({ ativos, selecionados, onCestaSelect, onClose }) => {
  const [cestas, setCestas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('listar'); // 'listar', 'criar', 'editar'
  const [cestaEditando, setCestaEditando] = useState(null);
  
  // Nova cesta
  const [novaCesta, setNovaCesta] = useState({
    nome: '',
    descricao: '',
    ativos: {}
  });

  // API URL
  const API_URL = 'http://localhost:5001/api';

  // Carregar todas as cestas
  const carregarCestas = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/cestas`);
      setCestas(response.data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar cestas. Verifique a conexão com o servidor.');
      console.error('Erro ao carregar cestas:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar cestas na montagem do componente
  useEffect(() => {
    carregarCestas();
  }, []);

  // Função para criar nova cesta
  const criarCesta = async () => {
    // Validar se há pelo menos um ativo com peso maior que zero
    const totalPeso = Object.values(novaCesta.ativos).reduce((sum, peso) => sum + (parseFloat(peso) || 0), 0);
    
    if (totalPeso <= 0) {
      setError('Adicione pelo menos um ativo com peso maior que zero');
      return;
    }
    
    if (!novaCesta.nome.trim()) {
      setError('Nome da cesta é obrigatório');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/cesta`, novaCesta);
      setCestas([...cestas, response.data]);
      setError(null);
      setActiveTab('listar');
      setNovaCesta({ nome: '', descricao: '', ativos: {} });
    } catch (err) {
      setError('Erro ao criar cesta. Verifique a conexão com o servidor.');
      console.error('Erro ao criar cesta:', err);
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar cesta existente
  const atualizarCesta = async () => {
    if (!cestaEditando) return;
    
    // Validar se há pelo menos um ativo com peso maior que zero
    const totalPeso = Object.values(cestaEditando.ativos).reduce((sum, peso) => sum + (parseFloat(peso) || 0), 0);
    
    if (totalPeso <= 0) {
      setError('Adicione pelo menos um ativo com peso maior que zero');
      return;
    }
    
    if (!cestaEditando.nome.trim()) {
      setError('Nome da cesta é obrigatório');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.put(`${API_URL}/cesta/${cestaEditando.id}`, cestaEditando);
      
      // Atualizar a lista de cestas
      setCestas(cestas.map(c => c.id === cestaEditando.id ? response.data : c));
      
      setError(null);
      setActiveTab('listar');
      setCestaEditando(null);
    } catch (err) {
      setError('Erro ao atualizar cesta. Verifique a conexão com o servidor.');
      console.error('Erro ao atualizar cesta:', err);
    } finally {
      setLoading(false);
    }
  };

  // Função para excluir cesta
  const excluirCesta = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta cesta?')) return;
    
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/cesta/${id}`);
      
      // Atualizar a lista de cestas
      setCestas(cestas.filter(c => c.id !== id));
      
      setError(null);
    } catch (err) {
      setError('Erro ao excluir cesta. Verifique a conexão com o servidor.');
      console.error('Erro ao excluir cesta:', err);
    } finally {
      setLoading(false);
    }
  };

  // Iniciar edição de cesta
  const iniciarEdicao = (cesta) => {
    setCestaEditando({...cesta});
    setActiveTab('editar');
  };

  // Iniciar criação de cesta
  const iniciarCriacao = () => {
    // Inicializar nova cesta com os ativos selecionados
    const ativosIniciais = {};
    selecionados.forEach(ticker => {
      ativosIniciais[ticker] = 0;
    });
    
    setNovaCesta({
      nome: '',
      descricao: '',
      ativos: ativosIniciais
    });
    
    setActiveTab('criar');
  };

  // Controle de campo para nova cesta
  const handleNovoChange = (field, value) => {
    setNovaCesta({
      ...novaCesta,
      [field]: value
    });
  };

  // Controle de campo para cesta em edição
  const handleEditChange = (field, value) => {
    setCestaEditando({
      ...cestaEditando,
      [field]: value
    });
  };

  // Controle de peso para nova cesta
  const handleNovoPesoChange = (ticker, valor) => {
    setNovaCesta({
      ...novaCesta,
      ativos: {
        ...novaCesta.ativos,
        [ticker]: parseFloat(valor) || 0
      }
    });
  };

  // Controle de peso para cesta em edição
  const handleEditPesoChange = (ticker, valor) => {
    setCestaEditando({
      ...cestaEditando,
      ativos: {
        ...cestaEditando.ativos,
        [ticker]: parseFloat(valor) || 0
      }
    });
  };

  // Renderizar formulário de criação de cesta
  const renderCriarForm = () => (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Criar Nova Cesta</h2>
      
      <div className="mb-4">
        <label htmlFor="nome-cesta" className="block text-sm font-medium text-gray-700 mb-1">
          Nome da Cesta*
        </label>
        <input
          type="text"
          id="nome-cesta"
          value={novaCesta.nome}
          onChange={(e) => handleNovoChange('nome', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="Ex: Minha Cesta Balanceada"
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="descricao-cesta" className="block text-sm font-medium text-gray-700 mb-1">
          Descrição
        </label>
        <textarea
          id="descricao-cesta"
          value={novaCesta.descricao}
          onChange={(e) => handleNovoChange('descricao', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="Descrição opcional da cesta"
          rows="2"
        />
      </div>
      
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Composição (Pesos %)</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {selecionados.map(ticker => {
            const ativo = ativos.find(a => a.ticker === ticker);
            return (
              <div key={ticker} className="flex items-center">
                <label className="inline-block w-28 truncate text-sm" title={ativo ? ativo.nome : ticker}>
                  {ativo ? ativo.nome : ticker}:
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={novaCesta.ativos[ticker] || 0}
                  onChange={(e) => handleNovoPesoChange(ticker, e.target.value)}
                  className="w-20 p-1 border border-gray-300 rounded text-right"
                />
                <span className="ml-1 text-sm">%</span>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={() => setActiveTab('listar')}
          className="px-3 py-1 rounded text-sm bg-gray-200 hover:bg-gray-300"
        >
          Cancelar
        </button>
        <button
          onClick={criarCesta}
          disabled={loading}
          className="px-3 py-1 rounded text-sm bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300"
        >
          {loading ? 'Salvando...' : 'Salvar Cesta'}
        </button>
      </div>
    </div>
  );

  // Renderizar formulário de edição de cesta
  const renderEditarForm = () => {
    if (!cestaEditando) return null;
    
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Editar Cesta</h2>
        
        <div className="mb-4">
          <label htmlFor="edit-nome-cesta" className="block text-sm font-medium text-gray-700 mb-1">
            Nome da Cesta*
          </label>
          <input
            type="text"
            id="edit-nome-cesta"
            value={cestaEditando.nome}
            onChange={(e) => handleEditChange('nome', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="edit-descricao-cesta" className="block text-sm font-medium text-gray-700 mb-1">
            Descrição
          </label>
          <textarea
            id="edit-descricao-cesta"
            value={cestaEditando.descricao || ''}
            onChange={(e) => handleEditChange('descricao', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            rows="2"
          />
        </div>
        
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Composição (Pesos %)</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {selecionados.map(ticker => {
              const ativo = ativos.find(a => a.ticker === ticker);
              return (
                <div key={ticker} className="flex items-center">
                  <label className="inline-block w-28 truncate text-sm" title={ativo ? ativo.nome : ticker}>
                    {ativo ? ativo.nome : ticker}:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={cestaEditando.ativos[ticker] || 0}
                    onChange={(e) => handleEditPesoChange(ticker, e.target.value)}
                    className="w-20 p-1 border border-gray-300 rounded text-right"
                  />
                  <span className="ml-1 text-sm">%</span>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={() => setActiveTab('listar')}
            className="px-3 py-1 rounded text-sm bg-gray-200 hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={atualizarCesta}
            disabled={loading}
            className="px-3 py-1 rounded text-sm bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300"
          >
            {loading ? 'Salvando...' : 'Atualizar Cesta'}
          </button>
        </div>
      </div>
    );
  };

  // Renderizar lista de cestas
  const renderListaCestas = () => (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Minhas Cestas</h2>
        <button
          onClick={iniciarCriacao}
          className="px-3 py-1 rounded text-sm bg-blue-500 text-white hover:bg-blue-600"
        >
          Nova Cesta
        </button>
      </div>
      
      {loading && <p className="text-gray-500">Carregando cestas...</p>}
      
      {!loading && cestas.length === 0 && (
        <p className="text-gray-500 text-center py-4">
          Você ainda não tem cestas salvas. Crie uma nova cesta para começar!
        </p>
      )}
      
      {!loading && cestas.length > 0 && (
        <ul className="divide-y divide-gray-200">
          {cestas.map(cesta => (
            <li key={cesta.id} className="py-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-900">{cesta.nome}</h3>
                  {cesta.descricao && <p className="text-sm text-gray-500">{cesta.descricao}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    Atualizada em {new Date(cesta.data_atualizacao).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onCestaSelect(cesta)}
                    className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                  >
                    Usar
                  </button>
                  <button
                    onClick={() => iniciarEdicao(cesta)}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => excluirCesta(cesta.id)}
                    className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Excluir
                  </button>
                </div>
              </div>
              
              {/* Mostrar composição resumida */}
              <div className="mt-2 flex flex-wrap gap-1">
                {Object.entries(cesta.ativos)
                  .filter(([_, peso]) => parseFloat(peso) > 0)
                  .map(([ticker, peso], index) => {
                    const ativo = ativos.find(a => a.ticker === ticker);
                    return (
                      <span 
                        key={ticker} 
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {ativo ? ativo.nome : ticker}: {parseFloat(peso).toFixed(0)}%
                      </span>
                    );
                  })
                }
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Gerenciar Cestas</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
            <p>{error}</p>
          </div>
        )}
        
        <div className="mb-4">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                className={`mr-8 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'listar'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('listar')}
              >
                Minhas Cestas
              </button>
              <button
                className={`mr-8 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'criar'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={iniciarCriacao}
              >
                Criar Nova
              </button>
            </nav>
          </div>
        </div>
        
        <div className="overflow-y-auto max-h-[60vh]">
          {activeTab === 'listar' && renderListaCestas()}
          {activeTab === 'criar' && renderCriarForm()}
          {activeTab === 'editar' && renderEditarForm()}
        </div>
      </div>
    </div>
  );
};

export default CestasManager;