// src/components/TransactionManager/PortfolioTab.js
import React, { useState } from 'react';
import { usePortfolio } from '../../contexts/PortfolioContext';
import NewTransactionForm from './forms/NewTransactionForm';
import NewFundForm from './forms/NewFundForm';
import UpdateCashForm from './forms/UpdateCashForm';

const PortfolioTab = ({ showSuccessMessage, showErrorMessage }) => {
  const {
    portfolio,
    totals,
    investmentFunds,
    cashBalance,
    formatCurrency,
    loading
  } = usePortfolio();

  const [formVisible, setFormVisible] = useState(false);
  const [fundFormVisible, setFundFormVisible] = useState(false);
  const [cashFormVisible, setCashFormVisible] = useState(false);

  // Calculate return for funds
  const calculateFundReturn = (fund) => {
    const initialInvestment = parseFloat(fund.initial_investment || 0);
    if (initialInvestment <= 0) return 0;
    
    const currentValue = parseFloat(fund.current_value || 0);
    return ((currentValue - initialInvestment) / initialInvestment) * 100;
  };

  return (
    <div>
      {/* Action buttons */}
      <div className="mb-4 flex justify-end">
        <div className="flex space-x-2">
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => setFormVisible(!formVisible)}
            disabled={loading}
          >
            {formVisible ? 'Cancel' : 'New Transaction'}
          </button>
          <button 
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            onClick={() => setFundFormVisible(!fundFormVisible)}
            disabled={loading}
          >
            {fundFormVisible ? 'Cancel' : 'Add Investment Fund'}
          </button>
          <button 
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={() => setCashFormVisible(!cashFormVisible)}
            disabled={loading}
          >
            {cashFormVisible ? 'Cancel' : 'Update Cash Balance'}
          </button>
        </div>
      </div>

      {/* Forms */}
      {formVisible && (
        <NewTransactionForm
          onSuccess={(message) => {
            showSuccessMessage(message);
            setFormVisible(false);
          }}
          onError={showErrorMessage}
        />
      )}

      {fundFormVisible && (
        <NewFundForm
          onSuccess={(message) => {
            showSuccessMessage(message);
            setFundFormVisible(false);
          }}
          onError={showErrorMessage}
        />
      )}

      {cashFormVisible && (
        <UpdateCashForm
          onSuccess={(message) => {
            showSuccessMessage(message);
            setCashFormVisible(false);
          }}
          onError={showErrorMessage}
        />
      )}

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <p className="text-sm text-blue-800">Total Portfolio Value</p>
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(totals.totalValue)}</p>
          <div className="mt-1 flex flex-col text-xs text-blue-600">
            <span>Assets: {formatCurrency(totals.assetsTotalValue)}</span>
            <span>Funds: {formatCurrency(totals.fundsTotalValue)}</span>
            <span>Cash: {formatCurrency(totals.cashBalance)}</span>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <p className="text-sm text-gray-800">Total Invested</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.totalInvestment)}</p>
        </div>
        
        <div className={`p-4 rounded-lg border ${
          totals.totalProfit >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
        }`}>
          <p className={`text-sm ${totals.totalProfit >= 0 ? 'text-green-800' : 'text-red-800'}`}>
            Profit/Loss
          </p>
          <p className={`text-2xl font-bold ${totals.totalProfit >= 0 ? 'text-green-900' : 'text-red-900'}`}>
            {formatCurrency(totals.totalProfit)}
          </p>
        </div>
        
        <div className={`p-4 rounded-lg border ${
          totals.profitPercentage >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
        }`}>
          <p className={`text-sm ${totals.profitPercentage >= 0 ? 'text-green-800' : 'text-red-800'}`}>
            Return
          </p>
          <p className={`text-2xl font-bold ${totals.profitPercentage >= 0 ? 'text-green-900' : 'text-red-900'}`}>
            {totals.profitPercentage.toFixed(2)}%
          </p>
        </div>
      </div>
      
      {/* Portfolio composition */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Portfolio Composition</h3>
        
        {/* Assets section */}
        {portfolio.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-medium mb-2 text-gray-700">Assets</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Profit/Loss</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Return %</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {portfolio.map(asset => (
                    <tr key={asset.ativo_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{asset.asset.nome}</div>
                        <div className="text-xs text-gray-500">{asset.asset.ticker}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                        {asset.quantity.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                        {formatCurrency(asset.averagePrice)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                        {formatCurrency(asset.currentPrice)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">
                        {formatCurrency(asset.currentValue)}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${
                        asset.profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(asset.profit)}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${
                        asset.profitPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {asset.profitPercentage.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                  {portfolio.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-4 py-4 text-center text-gray-500">
                        No assets found. Add transactions to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Investment Funds section */}
        <div className="mb-6">
          <h4 className="text-md font-medium mb-2 text-gray-700">Investment Funds</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fund Name</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Initial Investment</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current Value</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Profit/Loss</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Return %</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {investmentFunds.length > 0 ? investmentFunds.map(fund => {
                  const initialInvestment = parseFloat(fund.initial_investment || 0);
                  const currentValue = parseFloat(fund.current_value || 0);
                  const profit = currentValue - initialInvestment;
                  const returnPercentage = calculateFundReturn(fund);
                  
                  return (
                    <tr key={fund.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{fund.name}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                        {formatCurrency(fund.initial_investment)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">
                        {formatCurrency(fund.current_value)}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${
                        profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(profit)}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${
                        returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {returnPercentage.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                        {new Date(fund.investment_date).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="6" className="px-4 py-4 text-center text-gray-500">
                      No investment funds found. Add funds to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Cash Balance section */}
        <div>
          <h4 className="text-md font-medium mb-2 text-gray-700">Cash Balance</h4>
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <p className="text-sm text-green-800">Available Cash</p>
            <p className="text-2xl font-bold text-green-900">{formatCurrency(cashBalance)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioTab;