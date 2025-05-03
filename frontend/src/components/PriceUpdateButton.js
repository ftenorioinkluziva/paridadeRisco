// src/components/PriceUpdateButton.js
import React, { useState } from 'react';
import axios from 'axios';

const PriceUpdateButton = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({ success: null, message: '' });
  
  // API URL
  const API_URL = 'http://localhost:5001/api';
  
  const handlePriceUpdate = async () => {
    if (loading) return; // Prevenir cliques múltiplos
    
    setLoading(true);
    setResult({ success: null, message: '' });
    
    try {
      const response = await axios.post(`${API_URL}/update-prices`);
      
      setResult({
        success: true,
        message: response.data.mensagem || 'Atualização de preços iniciada com sucesso!'
      });
      
      // Iniciar timer para limpar a mensagem após 5 segundos
      setTimeout(() => {
        setResult({ success: null, message: '' });
      }, 5000);
      
    } catch (error) {
      console.error('Erro ao atualizar preços:', error);
      
      setResult({
        success: false,
        message: error.response?.data?.erro || 'Erro ao iniciar atualização de preços. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="inline-block relative">
      <button
        onClick={handlePriceUpdate}
        disabled={loading}
        className={`px-4 py-2 rounded font-medium transition-colors ${
          loading 
            ? 'bg-blue-300 text-white cursor-not-allowed' 
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {loading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Atualizando Preços...
          </span>
        ) : (
          <span className="flex items-center">
            <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Atualizar Preços
          </span>
        )}
      </button>
      
      {result.success !== null && (
        <div className={`mt-2 p-2 text-sm rounded-md ${
          result.success 
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {result.message}
        </div>
      )}
    </div>
  );
};

export default PriceUpdateButton;