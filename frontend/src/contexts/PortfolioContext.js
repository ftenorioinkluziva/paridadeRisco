// src/contexts/PortfolioContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

// Criar o contexto
const PortfolioContext = createContext();

// Hook personalizado para usar o contexto
export const usePortfolio = () => useContext(PortfolioContext);

// Provedor do contexto
export const PortfolioProvider = ({ children }) => {
  // Estados
  const [transactions, setTransactions] = useState([]);
  const [assets, setAssets] = useState([]);
  const [investmentFunds, setInvestmentFunds] = useState([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [portfolio, setPortfolio] = useState([]);
  const [totals, setTotals] = useState({
    totalInvestment: 0,
    totalValue: 0,
    totalProfit: 0,
    profitPercentage: 0,
    assetsTotalValue: 0,
    fundsTotalValue: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingPrices, setUpdatingPrices] = useState(false);


  const updatePricesRTD = async () => {
    setUpdatingPrices(true);
    try {
      // Chamar endpoint de atualização de preços
      const response = await axios.post(`${API_URL}/update-prices-rtd`, {
        background: false // Queremos esperar pela conclusão antes de continuar
      });
      
      console.log('Price update result:', response.data);
      return true;
    } catch (err) {
      console.error('Error updating prices via RTD:', err);
      setError('Failed to update prices. Continuing with existing data.');
      return false;
    } finally {
      setUpdatingPrices(false);
    }
  };

  // Função para buscar todos os dados

  const fetchAllData = async () => {
    setIsRefreshing(true);
    try {
      // Primeiro atualizar os preços via RTD
      await updatePricesRTD();
      
      // Depois buscar os dados atualizados
      // Buscar ativos
      const assetsResponse = await axios.get(`${API_URL}/ativos`);
      setAssets(assetsResponse.data);

      // Buscar transações
      const transactionsResponse = await axios.get(`${API_URL}/transacoes`);
      setTransactions(transactionsResponse.data);
      
      // Buscar fundos de investimento
      const fundsResponse = await axios.get(`${API_URL}/investment-funds`);
      setInvestmentFunds(fundsResponse.data);
      
      // Buscar saldo em caixa
      const cashResponse = await axios.get(`${API_URL}/cash-balance`);
      setCashBalance(cashResponse.data.value || 0);

      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching portfolio data:', err);
      setError('Failed to load portfolio data. Please check your connection.');
    } finally {
      setIsRefreshing(false);
    }
  };
  // Calcular portfólio baseado nas transações
  const calculatePortfolio = () => {
    const calculatedPortfolio = {};

    // Ordenar transações por data
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    // Processar transações
    sortedTransactions.forEach(transaction => {
      const ativoId = transaction.ativo_id;
      const asset = assets.find(a => a.id === ativoId);
      
      if (!asset) return;
      
      if (!calculatedPortfolio[ativoId]) {
        calculatedPortfolio[ativoId] = {
          ativo_id: ativoId,
          asset,
          quantity: 0,
          totalInvestment: 0,
          averagePrice: 0
        };
      }
      
      const assetData = calculatedPortfolio[ativoId];
      
      if (transaction.type === 'buy') {
        const oldValue = assetData.quantity * assetData.averagePrice;
        const newValue = transaction.quantity * transaction.price;
        const newQuantity = assetData.quantity + transaction.quantity;
        
        assetData.averagePrice = newQuantity > 0 ? (oldValue + newValue) / newQuantity : 0;
        assetData.quantity += transaction.quantity;
        assetData.totalInvestment += transaction.quantity * transaction.price;
      } else if (transaction.type === 'sell') {
        assetData.quantity -= transaction.quantity;
        
        if (assetData.quantity > 0) {
          assetData.totalInvestment = assetData.quantity * assetData.averagePrice;
        } else {
          assetData.quantity = 0;
          assetData.totalInvestment = 0;
        }
      }
      
      // Calcular valores atuais
      assetData.currentPrice = asset.preco_atual;
      assetData.currentValue = assetData.quantity * assetData.currentPrice;
      assetData.profit = assetData.currentValue - assetData.totalInvestment;
      assetData.profitPercentage = assetData.totalInvestment > 0 
        ? (assetData.profit / assetData.totalInvestment) * 100 
        : 0;
    });
    
    // Filtrar ativos com quantidade > 0
    return Object.values(calculatedPortfolio).filter(asset => asset.quantity > 0);
  };

  // Calcular totais
  const calculateTotals = (portfolioData) => {
    const assetsTotalInvestment = portfolioData.reduce((sum, asset) => sum + asset.totalInvestment, 0);
    const assetsTotalValue = portfolioData.reduce((sum, asset) => sum + asset.currentValue, 0);
    const assetsProfit = portfolioData.reduce((sum, asset) => sum + asset.profit, 0);
    
    const fundsTotalInvestment = investmentFunds.reduce((sum, fund) => sum + parseFloat(fund.initial_investment || 0), 0);
    const fundsTotalValue = investmentFunds.reduce((sum, fund) => sum + parseFloat(fund.current_value || 0), 0);
    const fundsProfit = fundsTotalValue - fundsTotalInvestment;
    
    const totalInvestment = assetsTotalInvestment + fundsTotalInvestment;
    const totalValue = assetsTotalValue + fundsTotalValue + cashBalance;
    const totalProfit = assetsProfit + fundsProfit;
    
    const profitPercentage = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;
    
    return { 
      totalInvestment, 
      totalValue, 
      totalProfit, 
      profitPercentage,
      assetsTotalValue,
      fundsTotalValue,
      cashBalance
    };
  };

  // Operações CRUD
  const addTransaction = async (transactionData) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/transacoes`, transactionData);
      
      setTransactions([...transactions, response.data]);
      await fetchAllData(); // Buscar dados atualizados
      
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.response?.data?.erro || 'Failed to add transaction');
      return { success: false, error: err.response?.data?.erro || 'Failed to add transaction' };
    } finally {
      setLoading(false);
    }
  };

  const addInvestmentFund = async (fundData) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/investment-funds`, fundData);
      
      setInvestmentFunds([...investmentFunds, response.data]);
      await fetchAllData(); // Buscar dados atualizados
      
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.response?.data?.erro || 'Failed to add investment fund');
      return { success: false, error: err.response?.data?.erro || 'Failed to add investment fund' };
    } finally {
      setLoading(false);
    }
  };

  const updateInvestmentFund = async (id, updateData) => {
    setLoading(true);
    try {
      const response = await axios.put(`${API_URL}/investment-funds/${id}`, updateData);
      
      setInvestmentFunds(
        investmentFunds.map(fund => fund.id === id ? response.data : fund)
      );
      await fetchAllData(); // Buscar dados atualizados
      
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.response?.data?.erro || 'Failed to update investment fund');
      return { success: false, error: err.response?.data?.erro || 'Failed to update investment fund' };
    } finally {
      setLoading(false);
    }
  };

  const deleteInvestmentFund = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/investment-funds/${id}`);
      
      setInvestmentFunds(investmentFunds.filter(fund => fund.id !== id));
      await fetchAllData(); // Buscar dados atualizados
      
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.erro || 'Failed to delete investment fund');
      return { success: false, error: err.response?.data?.erro || 'Failed to delete investment fund' };
    } finally {
      setLoading(false);
    }
  };

  const updateCashBalance = async (newValue) => {
    setLoading(true);
    try {
      const response = await axios.put(`${API_URL}/cash-balance`, { value: parseFloat(newValue) });
      
      setCashBalance(response.data.value);
      await fetchAllData(); // Buscar dados atualizados
      
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.response?.data?.erro || 'Failed to update cash balance');
      return { success: false, error: err.response?.data?.erro || 'Failed to update cash balance' };
    } finally {
      setLoading(false);
    }
  };

  // Efeito para carregar dados iniciais
  useEffect(() => {
    fetchAllData();
    
    // Configurar polling para atualização automática (a cada 30 segundos)
    const intervalId = setInterval(fetchAllData, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Efeito para recalcular o portfólio quando as transações ou ativos mudarem
  useEffect(() => {
    if (assets.length > 0 && transactions.length > 0) {
      const calculatedPortfolio = calculatePortfolio();
      setPortfolio(calculatedPortfolio);
      setTotals(calculateTotals(calculatedPortfolio));
    }
  }, [transactions, assets, investmentFunds, cashBalance]);

  // Formatador de moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  // Valor do contexto
  const value = {
    // Dados
    transactions,
    assets,
    investmentFunds,
    cashBalance,
    portfolio,
    totals,
    loading,
    error,
    lastUpdate,
    isRefreshing,
    updatingPrices,
    
    // Ações
    fetchAllData,
    updatePricesRTD,
    addTransaction,
    addInvestmentFund,
    updateInvestmentFund,
    deleteInvestmentFund,
    updateCashBalance,
    
    // Utilitários
    formatCurrency
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};