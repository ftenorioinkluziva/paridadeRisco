"use client";

import { MetricCard } from "~/components/overview/MetricCard";
import { PortfolioChart } from "~/components/overview/PortfolioChart";
import { AssetRanking } from "~/components/overview/AssetRanking";
import { NotificationPanel } from "~/components/overview/NotificationPanel";
import { Badge } from "~/components/ui/badge";
import { TrendingUp, DollarSign, Target, AlertTriangle } from "lucide-react";
import dynamic from "next/dynamic";
import { api } from "~/lib/api";

const TimeDisplay = dynamic(
  () => import("~/components/overview/TimeDisplay").then((mod) => ({ default: mod.TimeDisplay })),
  { ssr: false }
);

export default function OverviewPage() {
  // Fetch real portfolio metrics
  const { data: metrics, isLoading: metricsLoading } = api.portfolio.getMetrics.useQuery();

  // Mock data - substituir por dados reais via tRPC
  const chartData = [
    { date: "06/07", portfolio: 280000, benchmark: 300000, target: 250000 },
    { date: "07/07", portfolio: 320000, benchmark: 310000, target: 250000 },
    { date: "08/07", portfolio: 290000, benchmark: 295000, target: 250000 },
    { date: "09/07", portfolio: 350000, benchmark: 320000, target: 250000 },
    { date: "10/07", portfolio: 310000, benchmark: 315000, target: 250000 },
    { date: "11/07", portfolio: 280000, benchmark: 300000, target: 250000 },
    { date: "12/07", portfolio: 520000, benchmark: 400000, target: 250000 },
    { date: "13/07", portfolio: 180000, benchmark: 280000, target: 250000 },
  ];

  const topAssets = [
    {
      rank: 1,
      ticker: "IVVB11",
      name: "S&P 500 ETF",
      performance: 12.5,
      value: "R$ 45.2k",
    },
    {
      rank: 2,
      ticker: "BOVA11",
      name: "Ibovespa ETF",
      performance: 8.3,
      value: "R$ 38.7k",
    },
    {
      rank: 3,
      ticker: "CDI",
      name: "CDI (100%)",
      performance: 11.2,
      value: "R$ 35.1k",
    },
    {
      rank: 4,
      ticker: "HASH11",
      name: "NAS DAQ ETF",
      performance: -2.4,
      value: "R$ 28.9k",
    },
  ];

  const notifications = [
    {
      id: "1",
      title: "REBALANCEAMENTO NECESSÁRIO",
      message:
        "Seu portfólio está desbalanceado. Recomendamos ajuste na alocação de IVVB11.",
      timestamp: "Há 2 horas",
      type: "warning" as const,
      badge: "AÇÃO NECESSÁRIA",
    },
    {
      id: "2",
      title: "DIVIDENDOS RECEBIDOS",
      message: "Você recebeu R$ 2.450,00 em dividendos de BOVA11 e IVVB11.",
      timestamp: "Ontem",
      type: "success" as const,
      badge: "NOVO",
    },
    {
      id: "3",
      title: "ATUALIZAÇÃO DO SISTEMA",
      message: "Novos gráficos de análise de risco foram adicionados.",
      timestamp: "10/07/2024",
      type: "info" as const,
    },
    {
      id: "4",
      title: "META ATINGIDA",
      message:
        "Parabéns! Seu portfólio atingiu a meta de rentabilidade do trimestre.",
      timestamp: "08/07/2024",
      type: "success" as const,
      badge: "SUCESSO",
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">OVERVIEW</h1>
          </div>
          <div className="text-sm text-muted-foreground">
            Última atualização: {new Date().toLocaleTimeString("pt-BR")}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="VALOR TOTAL"
            value={metricsLoading ? "..." : new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(metrics?.totalValue || 0)}
            subtitle="PORTFOLIO + FUNDOS + CAIXA"
            trend="up"
            icon={<DollarSign className="h-5 w-5" />}
          />
          <MetricCard
            title="GANHO/PERDA"
            value={metricsLoading ? "..." : new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(metrics?.totalGain || 0)}
            subtitle={(metrics?.totalGainPercent || 0) >= 0 ? `+${(metrics?.totalGainPercent || 0).toFixed(2)}%` : `${(metrics?.totalGainPercent || 0).toFixed(2)}%`}
            trend={(metrics?.totalGain || 0) >= 0 ? "up" : "down"}
            badge={
              <Badge className={(metrics?.totalGain || 0) >= 0 ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}>
                {(metrics?.totalGain || 0) >= 0 ? "LUCRO" : "PREJUÍZO"}
              </Badge>
            }
          />
          <MetricCard
            title="RISCO BALANCEADO"
            value={metricsLoading ? "..." : `${metrics?.riskBalanceScore || 0}%`}
            subtitle="PARIDADE DE RISCO"
            trend={(metrics?.riskBalanceScore || 0) >= 90 ? "up" : (metrics?.riskBalanceScore || 0) >= 70 ? "neutral" : "down"}
            badge={
              <Badge className="bg-blue-500/20 text-blue-500">
                ALVO: 100%
              </Badge>
            }
          />
        </div>

        {/* Portfolio Chart */}
        <PortfolioChart
          data={chartData}
          title="EVOLUÇÃO DO PORTFÓLIO"
        />

        {/* Asset Ranking */}
        <AssetRanking
          assets={topAssets}
          title="RANKING DE ATIVOS"
          newCount={2}
        />
      </div>

      {/* Sidebar */}
      <div className="lg:w-96 space-y-4">
        <TimeDisplay location="SÃO PAULO, BRASIL" temperature="18°C" />
        <NotificationPanel notifications={notifications} />
      </div>
    </div>
  );
}
