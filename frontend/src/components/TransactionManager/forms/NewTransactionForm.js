// src/components/TransactionManager/forms/NewTransactionForm.js
import React, { useState } from 'react';
import { usePortfolio } from '../../../contexts/PortfolioContext';

const NewTransactionForm = ({ onSuccess, onError }) => {
  const { assets, addTransaction, loading } = usePortfolio();
  
  const [formData, setFormData] = useState({
    type: 'buy',
    ativo_id: '',
    quantity: '',
    price: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Handler for form changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!formData.ativo_id || !formData.quantity || !formData.price || !formData.date) {
      onError('Please fill in all fields');
      return;
    }
    
    const result = await addTransaction(formData);
    
    if (result.success) {
      onSuccess('Transaction added successfully!');
      
      // Reset form
      setFormData({
        type: 'buy',
        ativo_id: '',
        quantity: '',
        price: '',
        date: new Date().toISOString().split('T')[0]
      });
    } else {
      onError(result.error || 'Failed to add transaction');
    }
  };

  return (
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
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Add Transaction'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewTransactionForm;