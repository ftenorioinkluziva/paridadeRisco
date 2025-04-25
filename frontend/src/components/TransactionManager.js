import React, { useState } from 'react';
import { usePortfolio } from '../contexts/PortfolioContext';

const TransactionManager = () => {
  // Usar o contexto de portfólio
  const { 
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
    fetchAllData,
    addTransaction,
    addInvestmentFund,
    updateInvestmentFund,
    deleteInvestmentFund,
    updateCashBalance,
    formatCurrency,
    updatingPrices,
    updatePricesRTD
  } = usePortfolio();
  
  // Estados locais para os formulários
  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState({
    type: 'buy',
    ativo_id: '',
    quantity: '',
    price: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [fundFormVisible, setFundFormVisible] = useState(false);
  const [fundFormData, setFundFormData] = useState({
    name: '',
    initial_investment: '',
    investment_date: new Date().toISOString().split('T')[0],
    current_value: ''
  });
  
  const [cashFormVisible, setCashFormVisible] = useState(false);
  const [cashForm, setCashForm] = useState({
    value: ''
  });
  
  const [activeTab, setActiveTab] = useState('portfolio');
  const [success, setSuccess] = useState(null);

  // Handler para mudanças no formulário
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handler para mudanças no formulário de fundos
  const handleFundFormChange = (e) => {
    const { name, value } = e.target;
    setFundFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handler para mudanças no formulário de saldo
  const handleCashFormChange = (e) => {
    const { name, value } = e.target;
    setCashForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Adicionar nova transação
  const handleAddTransaction = async () => {
    if (!formData.ativo_id || !formData.quantity || !formData.price || !formData.date) {
      setSuccess({ success: false, message: 'Please fill in all fields' });
      return;
    }
    
    const result = await addTransaction(formData);
    
    if (result.success) {
      setSuccess({ success: true, message: 'Transaction added successfully!' });
      setTimeout(() => setSuccess(null), 3000);
      
      // Reset form
      setFormData({
        type: 'buy',
        ativo_id: '',
        quantity: '',
        price: '',
        date: new Date().toISOString().split('T')[0]
      });
      
      setFormVisible(false);
    } else {
      setSuccess({ success: false, message: result.error });
    }
  };
  
  // Adicionar novo fundo de investimento
  const handleAddFund = async () => {
    if (!fundFormData.name || !fundFormData.initial_investment || !fundFormData.current_value || !fundFormData.investment_date) {
      setSuccess({ success: false, message: 'Please fill in all fields for the investment fund' });
      return;
    }
    
    const result = await addInvestmentFund({
      name: fundFormData.name,
      initial_investment: parseFloat(fundFormData.initial_investment),
      current_value: parseFloat(fundFormData.current_value),
      investment_date: fundFormData.investment_date
    });
    
    if (result.success) {
      setSuccess({ success: true, message: 'Investment Fund added successfully!' });
      setTimeout(() => setSuccess(null), 3000);
      
      // Reset form
      setFundFormData({
        name: '',
        initial_investment: '',
        investment_date: new Date().toISOString().split('T')[0],
        current_value: ''
      });
      
      setFundFormVisible(false);
    } else {
      setSuccess({ success: false, message: result.error });
    }
  };
  
  // Atualizar fundo de investimento
  const handleUpdateFund = async (id, field, value) => {
    try {
      const fund = investmentFunds.find(f => f.id === id);
      if (!fund) return;
      
      const updateData = { ...fund };
      
      if (field === 'current_value' || field === 'initial_investment') {
        updateData[field] = parseFloat(value);
      } else {
        updateData[field] = value;
      }
      
      const result = await updateInvestmentFund(id, updateData);
      
      if (result.success) {
        setSuccess({ success: true, message: 'Investment Fund updated successfully!' });
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setSuccess({ success: false, message: result.error });
      }
    } catch (err) {
      setSuccess({ success: false, message: 'Error updating investment fund' });
    }
  };
  
  // Excluir fundo de investimento
  const handleDeleteFund = async (id) => {
    if (!window.confirm('Are you sure you want to delete this investment fund?')) {
      return;
    }
    
    const result = await deleteInvestmentFund(id);
    
    if (result.success) {
      setSuccess({ success: true, message: 'Investment Fund deleted successfully!' });
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setSuccess({ success: false, message: result.error });
    }
  };
  
  // Atualizar saldo em caixa
  const handleUpdateCash = async () => {
    if (!cashForm.value) {
      setSuccess({ success: false, message: 'Please enter a cash balance value' });
      return;
    }
    
    const result = await updateCashBalance(cashForm.value);
    
    if (result.success) {
      setSuccess({ success: true, message: 'Cash balance updated successfully!' });
      setTimeout(() => setSuccess(null), 3000);
      
      setCashForm({ value: '' });
      setCashFormVisible(false);
    } else {
      setSuccess({ success: false, message: result.error });
    }
  };
  
  // Calcular retorno para fundos de investimento
  const calculateFundReturn = (fund) => {
    const initialInvestment = parseFloat(fund.initial_investment || 0);
    if (initialInvestment <= 0) return 0;
    
    const currentValue = parseFloat(fund.current_value || 0);
    return ((currentValue - initialInvestment) / initialInvestment) * 100;
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
      
      {success && <div>{typeof success === 'object' ? success.message : success}</div>}
      
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
        
        {/* Action buttons - different for each tab */}
        <div className="mb-4 flex justify-end">
          {activeTab === 'portfolio' && (
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
          )}
          
          {activeTab === 'transactions' && (
            <button 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => setFormVisible(!formVisible)}
              disabled={loading}
            >
              {formVisible ? 'Cancel' : 'New Transaction'}
            </button>
          )}
          
          {activeTab === 'funds' && (
            <button 
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              onClick={() => setFundFormVisible(!fundFormVisible)}
              disabled={loading}
            >
              {fundFormVisible ? 'Cancel' : 'Add Investment Fund'}
            </button>
          )}
          
          {activeTab === 'cash' && (
            <button 
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              onClick={() => setCashFormVisible(!cashFormVisible)}
              disabled={loading}
            >
              {cashFormVisible ? 'Cancel' : 'Update Cash Balance'}
            </button>
          )}
        </div>
        
        {/* Transaction form */}
        {formVisible && (activeTab === 'portfolio' || activeTab === 'transactions') && (
          <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium mb-3">New Transaction</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  disabled={loading}
                >
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asset <span className="text-red-500">*</span>
                </label>
                <select
                  name="ativo_id"
                  value={formData.ativo_id}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  disabled={loading}
                >
                  <option value="">Select an asset</option>
                  {assets.map(asset => (
                    <option key={asset.id} value={asset.id}>
                      {asset.nome} ({asset.ticker})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="0"
                  min="0.01"
                  step="0.01"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  max={new Date().toISOString().split('T')[0]}
                  disabled={loading}
                />
              </div>
              
              <div className="flex items-end">
                <button
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300"
                  onClick={handleAddTransaction}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Add Transaction'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Investment Fund form */}
        {fundFormVisible && (activeTab === 'portfolio' || activeTab === 'funds') && (
          <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium mb-3">Add Investment Fund</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fund Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={fundFormData.name}
                  onChange={handleFundFormChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Fund name"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Investment <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="initial_investment"
                  value={fundFormData.initial_investment}
                  onChange={handleFundFormChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Investment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="investment_date"
                  value={fundFormData.investment_date}
                  onChange={handleFundFormChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  max={new Date().toISOString().split('T')[0]}
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Value <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="current_value"
                  value={fundFormData.current_value}
                  onChange={handleFundFormChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  disabled={loading}
                />
              </div>
              
              <div className="md:col-span-2 flex justify-end">
                <button
                  className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-purple-300"
                  onClick={handleAddFund}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Add Investment Fund'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Cash Balance form */}
        {cashFormVisible && (activeTab === 'portfolio' || activeTab === 'cash') && (
          <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium mb-3">Update Cash Balance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cash Balance <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="value"
                  value={cashForm.value}
                  onChange={handleCashFormChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>
              
              <div className="flex items-end">
                <button
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300"
                  onClick={handleUpdateCash}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Update Cash Balance'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Portfolio tab content */}
        {activeTab === 'portfolio' && (
          <>
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
          </>
        )}
        
        {/* Transactions tab content */}
        {activeTab === 'transactions' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.length > 0 ? (
                  [...transactions]
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map(transaction => {
                      const asset = assets.find(a => a.id === transaction.ativo_id);
                      return (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {new Date(transaction.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.type === 'buy' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.type === 'buy' ? 'Buy' : 'Sell'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {asset ? (
                              <>
                                <div className="text-sm font-medium text-gray-900">{asset.nome}</div>
                                <div className="text-xs text-gray-500">{asset.ticker}</div>
                              </>
                            ) : (
                              <div className="text-sm text-gray-500">Unknown Asset</div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                            {transaction.quantity}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                            {formatCurrency(transaction.price)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">
                            {formatCurrency(transaction.totalvalue || (transaction.quantity * transaction.price))}
                          </td>
                        </tr>
                      );
                    })
                ) : (
                  <tr>
                    <td colSpan="6" className="px-4 py-4 text-center text-gray-500">
                      No transactions found. Add transactions to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Investment Funds tab content */}
        {activeTab === 'funds' && (
          <div>
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
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {investmentFunds.length > 0 ? investmentFunds.map(fund => {
                    const profit = fund.current_value - fund.initial_investment;
                    const returnPercentage = calculateFundReturn(fund);
                    
                    return (
                      <tr key={fund.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                        <input 
                          type="text"
                          value={fund.name || ''}
                          onChange={(e) => handleUpdateFund(fund.id, 'name', e.target.value)}
                          className="w-full p-1 border border-gray-300 rounded"
                        />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <input 
                            type="number"
                            value={fund.initial_investment || ''}
                            onChange={(e) => handleUpdateFund(fund.id, 'initial_investment', e.target.value)}
                            className="w-full p-1 border border-gray-300 rounded text-right"
                            min="0.01"
                            step="0.01"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <input 
                            type="number"
                            value={fund.current_value || ''}
                            onChange={(e) => handleUpdateFund(fund.id, 'current_value', e.target.value)}
                            className="w-full p-1 border border-gray-300 rounded text-right"
                            min="0"
                            step="0.01"
                          />
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
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <input 
                            type="date"
                            value={fund.investment_date || ''}
                            onChange={(e) => handleUpdateFund(fund.id, 'investment_date', e.target.value)}
                            className="w-full p-1 border border-gray-300 rounded"
                            max={new Date().toISOString().split('T')[0]}
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleDeleteFund(fund.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="7" className="px-4 py-4 text-center text-gray-500">
                        No investment funds found. Add funds to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Cash Balance tab content */}
        {activeTab === 'cash' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium mb-4">Cash Balance</h3>
            
            <div className="mb-6 bg-green-50 p-4 rounded-lg border border-green-100">
              <p className="text-sm text-green-800">Current Cash Balance</p>
              <p className="text-3xl font-bold text-green-900">{formatCurrency(cashBalance)}</p>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600 text-sm mb-2">
                This represents the amount of cash in your investment account that is not currently allocated to stocks, 
                ETFs, or investment funds. Update this value whenever you deposit or withdraw cash from your account.
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-md font-medium mb-3">Update Cash Balance</h4>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Cash Balance Value
                  </label>
                  <input
                    type="number"
                    name="value"
                    value={cashForm.value}
                    onChange={handleCashFormChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder={cashBalance.toFixed(2)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <button
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  onClick={handleUpdateCash}
                >
                  Update Balance
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionManager;