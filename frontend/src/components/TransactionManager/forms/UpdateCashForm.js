// src/components/TransactionManager/forms/UpdateCashForm.js
import React, { useState } from 'react';
import { usePortfolio } from '../../../contexts/PortfolioContext';

const UpdateCashForm = ({ onSuccess, onError }) => {
  const { cashBalance, updateCashBalance, loading } = usePortfolio();
  
  const [formData, setFormData] = useState({
    value: ''
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
    if (!formData.value) {
      onError('Please enter a cash balance value');
      return;
    }
    
    const result = await updateCashBalance(formData.value);
    
    if (result.success) {
      onSuccess('Cash balance updated successfully!');
      
      // Reset form
      setFormData({ value: '' });
    } else {
      onError(result.error || 'Failed to update cash balance');
    }
  };

  return (
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
            value={formData.value}
            onChange={handleFormChange}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder={cashBalance.toFixed(2)}
            min="0"
            step="0.01"
            disabled={loading}
          />
        </div>
        
        <div className="flex items-end">
          <button
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Update Cash Balance'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateCashForm;