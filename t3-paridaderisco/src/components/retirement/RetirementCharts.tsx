"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
  calcularEvolucaoPatrimonio,
  calcularEvolucaoRenda,
} from "~/lib/utils/retirementCalculations";

interface RetirementChartsProps {
  inputData: {
    idadeAtual: number;
    patrimonioInicial: number;
    aporteMensal: number;
    idadeAposentadoria: number;
    periodoUsufruir: number;
    previsaoInflacaoAnual: number;
    taxaRealAcumulacao: number;
    taxaRealAposentadoria: number;
    valorReceberAnualDesejado: number;
    aliquotaIR: number;
  };
}

export function RetirementCharts({ inputData }: RetirementChartsProps) {
  const patrimonioData = useMemo(
    () => calcularEvolucaoPatrimonio(inputData),
    [inputData]
  );

  const rendaData = useMemo(
    () => calcularEvolucaoRenda(inputData),
    [inputData]
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Preparar dados para os gráficos
  const chartDataPatrimonio = patrimonioData.evolucao.map((item) => ({
    idade: item.idade,
    patrimonio: item.patrimonio,
    fase: item.fase,
    aporteAcumulado: item.aporteAcumulado,
    rendimentos: item.rendimentos,
  }));

  const chartDataRenda = rendaData.evolucaoRenda.map((item) => ({
    idade: item.idade,
    rendaBruta: item.rendaBruta,
    rendaLiquida: item.rendaLiquida,
  }));

  // Encontrar ponto de transição (início da aposentadoria)
  const pontoTransicao = chartDataPatrimonio.find(
    (item) => item.fase === "aposentadoria"
  );

  return (
    <div className="space-y-6 mt-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Evolução do Patrimônio */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução do Patrimônio</CardTitle>
            <CardDescription>
              Projeção ano a ano durante acumulação e aposentadoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Métricas resumidas */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Inicial</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(patrimonioData.patrimonioInicial)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Máximo</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(patrimonioData.patrimonioMaximo)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Final</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(patrimonioData.patrimonioFinal)}
                </p>
              </div>
            </div>

            {/* Gráfico */}
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartDataPatrimonio}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="idade"
                  label={{ value: "Idade", position: "insideBottom", offset: -5 }}
                />
                <YAxis
                  tickFormatter={(value) => formatCurrency(value)}
                  width={80}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Idade: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="patrimonio"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Patrimônio"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="aporteAcumulado"
                  stroke="#94a3b8"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  name="Capital Investido"
                  dot={false}
                />
                {pontoTransicao && (
                  <ReferenceDot
                    x={pontoTransicao.idade}
                    y={pontoTransicao.patrimonio}
                    r={6}
                    fill="#f59e0b"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>

            {/* Legenda de fases */}
            <div className="flex items-center justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span>Acumulação</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                <span>Início Aposentadoria</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-400 rounded border-2 border-dashed"></div>
                <span>Capital Investido</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Evolução da Renda */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução da Renda na Aposentadoria</CardTitle>
            <CardDescription>
              Comparação entre renda bruta (nominal) e líquida (poder de compra)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Métricas resumidas */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Renda Inicial</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(rendaData.rendaInicial)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Renda Final</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(rendaData.rendaFinal)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Crescimento</p>
                <p className="text-lg font-semibold text-blue-600">
                  {formatPercentage(rendaData.crescimento)}
                </p>
              </div>
            </div>

            {/* Gráfico */}
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartDataRenda}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="idade"
                  label={{ value: "Idade", position: "insideBottom", offset: -5 }}
                />
                <YAxis
                  tickFormatter={(value) => formatCurrency(value)}
                  width={80}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Idade: ${label}`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="rendaBruta"
                  stackId="1"
                  stroke="#ef4444"
                  fill="#fca5a5"
                  fillOpacity={0.6}
                  name="Renda Bruta (Nominal)"
                />
                <Area
                  type="monotone"
                  dataKey="rendaLiquida"
                  stroke="#3b82f6"
                  fill="#93c5fd"
                  fillOpacity={0.8}
                  name="Renda Líquida (Real)"
                />
              </AreaChart>
            </ResponsiveContainer>

            {/* Explicação */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Renda Bruta (Nominal):</strong> Valor corrigido pela inflação ao longo dos anos.
                <br />
                <strong>Renda Líquida (Real):</strong> Poder de compra equivalente em valores de hoje.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
