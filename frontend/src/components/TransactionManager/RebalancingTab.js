// src/components/TransactionManager/RebalancingTab.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { usePortfolio } from '../../contexts/PortfolioContext';

const API_URL = 'http://localhost:5001/api';

const RebalancingTab = ({ showSuccessMessage, showErrorMessage }) => {
  const {
    portfolio,
    assets,
    investmentFunds, 
    cashBalance,
    totals,
    formatCurrency
  } = usePortfolio();

  const [cestas, setCestas] = useState([]);
  const [selectedCestaId, setSelectedCestaId] = useState('');
  const [rebalancingData, setRebalancingData] = useState([]);
  const [loadingCestas, setLoadingCestas] = useState(false);
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0);
  

  // Load user's baskets (cestas)
  useEffect(() => {
    const loadCestas = async () => {
      setLoadingCestas(true);
      try {
        const response = await axios.get(`${API_URL}/cestas`);
        setCestas(response.data);
        setLoadingCestas(false);
      } catch (error) {
        console.error('Error loading baskets:', error);
        showErrorMessage('Failed to load baskets. Please try again.');
        setLoadingCestas(false);
      }
    };

    loadCestas();
  }, [showErrorMessage]);

  // Calculate total portfolio value whenever portfolio changes
  useEffect(() => {
    // Use totals from PortfolioContext if available
    if (totals && totals.totalValue) {
      setTotalPortfolioValue(totals.totalValue);
    } else {
      // Calculate manually if totals not available
      const assetsValue = portfolio.reduce((sum, item) => sum + item.currentValue, 0);
      const fundsValue = investmentFunds.reduce((sum, fund) => sum + parseFloat(fund.current_value || 0), 0);
      const cashValue = cashBalance || 0;
      
      const total = assetsValue + fundsValue + cashValue;
      setTotalPortfolioValue(total);
    }
  }, [portfolio, investmentFunds, cashBalance, totals]);

  // Handle basket selection
  const handleSelectCesta = (e) => {
    const cestaId = e.target.value;
    
    setSelectedCestaId(cestaId);
    
    if (cestaId) {
      const selectedCesta = cestas.find(cesta => cesta.id.toString() === cestaId);
      if (selectedCesta) {
        calculateRebalancing(selectedCesta);
      }
    } else {
      setRebalancingData([]);
    }
  };

  // Calculate rebalancing based on selected basket
  const calculateRebalancing = (cesta) => {
    if (!cesta || !portfolio.length) return;
    
    // Create rebalancing data for each portfolio asset
    const newRebalancingData = portfolio.map(asset => {
      const ticker = asset.asset.ticker;
      
      // Get the target percentage from the basket, defaulting to 0 if not found
      const targetPercentage = cesta.ativos[ticker] ? parseFloat(cesta.ativos[ticker]) : 0;
      
      // Calculate the target value based on total portfolio value
      const targetValue = (targetPercentage / 100) * totalPortfolioValue;
      
      // Calculate value difference (how much to buy/sell in value)
      const valueDifference = targetValue - asset.currentValue;
      
      // Calculate the quantity difference based on value difference and current price
      const quantityDifference = valueDifference / asset.currentPrice;
      
      // Calculate current percentage in portfolio
      const currentPercentage = (asset.currentValue / totalPortfolioValue) * 100;
      
      // Calculate percentage difference
      const percentageDifference = targetPercentage - currentPercentage;
      
      return {
        ...asset,
        targetPercentage,
        currentPercentage,
        percentageDifference,
        targetValue,
        valueDifference,
        quantityDifference,
        roundedQuantityDifference: Math.round(quantityDifference)
      };
    });
  // Verificar se existe CDI na cesta
  if (cesta.ativos['CDI'] !== undefined) {
    const cdiPercentage = parseFloat(cesta.ativos['CDI'] || 0);
    
    // Valor total atual dos fundos
    const currentFundsValue = investmentFunds.reduce(
      (sum, fund) => sum + parseFloat(fund.current_value || 0), 
      0
    );
    
    // Valor alvo para fundos baseado na porcentagem de CDI
    const targetFundsValue = (cdiPercentage / 100) * totalPortfolioValue;
    
    // Diferença de valor para fundos
    const fundsDifference = targetFundsValue - currentFundsValue;
    
    // Porcentagem atual dos fundos no portfólio total
    const currentFundsPercentage = (currentFundsValue / totalPortfolioValue) * 100;
    
    // Adicionar item especial para fundos no array de rebalanceamento
    if (currentFundsValue > 0 || targetFundsValue > 0) {
      newRebalancingData.push({
        ativo_id: 'funds',
        asset: {
          nome: 'Investment Funds',
          ticker: 'FUNDS'
        },
        quantity: 1, // Não aplicável para fundos, mas necessário para a interface
        currentPrice: currentFundsValue, // Não é realmente um preço, mas ajuda na visualização
        currentValue: currentFundsValue,
        targetPercentage: cdiPercentage,
        currentPercentage: currentFundsPercentage,
        percentageDifference: cdiPercentage - currentFundsPercentage,
        targetValue: targetFundsValue,
        valueDifference: fundsDifference,
        quantityDifference: 0, // Não aplicável para fundos
        roundedQuantityDifference: 0 // Não aplicável para fundos
      });
    }
  }
    setRebalancingData(newRebalancingData);
  };

  // Format percentage for display
  const formatPercentage = (value) => {
    return `${value.toFixed(2)}%`;
  };

  // Display plus sign for positive numbers
  const formatWithSign = (value) => {
    return value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
  };

  // Get color class based on value
  const getColorClass = (value) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  // Determine if a rebalancing action is needed (threshold of 0.5%)
  const needsRebalancing = (difference) => {
    return Math.abs(difference) >= 0.5;
  };

  // Get selected cesta object
  const selectedCesta = cestas.find(cesta => cesta.id.toString() === selectedCestaId);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">Portfolio Rebalancing</h2>
        <p className="text-gray-600 mb-4">
          Select a basket model to calculate the adjustments needed to rebalance your portfolio according to the model's allocations.
        </p>
        <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h3 className="text-md font-medium text-blue-800 mb-2">Total Portfolio Value</h3>
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalPortfolioValue)}</p>
          <div className="mt-1 flex flex-col text-sm text-blue-600">
            <span>Assets: {formatCurrency(totals?.assetsTotalValue || portfolio.reduce((sum, item) => sum + item.currentValue, 0))}</span>
            <span>Funds: {formatCurrency(totals?.fundsTotalValue || investmentFunds.reduce((sum, fund) => sum + parseFloat(fund.current_value || 0), 0))}</span>
            <span>Cash: {formatCurrency(totals?.cashBalance || cashBalance || 0)}</span>
          </div>
        </div>
        {/* Basket selection - Changed to select box */}
        <div className="max-w-md">
          <select
            value={selectedCestaId}
            onChange={handleSelectCesta}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={cestas.length === 0}
          >
            <option value="">-- Select a basket --</option>
            {cestas.map(cesta => (
              <option key={cesta.id} value={cesta.id}>
                {cesta.nome}
              </option>
            ))}
          </select>
  
            {cestas.length === 0 && (
              <p className="mt-2 text-sm text-gray-500">No baskets found. Create a basket first to use rebalancing.</p>
            )}
          </div>        
        {/* Selected basket summary */}
        {selectedCesta && (
          <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium mb-2">{selectedCesta.nome}</h3>
            <p className="text-sm text-gray-600 mb-2">
              {selectedCesta.descricao || 'No description provided.'}
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(selectedCesta.ativos)
                .filter(([_, peso]) => parseFloat(peso) > 0)
                .map(([ticker, peso]) => {
                  const asset = assets.find(a => a.ticker === ticker);
                  return (
                    <span 
                      key={ticker} 
                      className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {asset ? asset.nome : ticker}: {parseFloat(peso).toFixed(1)}%
                    </span>
                  );
                })}
            </div>
            <div className="text-sm text-gray-600">
              Last updated: {new Date(selectedCesta.data_atualizacao).toLocaleString()}
            </div>
          </div>
        )}
        
        {/* Rebalancing calculations table */}
        {selectedCesta && rebalancingData.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current %</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Target %</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% Diff</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current Value</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Target Value</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Value Change</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current Qty</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty Change</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rebalancingData.map(item => (
                  <tr key={item.ativo_id} className={`hover:bg-gray-50 ${
                    needsRebalancing(item.percentageDifference) ? 'bg-yellow-50' : ''
                  } ${item.ativo_id === 'funds' ? 'bg-purple-50' : ''}`}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.asset.nome}</div>
                      <div className="text-xs text-gray-500">{item.asset.ticker}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      {formatPercentage(item.currentPercentage)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      {formatPercentage(item.targetPercentage)}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${
                      getColorClass(item.percentageDifference)
                    }`}>
                      {formatWithSign(item.percentageDifference)}%
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      {formatCurrency(item.currentValue)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      {formatCurrency(item.targetValue)}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${
                      getColorClass(item.valueDifference)
                    }`}>
                      {formatCurrency(item.valueDifference)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      {item.ativo_id === 'funds' ? '-' : item.quantity.toFixed(2)}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${
                      getColorClass(item.quantityDifference)
                    }`}>
                      {item.ativo_id === 'funds' ? '-' : formatWithSign(item.roundedQuantityDifference)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Instructions if rebalancing data is shown */}
        {selectedCesta && rebalancingData.length > 0 && (
          <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-md font-medium text-blue-800 mb-2">Rebalancing Instructions</h3>
            <p className="text-sm text-blue-700 mb-2">
              The table above shows the adjustments needed to rebalance your portfolio according to the selected model.
            </p>
            <ul className="list-disc pl-5 text-sm text-blue-600 space-y-1">
              <li>Positive values in the "Qty Change" column indicate shares to <strong>buy</strong></li>
              <li>Negative values indicate shares to <strong>sell</strong></li>
              <li>Highlighted rows (yellow background) indicate assets that need significant rebalancing (≥0.5% difference)</li>
            </ul>
          </div>
        )}
        
        {/* No portfolio data message */}
        {(!portfolio || portfolio.length === 0) && (
          <div className="mt-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="text-md font-medium text-yellow-800 mb-2">No Portfolio Data</h3>
            <p className="text-sm text-yellow-700">
              Your portfolio is empty. Add transactions to build your portfolio before using the rebalancing tool.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RebalancingTab;