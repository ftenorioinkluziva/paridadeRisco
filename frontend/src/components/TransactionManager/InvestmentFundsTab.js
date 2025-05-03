// src/components/TransactionManager/InvestmentFundsTab.js
import React, { useState } from 'react';
import { usePortfolio } from '../../contexts/PortfolioContext';
import NewFundForm from './forms/NewFundForm';

const InvestmentFundsTab = ({ showSuccessMessage, showErrorMessage }) => {
  const {
    investmentFunds,
    formatCurrency,
    loading,
    updateInvestmentFund,
    deleteInvestmentFund
  } = usePortfolio();

  const [fundFormVisible, setFundFormVisible] = useState(false);
  
  // State for temporarily storing values before updating
  const [tempFundValues, setTempFundValues] = useState({});

  // Calculate return for funds
  const calculateFundReturn = (fund) => {
    const initialInvestment = parseFloat(fund.initial_investment || 0);
    if (initialInvestment <= 0) return 0;
    
    const currentValue = parseFloat(fund.current_value || 0);
    return ((currentValue - initialInvestment) / initialInvestment) * 100;
  };

  // Handle temporary changes to fund values
  const handleTempFundChange = (fundId, field, value) => {
    setTempFundValues(prev => ({
      ...prev,
      [fundId]: {
        ...(prev[fundId] || {}),
        [field]: value
      }
    }));
  };

  // Update fund with new values
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
        showSuccessMessage('Investment Fund updated successfully!');
      } else {
        showErrorMessage(result.error || 'Error updating investment fund');
      }
    } catch (err) {
      showErrorMessage('Error updating investment fund');
    }
  };

  // Update only the current value
  const handleUpdateCurrentValue = async (fundId) => {
    if (!tempFundValues[fundId] || !tempFundValues[fundId].current_value) {
      showErrorMessage('No changes to update');
      return;
    }

    try {
      const fund = investmentFunds.find(f => f.id === fundId);
      if (!fund) return;
      
      const updateData = { ...fund };
      updateData.current_value = parseFloat(tempFundValues[fundId].current_value);
      
      const result = await updateInvestmentFund(fundId, updateData);
      
      if (result.success) {
        showSuccessMessage('Fund current value updated successfully!');
        
        // Clear value from temporary state
        setTempFundValues(prev => {
          const newValues = { ...prev };
          delete newValues[fundId];
          return newValues;
        });
      } else {
        showErrorMessage(result.error || 'Error updating fund current value');
      }
    } catch (err) {
      showErrorMessage('Error updating fund current value');
    }
  };

  // Delete a fund
  const handleDeleteFund = async (id) => {
    if (!window.confirm('Are you sure you want to delete this investment fund?')) {
      return;
    }
    
    const result = await deleteInvestmentFund(id);
    
    if (result.success) {
      showSuccessMessage('Investment Fund deleted successfully!');
    } else {
      showErrorMessage(result.error || 'Error deleting investment fund');
    }
  };

  return (
    <div>
      {/* Action buttons */}
      <div className="mb-4 flex justify-end">
        <button 
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          onClick={() => setFundFormVisible(!fundFormVisible)}
          disabled={loading}
        >
          {fundFormVisible ? 'Cancel' : 'Add Investment Fund'}
        </button>
      </div>

      {/* Fund Form */}
      {fundFormVisible && (
        <NewFundForm
          onSuccess={(message) => {
            showSuccessMessage(message);
            setFundFormVisible(false);
          }}
          onError={showErrorMessage}
        />
      )}

      {/* Investment Funds list */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fund Name</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Initial Investment</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current Value</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Profit/Loss</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Return %</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Delete</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {investmentFunds.length > 0 ? investmentFunds.map(fund => {
              const profit = fund.current_value - fund.initial_investment;
              const returnPercentage = calculateFundReturn(fund);
              const tempValue = tempFundValues[fund.id]?.current_value;
              
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
                    <div className="flex items-center">
                      <input 
                        type="number"
                        value={tempValue !== undefined ? tempValue : fund.current_value || ''}
                        onChange={(e) => handleTempFundChange(fund.id, 'current_value', e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded text-right"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <button
                      onClick={() => handleUpdateCurrentValue(fund.id)}
                      className="px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
                      disabled={tempFundValues[fund.id]?.current_value === undefined}
                    >
                      Update Current Value
                    </button>
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
                <td colSpan="8" className="px-4 py-4 text-center text-gray-500">
                  No investment funds found. Add funds to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvestmentFundsTab;