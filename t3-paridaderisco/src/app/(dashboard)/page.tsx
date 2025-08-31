"use client";

import { api } from "~/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Briefcase } from "lucide-react";

export default function DashboardPage() {
  const portfolioQuery = api.portfolio.get.useQuery();
  
  // Show loading state
  if (portfolioQuery.isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (portfolioQuery.error) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Erro ao carregar portfolio</p>
            <Button onClick={() => portfolioQuery.refetch()}>
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const portfolioData = portfolioQuery.data;
  if (!portfolioData) return null;

  // Calculate totals
  const cashBalance = Number(portfolioData.cashBalance);
  const totalValue = Number(portfolioData.totalValue);
  const positionsValue = portfolioData.positions.reduce((sum, pos) => sum + pos.currentValue, 0);
  const totalCost = portfolioData.positions.reduce((sum, pos) => sum + pos.totalCost, 0);
  const totalGain = positionsValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button variant="default">
            Rebalancear Portfolio
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor Total
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              +{formatPercent(totalGainPercent)} desde o início
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Saldo em Caixa
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(cashBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Disponível para investimento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ganho Total
            </CardTitle>
            {totalGain >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              totalGain >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(totalGain)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatPercent(totalGainPercent)} de retorno
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Posições Ativas
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portfolioData.positions.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Ativos em carteira
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Positions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Posições do Portfolio</CardTitle>
            <CardDescription>
              Visão geral das suas posições atuais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-8 text-muted-foreground">
                <p>Conecte-se para ver suas posições</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Próximas Ações</CardTitle>
            <CardDescription>
              Sugestões baseadas na análise de risco
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Rebalanceamento Sugerido
                  </p>
                  <p className="text-xs text-blue-700">
                    Considere rebalancear para manter paridade de risco
                  </p>
                </div>
              </div>
              
              {cashBalance > 1000 && (
                <div className="flex items-center space-x-4 p-3 bg-green-50 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      Oportunidade de Aporte
                    </p>
                    <p className="text-xs text-green-700">
                      Saldo disponível: {formatCurrency(cashBalance)}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Sistema Funcionando
                  </p>
                  <p className="text-xs text-blue-700">
                    Dashboard carregado com sucesso
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}