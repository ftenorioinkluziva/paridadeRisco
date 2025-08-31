"use client";

import { useState } from "react";
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
  Minus
} from "lucide-react";

export function PortfolioManager() {
  const [selectedTab, setSelectedTab] = useState("overview");
  
  const portfolioQuery = api.portfolio.get.useQuery();
  const transactionsQuery = api.portfolio.listTransactions.useQuery({
    limit: 10,
    offset: 0,
  });
  
  const [selectedBasketId, setSelectedBasketId] = useState<string | null>(null);
  const [rebalanceData, setRebalanceData] = useState<any>(null);
  const [isLoadingRebalance, setIsLoadingRebalance] = useState(false);
  
  const rebalanceMutation = api.portfolio.getRebalancePlan.useMutation({
    onSuccess: (data) => {
      setRebalanceData(data);
      setIsLoadingRebalance(false);
    },
    onError: () => {
      setIsLoadingRebalance(false);
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
    });
  };
  
  const cestasQuery = api.cesta.list.useQuery();

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

  const totalValue = Number(portfolioData.totalValue);
  const cashBalance = Number(portfolioData.cashBalance);
  const positionsValue = portfolioData.positions.reduce((sum, pos) => sum + pos.currentValue, 0);
  const totalCost = portfolioData.positions.reduce((sum, pos) => sum + pos.totalCost, 0);
  const totalGain = positionsValue - totalCost;

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
              Portfolio + Caixa
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
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="rebalance">Rebalanceamento</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
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
                  {portfolioData.positions.map((position) => {
                    const allocation = positionsValue > 0 ? (position.currentValue / positionsValue) * 100 : 0;
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
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Custo Total Investido</span>
                    <span className="font-bold">{formatCurrency(totalCost)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Valor Atual das Posições</span>
                    <span className="font-bold">{formatCurrency(positionsValue)}</span>
                  </div>
                  <div className={`flex items-center justify-between p-3 rounded-lg ${
                    totalGain >= 0 ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <span className="font-medium">Ganho/Perda Total</span>
                    <span className={`font-bold ${
                      totalGain >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(totalGain)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
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
                            <span>Shares: {position.shares}</span>
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

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Transações</CardTitle>
              <CardDescription>
                Últimas transações realizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactionsQuery.isLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : transactionsQuery.error ? (
                <div className="text-center p-8">
                  <p className="text-red-600 mb-2">Erro ao carregar transações</p>
                  <Button onClick={() => transactionsQuery.refetch()}>
                    Tentar Novamente
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactionsQuery.data?.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Badge variant={transaction.type === "COMPRA" ? "default" : "secondary"}>
                          {transaction.type}
                        </Badge>
                        <div>
                          <div className="font-medium">{transaction.ativo.ticker}</div>
                          <div className="text-sm text-muted-foreground">
                            {Number(transaction.shares)} ações @ {formatCurrency(Number(transaction.pricePerShare))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatCurrency(Number(transaction.shares) * Number(transaction.pricePerShare))}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(transaction.date)}
                        </div>
                      </div>
                    </div>
                  )) ?? <div className="text-center p-8 text-muted-foreground">Nenhuma transação encontrada</div>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rebalance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Selecionar Cesta</CardTitle>
                <CardDescription>
                  Escolha uma cesta para ver as recomendações de rebalanceamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cestasQuery.isLoading ? (
                  <div className="flex justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : cestasQuery.error ? (
                  <p className="text-red-600 text-center">Erro ao carregar cestas</p>
                ) : (
                  <div className="space-y-2">
                    {cestasQuery.data?.map((cesta) => (
                      <div 
                        key={cesta.id}
                        className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                          selectedBasketId === cesta.id ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => {
                          setSelectedBasketId(cesta.id);
                          calculateRebalancePlan(cesta.id);
                        }}
                      >
                        <div className="font-medium">{cesta.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {cesta.ativos?.length || 0} ativos
                        </div>
                      </div>
                    )) ?? <p className="text-center text-muted-foreground">Nenhuma cesta encontrada</p>}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recomendações</CardTitle>
                <CardDescription>
                  {selectedBasketId ? 'Sugestões para rebalancear seu portfolio' : 'Selecione uma cesta para ver as recomendações'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedBasketId ? (
                  <div className="text-center p-8 text-muted-foreground">
                    <ArrowUpDown className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Selecione uma cesta ao lado para ver as recomendações de rebalanceamento</p>
                  </div>
                ) : isLoadingRebalance ? (
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
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Custo Estimado</span>
                        <span className="font-bold text-blue-600">
                          {formatCurrency(rebalanceData.totalEstimatedCost)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm text-muted-foreground">Saldo após rebalanceamento</span>
                        <span className={`text-sm font-medium ${
                          rebalanceData.cashAfterRebalance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(rebalanceData.cashAfterRebalance)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold">Transações Recomendadas:</h4>
                      {rebalanceData.suggestions.map((suggestion: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Badge variant={suggestion.action === 'BUY' ? 'default' : 'secondary'}>
                              {suggestion.action === 'BUY' ? 'COMPRAR' : 'VENDER'}
                            </Badge>
                            <div>
                              <div className="font-medium">{suggestion.ticker}</div>
                              <div className="text-sm text-muted-foreground">
                                {suggestion.shares} ações
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              {formatCurrency(suggestion.estimatedCost)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Target: {suggestion.targetAllocation.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {rebalanceData.suggestions.length === 0 && (
                        <div className="text-center p-8 text-muted-foreground">
                          <div className="mx-auto h-12 w-12 mb-4 bg-green-100 rounded-full flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                          </div>
                          <p>Portfolio já está balanceado!</p>
                          <p className="text-sm">Nenhuma transação necessária</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Melhores Performers</CardTitle>
                <CardDescription>Ativos com melhor performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {portfolioData.positions
                    .filter(pos => pos.unrealizedGain > 0)
                    .sort((a, b) => b.unrealizedGain - a.unrealizedGain)
                    .slice(0, 5)
                    .map((position) => (
                      <div key={position.ativo.id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
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
                <CardTitle>Piores Performers</CardTitle>
                <CardDescription>Ativos que precisam de atenção</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {portfolioData.positions
                    .filter(pos => pos.unrealizedGain < 0)
                    .sort((a, b) => a.unrealizedGain - b.unrealizedGain)
                    .slice(0, 5)
                    .map((position) => (
                      <div key={position.ativo.id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}