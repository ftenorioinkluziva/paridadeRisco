// src/components/LastUpdateIndicator.js
import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/api';

const LastUpdateIndicator = () => {
  const [lastUpdate, setLastUpdate] = useState(null);
  const [loading, setLoading] = useState(true);
  
  
  // Função para obter a data da última atualização
  const fetchLastUpdate = async () => {
    try {
      const response = await fetch(`${API_URL}/last-update`);
      if (!response.ok) throw new Error('Erro ao obter última atualização');
      const data = await response.json();
      if (data && data.last_update) {
        setLastUpdate(new Date(data.last_update));
      }
    } catch (error) {
      console.error('Erro ao obter última atualização:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Atualizar quando o componente for montado
  useEffect(() => {
    fetchLastUpdate();
    
    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchLastUpdate, 5 * 60 * 1000);
    
    // Limpar intervalo ao desmontar
    return () => clearInterval(interval);
  }, []);
  
  // Formatar a data e calcular o tempo desde a última atualização
  const formatDate = (date) => {
    if (!date) return 'Nunca';
    
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHour / 24);
    
    if (diffDays > 0) {
      return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
    } else if (diffHour > 0) {
      return `${diffHour} hora${diffHour > 1 ? 's' : ''} atrás`;
    } else if (diffMin > 0) {
      return `${diffMin} minuto${diffMin > 1 ? 's' : ''} atrás`;
    } else {
      return 'Agora mesmo';
    }
  };
  
  return (
    <div className="flex items-center text-sm">
      <span className="text-gray-600 mr-1">Última atualização:</span>
      {loading ? (
        <span className="text-gray-400">Carregando...</span>
      ) : (
        <span className="font-medium">
          {formatDate(lastUpdate)}
          {lastUpdate && (
            <span className="text-gray-400 text-xs ml-1">
              ({lastUpdate.toLocaleString()})
            </span>
          )}
        </span>
      )}
    </div>
  );
};

export default LastUpdateIndicator;