// src/contexts/PortfolioContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

// Create the context
const PortfolioContext = createContext();

// Custom hook to use the context
export const usePortfolio = () => useContext(PortfolioContext);

// Context provider
export const PortfolioProvider = ({ children }) => {
  // States
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
    fundsTotalValue: 0,
    cashBalance: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingPrices, setUpdatingPrices] = useState(false);

  // Function to update prices via RTD
  const updatePricesRTD = useCallback(async () => {
    setUpdatingPrices(true);
    try {
      // Call the price update endpoint
      const response = await axios.post(`${API_URL}/update-prices-rtd`, {
        background: false // Wait for completion before continuing
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
  }, []);

  // Function to fetch all data
  const fetchAllData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // First update prices via RTD
      await updatePricesRTD();
      
      // Then fetch updated data
      // Fetch assets
      const assetsResponse = await axios.get(`${API_URL}/ativos`);
      setAssets(assetsResponse.data);

      // Fetch transactions
      const transactionsResponse = await axios.get(`${API_URL}/transacoes`);
      setTransactions(transactionsResponse.data);
      
      // Fetch investment funds
      const fundsResponse = await axios.get(`${API_URL}/investment-funds`);
      setInvestmentFunds(fundsResponse.data);
      
      // Fetch cash balance
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
  }, [updatePricesRTD]);

  // Calculate portfolio based on transactions
  const calculatePortfolio = useCallback(() => {
    const calculatedPortfolio = {};

    // Sort transactions by date
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    // Process transactions
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
        const newQuantity = assetData.quantity + parseFloat(transaction.quantity);
        
        assetData.averagePrice = newQuantity > 0 ? (oldValue + newValue) / newQuantity : 0;
        assetData.quantity += parseFloat(transaction.quantity);
        assetData.totalInvestment += parseFloat(transaction.quantity) * parseFloat(transaction.price);
      } else if (transaction.type === 'sell') {
        assetData.quantity -= parseFloat(transaction.quantity);
        
        if (assetData.quantity > 0) {
          assetData.totalInvestment = assetData.quantity * assetData.averagePrice;
        } else {
          assetData.quantity = 0;
          assetData.totalInvestment = 0;
        }
      }
      
      // Calculate current values
      assetData.currentPrice = asset.preco_atual;
      assetData.currentValue = assetData.quantity * assetData.currentPrice;
      assetData.profit = assetData.currentValue - assetData.totalInvestment;
      assetData.profitPercentage = assetData.totalInvestment > 0 
        ? (assetData.profit / assetData.totalInvestment) * 100 
        : 0;
    });
    
    // Filter assets with quantity > 0
    return Object.values(calculatedPortfolio).filter(asset => asset.quantity > 0);
  }, [transactions, assets]);

  // Calculate totals
  const calculateTotals = useCallback((portfolioData) => {
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
  }, [investmentFunds, cashBalance]);

  // CRUD Operations
  const addTransaction = async (transactionData) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/transacoes`, transactionData);
      
      setTransactions([...transactions, response.data]);
      await fetchAllData(); // Fetch updated data
      
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
      await fetchAllData(); // Fetch updated data
      
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
      await fetchAllData(); // Fetch updated data
      
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
      await fetchAllData(); // Fetch updated data
      
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
      await fetchAllData(); // Fetch updated data
      
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.response?.data?.erro || 'Failed to update cash balance');
      return { success: false, error: err.response?.data?.erro || 'Failed to update cash balance' };
    } finally {
      setLoading(false);
    }
  };

  // Effect to load initial data
  useEffect(() => {
    fetchAllData();
    
    // Set up polling for automatic updates (every 30 seconds)
    const intervalId = setInterval(fetchAllData, 30000);
    
    return () => clearInterval(intervalId);
  }, [fetchAllData]);

  // Effect to recalculate portfolio when transactions or assets change
  useEffect(() => {
    if (assets.length > 0 && transactions.length > 0) {
      const calculatedPortfolio = calculatePortfolio();
      setPortfolio(calculatedPortfolio);
      setTotals(calculateTotals(calculatedPortfolio));
    }
  }, [transactions, assets, investmentFunds, cashBalance, calculatePortfolio, calculateTotals]);

  // Currency formatter
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  // Context value
  const value = {
    // Data
    transactions,
    assets,
    investmentFunds,
    cashBalance,
    portfolio,
    totals,
    loading,
    error,
    success,
    setSuccess,
    lastUpdate,
    isRefreshing,
    updatingPrices,
    
    // Actions
    fetchAllData,
    updatePricesRTD,
    addTransaction,
    addInvestmentFund,
    updateInvestmentFund,
    deleteInvestmentFund,
    updateCashBalance,
    
    // Utilities
    formatCurrency
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};

export default PortfolioProvider;