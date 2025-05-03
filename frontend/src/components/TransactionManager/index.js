// src/components/TransactionManager/index.js
import React, { useState } from 'react';
import { usePortfolio } from '../../contexts/PortfolioContext';
import PortfolioTab from './PortfolioTab';
import TransactionsTab from './TransactionsTab';
import InvestmentFundsTab from './InvestmentFundsTab';
import CashBalanceTab from './CashBalanceTab';
import RebalancingTab from './RebalancingTab';

const TransactionManager = () => {
  const { 
    lastUpdate,
    isRefreshing,
    fetchAllData,
    error,
    success,
    setSuccess,
    loading,
    updatingPrices,
    updatePricesRTD
  } = usePortfolio();
  
  const [activeTab, setActiveTab] = useState('portfolio');

  // Clear success message after 3 seconds
  const showSuccessMessage = (message) => {
    setSuccess({ success: true, message });
    setTimeout(() => setSuccess(null), 3000);
  };

  // Clear error message after 3 seconds
  const showErrorMessage = (message) => {
    setSuccess({ success: false, message });
    setTimeout(() => setSuccess(null), 3000);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-2xl font-semibold text-gray-800">Transaction Manager</h2>
        <p className="text-gray-600">Track your complete investment portfolio</p>
        <div className="flex items-center space-x-4">
          {lastUpdate && (
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <button 
            onClick={updatePricesRTD}
            disabled={updatingPrices || isRefreshing}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              updatingPrices || isRefreshing
                ? 'bg-gray-300 text-gray-500' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {updatingPrices ? 'Updating...' : 'Update Prices'}
          </button>
          <button 
            onClick={fetchAllData}
            disabled={isRefreshing || updatingPrices}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              isRefreshing || updatingPrices
                ? 'bg-gray-300 text-gray-500' 
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh All Data'}
          </button>
        </div>
      </div>

      {/* Error and success messages */}
      {error && (
        <div className="m-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className={`m-4 p-3 border-l-4 ${
          success.success 
            ? 'bg-green-100 border-green-500 text-green-700' 
            : 'bg-red-100 border-red-500 text-red-700'
        }`}>
          <p>{typeof success === 'object' ? success.message : success}</p>
        </div>
      )}
      
      {/* Navigation tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          <button 
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'portfolio'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('portfolio')}
          >
            Portfolio
          </button>
          <button 
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'transactions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('transactions')}
          >
            Transactions
          </button>
          <button 
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'funds'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('funds')}
          >
            Investment Funds
          </button>
          <button 
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'cash'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('cash')}
          >
            Cash Balance
          </button>
          <button 
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'rebalancing'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('rebalancing')}
          >
            Rebalancing
          </button>
        </nav>
      </div>
      
      <div className="p-4">
        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center items-center h-12 mb-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-blue-500">Loading...</span>
          </div>
        )}
        
        {/* Display the active tab content */}
        {activeTab === 'portfolio' && <PortfolioTab showSuccessMessage={showSuccessMessage} showErrorMessage={showErrorMessage} />}
        {activeTab === 'transactions' && <TransactionsTab showSuccessMessage={showSuccessMessage} showErrorMessage={showErrorMessage} />}
        {activeTab === 'funds' && <InvestmentFundsTab showSuccessMessage={showSuccessMessage} showErrorMessage={showErrorMessage} />}
        {activeTab === 'cash' && <CashBalanceTab showSuccessMessage={showSuccessMessage} showErrorMessage={showErrorMessage} />}
        {activeTab === 'rebalancing' && <RebalancingTab showSuccessMessage={showSuccessMessage} showErrorMessage={showErrorMessage} />}
      </div>
    </div>
  );
};

export default TransactionManager;