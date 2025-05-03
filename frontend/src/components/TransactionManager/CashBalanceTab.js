// src/components/TransactionManager/CashBalanceTab.js
import React, { useState } from 'react';
import { usePortfolio } from '../../contexts/PortfolioContext';
import UpdateCashForm from './forms/UpdateCashForm';

const CashBalanceTab = ({ showSuccessMessage, showErrorMessage }) => {
  const {
    cashBalance,
    formatCurrency,
    loading
  } = usePortfolio();

  const [cashFormVisible, setCashFormVisible] = useState(false);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-4 flex justify-end">
        <button 
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={() => setCashFormVisible(!cashFormVisible)}
          disabled={loading}
        >
          {cashFormVisible ? 'Cancel' : 'Update Cash Balance'}
        </button>
      </div>

      {/* Cash Form */}
      {cashFormVisible && (
        <UpdateCashForm
          onSuccess={(message) => {
            showSuccessMessage(message);
            setCashFormVisible(false);
          }}
          onError={showErrorMessage}
        />
      )}

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
    </div>
  );
};

export default CashBalanceTab;