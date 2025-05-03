// src/components/TransactionManager/forms/NewFundForm.js
import React, { useState } from 'react';
import { usePortfolio } from '../../../contexts/PortfolioContext';

const NewFundForm = ({ onSuccess, onError }) => {
  const { addInvestmentFund, loading } = usePortfolio();
  
  const [formData, setFormData] = useState({
    name: '',
    initial_investment: '',
    investment_date: new Date().toISOString().split('T')[0],
    current_value: ''
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
    if (!formData.name || !formData.initial_investment || !formData.current_value || !formData.investment_date) {
      onError('Please fill in all fields for the investment fund');
      return;
    }
    
    const result = await addInvestmentFund({
      name: formData.name,
      initial_investment: parseFloat(formData.initial_investment),
      current_value: parseFloat(formData.current_value),
      investment_date: formData.investment_date
    });
    
    if (result.success) {
      onSuccess('Investment Fund added successfully!');
      
      // Reset form
      setFormData({
        name: '',
        initial_investment: '',
        investment_date: new Date().toISOString().split('T')[0],
        current_value: ''
      });
    } else {
      onError(result.error || 'Failed to add investment fund');
    }
  };

  return (
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
            value={formData.name}
            onChange={handleFormChange}
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
            value={formData.initial_investment}
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
            Investment Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="investment_date"
            value={formData.investment_date}
            onChange={handleFormChange}
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
            value={formData.current_value}
            onChange={handleFormChange}
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
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Add Investment Fund'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewFundForm;