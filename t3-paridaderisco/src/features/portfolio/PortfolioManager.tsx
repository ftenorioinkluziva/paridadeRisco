"use client";

import { useState, useEffect } from "react";
import { api } from "~/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  ArrowUpDown,
  Plus,
  Minus,
  PiggyBank
} from "lucide-react";
import { FundManager } from "~/features/funds/FundManager";
import { TransactionManager } from "~/features/transactions/TransactionManager";
import { PortfolioEvolutionChart } from "~/features/portfolio/PortfolioEvolutionChart";
import { formatNumberByAssetClass } from "~/lib/utils";

export function PortfolioManager() {
  const [selectedTab, setSelectedTab] = useState("overview");

  const portfolioQuery = api.portfolio.get.useQuery();
  const fundStatsQuery = api.fundo.getStats.useQuery();
  const fundListQuery = api.fundo.list.useQuery();

  // Fetch user profile to get selected basket
  const userProfileQuery = api.user.getUserProfile.useQuery();

  const [selectedBasketId, setSelectedBasketId] = useState<string | null>(null);
  const [rebalanceData, setRebalanceData] = useState<any>(null);
  const [isLoadingRebalance, setIsLoadingRebalance] = useState(false);
  const [includeCashInBase, setIncludeCashInBase] = useState(true);
  
  const updateProfileMutation = api.user.updateUserProfile.useMutation();

  const rebalanceMutation = api.portfolio.getRebalancePlan.useMutation({
    onSuccess: (data) => {
      setRebalanceData(data);
      setIsLoadingRebalance(false);
    },
    onError: (error) => {
      setIsLoadingRebalance(false);

      // If basket not found, clear the selected basket
      if (error.message.includes("Basket not found")) {
        setSelectedBasketId(null);
        // Clear selectedBasketId in user profile
        updateProfileMutation.mutate({ selectedBasketId: null });
      }
    },
  });

  // Function to calculate rebalance plan
  const calculateRebalancePlan = (cestaId: string) => {
    if (!portfolioData) return;
    
    setIsLoadingRebalance(true);
    setRebalanceData(null);
    
    // Use total portfolio value as target amount for rebalancing
    const targetAmount = Number(portfolioData.totalValue);
    
    rebalanceMutation.mutate({
      cestaId,
      targetAmount,
      includeCashInBase,
    });
  };
  
  const cestasQuery = api.cesta.list.useQuery();

  // Auto-load selected basket from user profile
  useEffect(() => {
    if (userProfileQuery.data?.selectedBasketId && !selectedBasketId && portfolioQuery.data) {
      const basketId = userProfileQuery.data.selectedBasketId;
      setSelectedBasketId(basketId);
      // Calculate rebalance plan
      const targetAmount = Number(portfolioQuery.data.totalValue);
      setIsLoadingRebalance(true);
      setRebalanceData(null);
      rebalanceMutation.mutate({
        cestaId: basketId,
        targetAmount,
        includeCashInBase,
      });
    }
  }, [userProfileQuery.data, portfolioQuery.data]);

  // Recalculate when cash inclusion setting changes
  useEffect(() => {
    if (selectedBasketId && portfolioQuery.data) {
      const targetAmount = Number(portfolioQuery.data.totalValue);
      setIsLoadingRebalance(true);
      setRebalanceData(null);
      rebalanceMutation.mutate({
        cestaId: selectedBasketId,
        targetAmount,
        includeCashInBase,
      });
    }
  }, [includeCashInBase]);

  if (portfolioQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando dados do portfolio...</p>
        </div>
      </div>
    );
  }

  if (portfolioQuery.error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Erro ao carregar portfolio</p>
          <Button onClick={() => portfolioQuery.refetch()}>
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  const portfolioData = portfolioQuery.data;
  if (!portfolioData) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
  };

  const fundStats = fundStatsQuery.data;
  const fundsValue = fundStats?.valorAtual || 0;
  const fundsGain = fundStats?.ganhoPerda || 0;
  
  const totalValue = Number(portfolioData.totalValue) + fundsValue;
  const cashBalance = Number(portfolioData.cashBalance);
  const positionsValue = portfolioData.positions.reduce((sum, pos) => sum + pos.currentValue, 0);
  const totalCost = portfolioData.positions.reduce((sum, pos) => sum + pos.totalCost, 0);
  const totalGain = positionsValue - totalCost + fundsGain;
  
  // Calculate total allocation base (positions + funds)
  const totalAllocationValue = positionsValue + fundsValue;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gerenciamento de Portfolio</h2>
          <p className="text-muted-foreground">
            Gerencie suas posições e analise performance detalhada
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            Relatórios
          </Button>
          <Button>
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Rebalancear
          </Button>
        </div>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              Portfolio + Fundos + Caixa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posições</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(positionsValue)}</div>
            <p className="text-xs text-muted-foreground">
              {portfolioData.positions.length} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganho/Perda</CardTitle>
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
              {formatPercent(totalCost > 0 ? (totalGain / totalCost) * 100 : 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Caixa</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(cashBalance)}</div>
            <p className="text-xs text-muted-foreground">
              Disponível
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="positions">Posições</TabsTrigger>
          <TabsTrigger value="funds">Fundos</TabsTrigger>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="rebalance">Rebalanceamento</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Portfolio Evolution Chart */}
          <PortfolioEvolutionChart />

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Alocação por Ativo</CardTitle>
                <CardDescription>
                  Distribuição percentual do portfolio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Stock Positions */}
                  {portfolioData.positions.map((position) => {
                    const allocation = totalAllocationValue > 0 ? (position.currentValue / totalAllocationValue) * 100 : 0;
                    return (
                      <div key={position.ativo.id} className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {position.ativo.ticker.substring(0, 2)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{position.ativo.ticker}</span>
                            <span className="text-sm text-muted-foreground">
                              {allocation.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${allocation}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(position.currentValue)}</div>
                          <div className={`text-sm ${
                            position.unrealizedGain >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(position.unrealizedGain)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Fund Positions */}
                  {fundListQuery.data?.map((fund) => {
                    const allocation = totalAllocationValue > 0 ? (fund.currentValue / totalAllocationValue) * 100 : 0;
                    return (
                      <div key={`fund-${fund.id}`} className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
                          <PiggyBank className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">
                              {fund.name.length > 20 ? fund.name.substring(0, 20) + '...' : fund.name}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {allocation.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-success h-2 rounded-full" 
                              style={{ width: `${allocation}%` }}
                            />
                          </div>
                          {fund.indice && (
                            <div className="text-xs text-gray-500 mt-1">
                              Vinculado: {fund.indice.ticker}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(fund.currentValue)}</div>
                          <div className={`text-sm ${
                            fund.ganhoPerda >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(fund.ganhoPerda)}
                          </div>
                        </div>
                      </div>
                    );
                  }) ?? []}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumo de Performance</CardTitle>
                <CardDescription>
                  Métricas principais do portfolio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="font-medium">Custo Total Investido</span>
                    <span className="font-bold">{formatCurrency(totalCost)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="font-medium">Valor Atual das Posições</span>
                    <span className="font-bold">{formatCurrency(positionsValue)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="font-medium">Valor dos Fundos</span>
                    <span className="font-bold">{formatCurrency(fundsValue)}</span>
                  </div>
                  <div className={`flex items-center justify-between p-3 rounded-lg ${
                    totalGain >= 0 ? 'bg-success/10' : 'bg-destructive/10'
                  }`}>
                    <span className="font-medium">Ganho/Perda Total</span>
                    <span className={`font-bold ${
                      totalGain >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(totalGain)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                    <span className="font-medium">Número de Ativos</span>
                    <span className="font-bold">{portfolioData.positions.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="positions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Posições Detalhadas</CardTitle>
              <CardDescription>
                Análise completa de cada posição no portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {portfolioData.positions.map((position) => (
                  <div key={position.ativo.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="font-bold text-primary">
                            {position.ativo.ticker.substring(0, 2)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{position.ativo.ticker}</h3>
                          <p className="text-muted-foreground">{position.ativo.name}</p>
                          <div className="flex space-x-4 mt-2 text-sm">
                            <span>Shares: {formatNumberByAssetClass(position.shares, position.ativo.type)}</span>
                            <span>Preço Médio: {formatCurrency(position.averagePrice)}</span>
                            <span>Preço Atual: {formatCurrency(position.currentPrice)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">{formatCurrency(position.currentValue)}</div>
                        <div className={`text-lg font-semibold ${
                          position.unrealizedGain >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {position.unrealizedGain >= 0 ? <Plus className="inline w-4 h-4 mr-1" /> : <Minus className="inline w-4 h-4 mr-1" />}
                          {formatCurrency(Math.abs(position.unrealizedGain))}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatPercent(position.totalCost > 0 ? (position.unrealizedGain / position.totalCost) * 100 : 0)}
                        </div>
                        <Badge variant={position.unrealizedGain >= 0 ? "default" : "destructive"} className="mt-1">
                          {position.unrealizedGain >= 0 ? "Ganho" : "Perda"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funds" className="space-y-4">
          <FundManager />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <TransactionManager />
        </TabsContent>

        <TabsContent value="rebalance" className="space-y-4">
          {!selectedBasketId ? (
            <Card>
              <CardHeader>
                <CardTitle>Configurar Cesta de Investimentos</CardTitle>
                <CardDescription>
                  Para usar o rebalanceamento automático, configure sua cesta preferida no perfil
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-8">
                <div className="mx-auto h-16 w-16 mb-4 bg-muted rounded-full flex items-center justify-center">
                  <PieChart className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">
                  Você ainda não selecionou uma cesta de investimentos no seu perfil.
                </p>
                <Button onClick={() => window.location.href = '/perfil'}>
                  Ir para Perfil
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Header with Basket Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">Rebalanceamento de Portfolio</CardTitle>
                      <CardDescription className="mt-1">
                        Baseado na cesta: <span className="font-semibold text-foreground">
                          {cestasQuery.data?.find(c => c.id === selectedBasketId)?.name || 'Carregando...'}
                        </span>
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => window.location.href = '/perfil'}>
                      Trocar Cesta
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Cash Inclusion Toggle */}
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="includeCash"
                        checked={includeCashInBase}
                        onChange={(e) => setIncludeCashInBase(e.target.checked)}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="includeCash" className="font-medium">
                        Incluir caixa na base de cálculo
                      </label>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 ml-7">
                      {includeCashInBase
                        ? 'Percentuais calculados sobre: Posições + Fundos + Caixa'
                        : 'Percentuais calculados sobre: Posições + Fundos (sem caixa)'
                      }
                    </p>
                    <div className="grid grid-cols-3 gap-4 mt-3 ml-7 text-sm">
                      <div className="p-2 bg-background rounded">
                        <div className="text-muted-foreground">Valor investido</div>
                        <div className="font-semibold">{formatCurrency(positionsValue + fundsValue)}</div>
                      </div>
                      <div className="p-2 bg-background rounded">
                        <div className="text-muted-foreground">Caixa disponível</div>
                        <div className="font-semibold">{formatCurrency(cashBalance)}</div>
                      </div>
                      <div className="p-2 bg-primary/10 rounded">
                        <div className="text-muted-foreground">Base de cálculo</div>
                        <div className="font-semibold text-primary">
                          {formatCurrency(includeCashInBase ? positionsValue + fundsValue + cashBalance : positionsValue + fundsValue)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>Recomendações de Transações</CardTitle>
                  <CardDescription>
                    Ajustes necessários para alinhar seu portfolio com a estratégia da cesta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingRebalance ? (
                    <div className="flex justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : rebalanceMutation.error ? (
                    <div className="text-center p-8">
                      <p className="text-red-600 mb-2">Erro ao calcular rebalanceamento</p>
                      <Button onClick={() => selectedBasketId && calculateRebalancePlan(selectedBasketId)}>
                        Tentar Novamente
                      </Button>
                    </div>
                  ) : rebalanceData ? (
                    <div className="space-y-4">
                      {/* Financial Summary */}
                      <div className="grid grid-cols-4 gap-3">
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">Valor do Portfolio</div>
                          <div className="text-lg font-bold">
                            {formatCurrency(rebalanceData.currentPortfolioValue || 0)}
                          </div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">Custo do Rebalanceamento</div>
                          <div className="text-lg font-bold text-primary">
                            {formatCurrency(rebalanceData.totalEstimatedCost)}
                          </div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">Caixa Atual</div>
                          <div className="text-lg font-bold">
                            {formatCurrency(rebalanceData.currentCashBalance || 0)}
                          </div>
                        </div>
                        <div className={`p-3 rounded-lg ${
                          rebalanceData.cashAfterRebalance >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'
                        }`}>
                          <div className="text-xs text-muted-foreground mb-1">Saldo Após</div>
                          <div className={`text-lg font-bold ${
                            rebalanceData.cashAfterRebalance >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(rebalanceData.cashAfterRebalance)}
                          </div>
                        </div>
                      </div>

                      {/* Transactions */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {rebalanceData.suggestions.map((suggestion: any, index: number) => (
                        <div key={index} className={`border rounded-lg overflow-hidden ${
                          suggestion.action === 'COMPRA' ? 'border-success/30 bg-success/5' : 'border-gray-200 bg-muted/30'
                        }`}>
                          {/* Header com ticker e badge */}
                          <div className="flex items-center justify-between p-2 border-b bg-card/50">
                            <div className="flex items-center space-x-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                suggestion.action === 'COMPRA' ? 'bg-success/20 text-success' : 'bg-gray-100 text-foreground'
                              }`}>
                                {suggestion.ativo.ticker.substring(0, 3)}
                              </div>
                              <div>
                                <div className="font-bold text-sm">{suggestion.ativo.ticker}</div>
                                <div className="text-[10px] text-muted-foreground">{suggestion.ativo.name}</div>
                              </div>
                            </div>
                            <Badge variant={suggestion.action === 'COMPRA' ? 'default' : 'secondary'} className="text-[10px] px-2 py-0.5">
                              {suggestion.action === 'COMPRA' ? 'COMPRAR' : 'VENDER'}
                            </Badge>
                          </div>

                          {/* Corpo do card com informações */}
                          <div className="p-2 space-y-2">
                            {/* Quantidade */}
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">{formatNumberByAssetClass(Math.abs(suggestion.shareDifference), suggestion.ativo.type)} ações</span>
                              <span className="font-bold text-base">
                                {formatCurrency(suggestion.estimatedCost)}
                              </span>
                            </div>

                            {/* Alocação atual vs target */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-muted-foreground">Atual: {suggestion.currentPercent?.toFixed(1)}%</span>
                                <span className="text-gray-400">→</span>
                                <span className="font-medium text-primary">Target: {suggestion.targetPercentage?.toFixed(1)}%</span>
                              </div>

                              {/* Barra de progresso com escala baseada no target */}
                              <div className="relative">
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                  {(() => {
                                    const current = suggestion.currentPercent || 0;
                                    const target = suggestion.targetPercentage || 0;
                                    const percentOfTarget = target > 0 ? (current / target) * 100 : 0;

                                    return (
                                      <>
                                        {/* Barra de progresso atual */}
                                        <div
                                          className={`h-2 rounded-full transition-all ${
                                            percentOfTarget < 100
                                              ? 'bg-warning'
                                              : percentOfTarget === 100
                                              ? 'bg-success'
                                              : 'bg-primary'
                                          }`}
                                          style={{ width: `${Math.min(percentOfTarget, 100)}%` }}
                                        />

                                        {/* Indicador de over-allocation se > 100% */}
                                        {percentOfTarget > 100 && (
                                          <div
                                            className="absolute top-0 left-0 h-2 bg-destructive/30 rounded-full"
                                            style={{ width: '100%' }}
                                          />
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>

                                {/* Texto indicativo do progresso */}
                                <div className="flex items-center justify-between mt-0.5">
                                  <span className="text-[9px] text-gray-500">0%</span>
                                  <span className="text-[9px] font-medium text-primary">
                                    {(() => {
                                      const current = suggestion.currentPercent || 0;
                                      const target = suggestion.targetPercentage || 0;
                                      const percentOfTarget = target > 0 ? (current / target) * 100 : 0;
                                      return `${percentOfTarget.toFixed(0)}% do target`;
                                    })()}
                                  </span>
                                  <span className="text-[9px] text-primary">100%</span>
                                </div>
                              </div>
                            </div>

                            {/* Shares atuais */}
                            <div className="text-[10px] text-gray-500 pt-1 border-t">
                              Shares atuais: {formatNumberByAssetClass(suggestion.currentShares || 0, suggestion.ativo.type)}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {rebalanceData.suggestions.length === 0 && (
                        <div className="text-center p-12 text-muted-foreground">
                          <div className="mx-auto h-16 w-16 mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                            <TrendingUp className="h-8 w-8 text-green-600" />
                          </div>
                          <p className="text-lg font-semibold text-foreground mb-2">Portfolio já está balanceado!</p>
                          <p className="text-sm">Nenhuma transação necessária no momento</p>
                        </div>
                      )}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Melhores Ativos</CardTitle>
                <CardDescription>Top performers em ações</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {portfolioData.positions
                    .filter(pos => pos.unrealizedGain > 0)
                    .sort((a, b) => b.unrealizedGain - a.unrealizedGain)
                    .slice(0, 5)
                    .map((position) => (
                      <div key={position.ativo.id} className="flex items-center justify-between p-2 bg-success/10 rounded-lg">
                        <span className="font-medium">{position.ativo.ticker}</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(position.unrealizedGain)}
                        </span>
                      </div>
                    ))}
                  {portfolioData.positions.filter(pos => pos.unrealizedGain > 0).length === 0 && (
                    <p className="text-center text-muted-foreground">Nenhum ativo com ganho</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Piores Ativos</CardTitle>
                <CardDescription>Ações que precisam atenção</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {portfolioData.positions
                    .filter(pos => pos.unrealizedGain < 0)
                    .sort((a, b) => a.unrealizedGain - b.unrealizedGain)
                    .slice(0, 5)
                    .map((position) => (
                      <div key={position.ativo.id} className="flex items-center justify-between p-2 bg-destructive/10 rounded-lg">
                        <span className="font-medium">{position.ativo.ticker}</span>
                        <span className="font-bold text-red-600">
                          {formatCurrency(position.unrealizedGain)}
                        </span>
                      </div>
                    ))}
                  {portfolioData.positions.filter(pos => pos.unrealizedGain < 0).length === 0 && (
                    <p className="text-center text-muted-foreground">Nenhum ativo com perda</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Melhores Fundos</CardTitle>
                <CardDescription>Fundos com maior rentabilidade</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {fundListQuery.data
                    ?.filter(fund => fund.ganhoPerda > 0)
                    .sort((a, b) => b.ganhoPerda - a.ganhoPerda)
                    .slice(0, 5)
                    .map((fund) => (
                      <div key={fund.id} className="flex items-center justify-between p-2 bg-success/10 rounded-lg">
                        <span className="font-medium text-xs">{fund.name.substring(0, 12)}...</span>
                        <span className="font-bold text-green-600 text-xs">
                          {formatCurrency(fund.ganhoPerda)}
                        </span>
                      </div>
                    )) || []}
                  {(!fundListQuery.data || fundListQuery.data.filter(fund => fund.ganhoPerda > 0).length === 0) && (
                    <p className="text-center text-muted-foreground text-xs">Nenhum fundo com ganho</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Piores Fundos</CardTitle>
                <CardDescription>Fundos que precisam atenção</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {fundListQuery.data
                    ?.filter(fund => fund.ganhoPerda < 0)
                    .sort((a, b) => a.ganhoPerda - b.ganhoPerda)
                    .slice(0, 5)
                    .map((fund) => (
                      <div key={fund.id} className="flex items-center justify-between p-2 bg-destructive/10 rounded-lg">
                        <span className="font-medium text-xs">{fund.name.substring(0, 12)}...</span>
                        <span className="font-bold text-red-600 text-xs">
                          {formatCurrency(fund.ganhoPerda)}
                        </span>
                      </div>
                    )) || []}
                  {(!fundListQuery.data || fundListQuery.data.filter(fund => fund.ganhoPerda < 0).length === 0) && (
                    <p className="text-center text-muted-foreground text-xs">Nenhum fundo com perda</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}