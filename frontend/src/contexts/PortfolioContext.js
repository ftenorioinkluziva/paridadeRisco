// src/contexts/PortfolioContext.js
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { API_URL } from '../config/api';

console.log('PortfolioContext - API URL:', API_URL);
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
  const lastFetchRef = useRef(0);

  // Function to update prices via RTD
  const updatePricesRTD = useCallback(async () => {
    setUpdatingPrices(true);
    try {
      const res = await fetch(`${API_URL}/update-prices-rtd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ background: false })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Failed to update prices.');
      console.log('Price update result:', data);
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
  const fetchAllData = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && lastFetchRef.current && now - lastFetchRef.current < 60000) {
      return;
    }
    lastFetchRef.current = now;
    setIsRefreshing(true);
    try {
      // First update prices via RTD
     // await updatePricesRTD();

      // Fetch assets
      const assetsRes = await fetch(`${API_URL}/ativos`);
      const assetsData = await assetsRes.json();
      setAssets(assetsData);

      // Fetch transactions
      const transactionsRes = await fetch(`${API_URL}/transacoes`);
      const transactionsData = await transactionsRes.json();
      setTransactions(transactionsData);

      // Fetch investment funds
      const fundsRes = await fetch(`${API_URL}/investment-funds`);
      const fundsData = await fundsRes.json();
      // Ensure we always store an array
      setInvestmentFunds(Array.isArray(fundsData) ? fundsData : []);

      // Fetch cash balance
      const cashRes = await fetch(`${API_URL}/cash-balance`);
      const cashData = await cashRes.json();
      setCashBalance(cashData.value || 0);

      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching portfolio data:', err);
      setError('Failed to load portfolio data. Please check your connection.');
    } finally {
      setIsRefreshing(false);
    }
  },
  // [updatePricesRTD]
  );

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
      const res = await fetch(`${API_URL}/transacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Failed to add transaction');
      setTransactions([...transactions, data]);
      await fetchAllData(true);
      return { success: true, data };
    } catch (err) {
      setError(err.message || 'Failed to add transaction');
      return { success: false, error: err.message || 'Failed to add transaction' };
    } finally {
      setLoading(false);
    }
  };

  const addInvestmentFund = async (fundData) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/investment-funds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fundData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Failed to add investment fund');
      setInvestmentFunds([...investmentFunds, data]);
      await fetchAllData(true);
      return { success: true, data };
    } catch (err) {
      setError(err.message || 'Failed to add investment fund');
      return { success: false, error: err.message || 'Failed to add investment fund' };
    } finally {
      setLoading(false);
    }
  };

  const updateInvestmentFund = async (id, updateData) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/investment-funds/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Failed to update investment fund');
      setInvestmentFunds(
        investmentFunds.map(fund => fund.id === id ? data : fund)
      );
      await fetchAllData(true);
      return { success: true, data };
    } catch (err) {
      setError(err.message || 'Failed to update investment fund');
      return { success: false, error: err.message || 'Failed to update investment fund' };
    } finally {
      setLoading(false);
    }
  };

  const deleteInvestmentFund = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/investment-funds/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.erro || 'Failed to delete investment fund');
      }
      setInvestmentFunds(investmentFunds.filter(fund => fund.id !== id));
      await fetchAllData(true);
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to delete investment fund');
      return { success: false, error: err.message || 'Failed to delete investment fund' };
    } finally {
      setLoading(false);
    }
  };

  const updateCashBalance = async (newValue) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/cash-balance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: parseFloat(newValue) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Failed to update cash balance');
      setCashBalance(data.value);
      await fetchAllData(true);
      return { success: true, data };
    } catch (err) {
      setError(err.message || 'Failed to update cash balance');
      return { success: false, error: err.message || 'Failed to update cash balance' };
    } finally {
      setLoading(false);
    }
  };

  // Effect to load initial data
  useEffect(() => {
    fetchAllData();
    
    // Set up polling for automatic updates (every minute)
    const intervalId = setInterval(fetchAllData, 60000);
    
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
    //updatePricesRTD,
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