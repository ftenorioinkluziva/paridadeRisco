// src/components/TransactionManager/TransactionsTab.js
import React, { useState } from 'react';
import { usePortfolio } from '../../contexts/PortfolioContext';
import NewTransactionForm from './forms/NewTransactionForm';

const TransactionsTab = ({ showSuccessMessage, showErrorMessage }) => {
  const {
    transactions,
    assets,
    formatCurrency,
    loading
  } = usePortfolio();

  const [formVisible, setFormVisible] = useState(false);

  return (
    <div>
      {/* Action buttons */}
      <div className="mb-4 flex justify-end">
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => setFormVisible(!formVisible)}
          disabled={loading}
        >
          {formVisible ? 'Cancel' : 'New Transaction'}
        </button>
      </div>

      {/* Transaction form */}
      {formVisible && (
        <NewTransactionForm
          onSuccess={(message) => {
            showSuccessMessage(message);
            setFormVisible(false);
          }}
          onError={showErrorMessage}
        />
      )}

      {/* Transactions list */}
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
    </div>
  );
};

export default TransactionsTab;