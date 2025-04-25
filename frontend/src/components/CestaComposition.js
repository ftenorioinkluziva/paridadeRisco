// /Componente para Visualização da Composição da Cesta

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const CestaComposition = ({ nome, ativos, cestaAtivos, getNomeAtivo }) => {
  // Filtrar apenas ativos com peso > 0
  const ativosComPeso = Object.entries(cestaAtivos)
    .filter(([_, peso]) => parseFloat(peso) > 0)
    .map(([ticker, peso]) => ({
      ticker,
      nome: getNomeAtivo(ticker),
      peso: parseFloat(peso)
    }))
    .sort((a, b) => b.peso - a.peso);

  // Preparar dados para o gráfico de pizza
  const data = ativosComPeso.map(ativo => ({
    name: ativo.nome,
    value: ativo.peso,
    ticker: ativo.ticker
  }));

  // Cores para o gráfico
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', 
    '#82CA9D', '#A4DE6C', '#D0ED57', '#FFC658', '#FF7C43'
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow-sm">
          <p className="font-medium">{payload[0].payload.name}</p>
          <p className="text-sm text-gray-600">{`Ticker: ${payload[0].payload.ticker}`}</p>
          <p className="text-sm text-blue-600">{`Peso: ${payload[0].value.toFixed(2)}%`}</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ 
    cx, cy, midAngle, innerRadius, outerRadius, percent, index 
  }) => {
    // Mostrar label apenas para fatias maiores que 5%
    if (percent < 0.05) return null;

    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h2 className="text-xl font-semibold mb-3 text-gray-800">Composição da {nome}</h2>
      
      {ativosComPeso.length === 0 ? (
        <p className="text-gray-500 text-center py-4">
          Esta cesta não possui ativos com peso definido.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div>
            <h3 className="text-md font-medium mb-2 text-gray-700">Detalhamento</h3>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {ativosComPeso.map((ativo) => (
                <div key={ativo.ticker} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-gray-900">{ativo.nome}</p>
                    <p className="text-xs text-gray-500">{ativo.ticker}</p>
                  </div>
                  <div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {ativo.peso.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CestaComposition;