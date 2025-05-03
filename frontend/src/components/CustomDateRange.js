import React, { useState, useEffect } from 'react';

const CustomDateRange = ({ onDateRangeChange }) => {
  const [showCustomDates, setShowCustomDates] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  // Set default date range (end date is today, start date is 3 years ago)
  useEffect(() => {
    const today = new Date();
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(today.getFullYear() - 3);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(threeYearsAgo.toISOString().split('T')[0]);
  }, []);

  const handleApply = () => {
    // Validate dates
    if (!startDate || !endDate) {
      setError('Por favor, selecione as datas de início e fim');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      setError('A data de início não pode ser posterior à data de fim');
      return;
    }

    // Calculate the number of days between the dates
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Call the parent callback with the custom date range
    onDateRangeChange(diffDays, startDate, endDate);
    setError('');
    
    // Hide the date picker after applying
    setShowCustomDates(false);
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold text-gray-800">Período de Análise</h2>
        <button
          onClick={() => setShowCustomDates(!showCustomDates)}
          className="px-3 py-1 text-sm rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
        >
          {showCustomDates ? 'Esconder' : 'Customizar Datas'}
        </button>
      </div>

      {showCustomDates && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 mb-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                Data Início
              </label>
              <input
                type="date"
                id="start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                max={endDate}
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                Data Fim
              </label>
              <input
                type="date"
                id="end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          
          {error && (
            <div className="text-red-500 text-sm mb-2">
              {error}
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDateRange;