"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Target, AlertTriangle } from "lucide-react";
import type { BasketPerformance } from "~/lib/utils/basketPerformance";

interface BasketPerformanceDetailProps {
  performance: BasketPerformance;
  cestaName: string;
}

export function BasketPerformanceDetail({ performance, cestaName }: BasketPerformanceDetailProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value);
  };

  const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  const formatPercentAbs = (value: number) => `${value.toFixed(2)}%`;

  const isPositive = performance.retornoPercentual >= 0;

  // Prepare chart data
  const chartData = performance.evolucaoHistorica.map((point) => ({
    data: new Date(point.date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    Cesta: point.valor,
    CDI: point.valorCDI,
    IPCA: point.valorIPCA,
  }));

  // Get benchmark data
  const cdiBenchmark = performance.benchmarks.find(b => b.nome === 'CDI');
  const ipcaBenchmark = performance.benchmarks.find(b => b.nome === 'IPCA');

  // Interpret Sharpe Ratio
  const getSharpeInterpretation = (sharpe: number): { label: string; color: string } => {
    if (sharpe > 2) return { label: 'Excelente', color: 'text-green-600' };
    if (sharpe > 1) return { label: 'Bom', color: 'text-green-500' };
    if (sharpe > 0.5) return { label: 'Aceitável', color: 'text-yellow-600' };
    if (sharpe > 0) return { label: 'Fraco', color: 'text-orange-600' };
    return { label: 'Ruim', color: 'text-red-600' };
  };

  const sharpeInfo = getSharpeInterpretation(performance.sharpeRatio);

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{cestaName}</CardTitle>
              <CardDescription>Análise Detalhada - {performance.periodoLabel}</CardDescription>
            </div>
            <div className={`text-right ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <div className="flex items-center gap-2">
                {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                <span className="text-3xl font-bold">{formatPercent(performance.retornoPercentual)}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatCurrency(performance.ganhoAbsoluto)} • {formatPercent(performance.retornoAnualizado)} a.a.
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução do Patrimônio</CardTitle>
          <CardDescription>Comparação com benchmarks (investimento hipotético de R$ 10.000)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelStyle={{ color: '#000' }}
              />
              <Legend />
              <Line type="monotone" dataKey="Cesta" stroke="#2563eb" strokeWidth={3} dot={false} />
              {cdiBenchmark && <Line type="monotone" dataKey="CDI" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} />}
              {ipcaBenchmark && <Line type="monotone" dataKey="IPCA" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Benchmarks and Risk Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Benchmark Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Comparação com Benchmarks
            </CardTitle>
            <CardDescription>Performance relativa a índices de mercado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* CDI */}
              {cdiBenchmark && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-semibold">CDI</div>
                    <div className="text-sm text-muted-foreground">Taxa livre de risco</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatPercent(cdiBenchmark.retorno)}</div>
                    <div className={`text-sm ${cdiBenchmark.diferenca >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercent(cdiBenchmark.diferenca)} vs Cesta
                    </div>
                  </div>
                </div>
              )}

              {/* IPCA */}
              {ipcaBenchmark && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-semibold">IPCA</div>
                    <div className="text-sm text-muted-foreground">Inflação</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatPercent(ipcaBenchmark.retorno)}</div>
                    <div className={`text-sm ${ipcaBenchmark.diferenca >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercent(ipcaBenchmark.diferenca)} vs Cesta
                    </div>
                  </div>
                </div>
              )}

              {performance.benchmarks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="mx-auto h-10 w-10 mb-2 opacity-50" />
                  <p className="text-sm">Dados de benchmarks não disponíveis</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Risk Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Métricas de Risco
            </CardTitle>
            <CardDescription>Volatilidade e retorno ajustado ao risco</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Volatility */}
              <div className="p-4 border rounded-lg bg-chart-1/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-chart-1">Volatilidade</span>
                  <Badge variant="outline" className="bg-white">
                    {formatPercentAbs(performance.volatilidade)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Desvio padrão dos retornos mensais. Quanto maior, mais arriscado.
                </p>
              </div>

              {/* Sharpe Ratio */}
              <div className={`p-4 border rounded-lg ${
                performance.sharpeRatio > 1 ? 'bg-success/10' :
                performance.sharpeRatio > 0 ? 'bg-warning/10' : 'bg-destructive/10'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${
                    performance.sharpeRatio > 1 ? 'text-success' :
                    performance.sharpeRatio > 0 ? 'text-warning' : 'text-destructive'
                  }`}>
                    Índice Sharpe
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-white">
                      {performance.sharpeRatio.toFixed(2)}
                    </Badge>
                    <Badge className={sharpeInfo.color}>
                      {sharpeInfo.label}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Retorno ajustado ao risco. Quanto maior, melhor a relação risco/retorno.
                </p>
              </div>

              {/* Interpretation Guide */}
              <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/30 rounded-lg">
                <p className="font-semibold mb-1">Interpretação do Sharpe:</p>
                <p>• &gt; 2.0: Excelente</p>
                <p>• 1.0 - 2.0: Bom</p>
                <p>• 0.5 - 1.0: Aceitável</p>
                <p>• &lt; 0.5: Fraco/Ruim</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assets Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Composição da Performance</CardTitle>
          <CardDescription>Contribuição de cada ativo para o retorno total</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {performance.ativosReturns.map((asset) => {
              const contribution = asset.weightedReturn;
              const isPositiveContribution = contribution >= 0;

              return (
                <div key={asset.ativoId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{asset.ticker}</span>
                      <Badge variant="secondary" className="text-xs">
                        {formatPercentAbs(asset.allocation)}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(asset.startPrice)} → {formatCurrency(asset.endPrice)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${asset.returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercent(asset.returnPercentage)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Contribuiu {formatPercent(contribution)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Warning if insufficient data */}
      {!performance.temDadosSuficientes && (
        <Card className="border-yellow-500 bg-warning/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-warning">Dados Parciais</h4>
                <p className="text-sm text-warning">
                  Alguns ativos não possuem dados históricos completos para o período selecionado.
                  Os cálculos foram feitos com os dados disponíveis.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
