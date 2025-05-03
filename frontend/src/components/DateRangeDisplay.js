import React from 'react';

const DateRangeDisplay = ({ startDate, endDate, periodoComparativo }) => {
  // If we have custom dates, show them, otherwise show the period in days
  const isCustomRange = startDate && endDate;
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };
  
  // Get period description based on days
  const getPeriodoDescricao = (dias) => {
    switch(dias) {
      case 30: return '30 dias';
      case 90: return '90 dias';
      case 180: return '6 meses';
      case 365: return '1 ano';
      case 1095: return '3 anos';
      case 1825: return '5 anos';
      default: return `${dias} dias`;
    }
  };
  
  return (
    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4 flex items-center justify-between">
      <div>
        <span className="text-sm font-medium text-blue-800">Período analisado: </span>
        {isCustomRange ? (
          <span className="text-sm text-blue-600">
            {formatDate(startDate)} até {formatDate(endDate)} ({periodoComparativo} dias)
          </span>
        ) : (
          <span className="text-sm text-blue-600">
            {getPeriodoDescricao(periodoComparativo)}
          </span>
        )}
      </div>
      
      {isCustomRange && (
        <div className="text-xs text-blue-500">
          Período personalizado ativo
        </div>
      )}
    </div>
  );
};

export default DateRangeDisplay;