"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "~/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign
} from "lucide-react";
import { TransactionType } from "@prisma/client";
import { formatNumberByAssetClass } from "~/lib/utils";

const transactionSchema = z.object({
  ativoId: z.string().min(1, "Selecione um ativo"),
  type: z.nativeEnum(TransactionType),
  shares: z.number().positive("Quantidade deve ser positiva").min(0.00000001, "Quantidade deve ser maior que zero"),
  pricePerShare: z.number().positive("Preço deve ser positivo"),
  date: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

export function TransactionManager() {
  const [selectedTab, setSelectedTab] = useState("add");
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showUpdateCashModal, setShowUpdateCashModal] = useState(false);
  const [newCashBalance, setNewCashBalance] = useState<string>("");
  const [historyFilterAsset, setHistoryFilterAsset] = useState<string>("");

  // API queries
  const portfolioQuery = api.portfolio.get.useQuery();
  const assetsQuery = api.asset.list.useQuery();
  const transactionsQuery = api.portfolio.listTransactions.useQuery({
    limit: 50,
    offset: 0,
    ativoId: historyFilterAsset || undefined,
  });

  // Form setup
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: TransactionType.COMPRA,
    },
  });

  const watchedShares = watch("shares", 0);
  const watchedPrice = watch("pricePerShare", 0);
  const watchedType = watch("type");

  // Transaction mutation
  const addTransactionMutation = api.portfolio.addTransaction.useMutation({
    onSuccess: () => {
      reset();
      setSelectedAsset("");
      // Refetch portfolio and transactions data
      portfolioQuery.refetch();
      transactionsQuery.refetch();
    },
  });

  // Cash balance update mutation
  const updateCashMutation = api.portfolio.updateCashBalance.useMutation({
    onSuccess: () => {
      setShowUpdateCashModal(false);
      setNewCashBalance("");
      // Refetch portfolio data
      portfolioQuery.refetch();
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const onSubmit = (data: TransactionFormData) => {
    addTransactionMutation.mutate({
      ativoId: data.ativoId,
      type: data.type,
      shares: data.shares,
      pricePerShare: data.pricePerShare,
      date: data.date || undefined,
    });
  };

  const handleUpdateCashBalance = () => {
    const balance = parseFloat(newCashBalance);
    if (isNaN(balance) || balance < 0) return;
    
    updateCashMutation.mutate({
      cashBalance: balance,
    });
  };

  // Filter assets based on search term
  const filteredAssets = assetsQuery.data?.filter(asset =>
    asset.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const selectedAssetData = assetsQuery.data?.find(asset => asset.id === selectedAsset);
  const totalValue = watchedShares * watchedPrice;
  const currentCashBalance = Number(portfolioQuery.data?.cashBalance || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gerenciamento de Transações</h2>
          <p className="text-muted-foreground">
            Adicione transações e acompanhe o histórico completo
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filtrar
          </Button>
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Período
          </Button>
        </div>
      </div>

      {/* Cash Balance Alert */}
      <Card className="border-primary/30 bg-primary/10">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <DollarSign className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold text-primary">Saldo Disponível</h3>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(currentCashBalance)}
                </p>
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={() => {
                setNewCashBalance(currentCashBalance.toString());
                setShowUpdateCashModal(true);
              }}
              className="text-primary border-primary/40 hover:bg-primary/20"
            >
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="add">Nova Transação</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="analysis">Análise</TabsTrigger>
        </TabsList>

        <TabsContent value="add" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Asset Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Selecionar Ativo</CardTitle>
                <CardDescription>
                  Escolha o ativo para a transação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar por ticker ou nome..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {assetsQuery.isLoading ? (
                      <div className="flex justify-center p-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      filteredAssets.map((asset) => (
                        <div
                          key={asset.id}
                          className={`p-3 border rounded-lg cursor-pointer hover:bg-muted ${
                            selectedAsset === asset.id ? 'border-primary bg-primary/5' : ''
                          }`}
                          onClick={() => {
                            setSelectedAsset(asset.id);
                            setValue("ativoId", asset.id);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{asset.ticker}</div>
                              <div className="text-sm text-muted-foreground">{asset.name}</div>
                            </div>
                            <Badge variant="outline">{asset.type}</Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transaction Form */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhes da Transação</CardTitle>
                <CardDescription>
                  {selectedAssetData ? `Transação para ${selectedAssetData.ticker}` : 'Selecione um ativo primeiro'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Transaction Type */}
                  <div className="space-y-2">
                    <Label>Tipo de Transação</Label>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant={watchedType === TransactionType.COMPRA ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setValue("type", TransactionType.COMPRA)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Comprar
                      </Button>
                      <Button
                        type="button"
                        variant={watchedType === TransactionType.VENDA ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setValue("type", TransactionType.VENDA)}
                      >
                        <TrendingDown className="mr-2 h-4 w-4" />
                        Vender
                      </Button>
                    </div>
                  </div>

                  {/* Shares */}
                  <div className="space-y-2">
                    <Label htmlFor="shares">Quantidade de Ações</Label>
                    <Input
                      id="shares"
                      type="number"
                      step="any"
                      min="0.00000001"
                      placeholder="Ex: 100 ou 0.00249076"
                      {...register("shares", { valueAsNumber: true })}
                    />
                    {errors.shares && (
                      <p className="text-red-600 text-sm">{errors.shares.message}</p>
                    )}
                  </div>

                  {/* Price per Share */}
                  <div className="space-y-2">
                    <Label htmlFor="pricePerShare">Preço por Ação (R$)</Label>
                    <Input
                      id="pricePerShare"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Ex: 25.50"
                      {...register("pricePerShare", { valueAsNumber: true })}
                    />
                    {errors.pricePerShare && (
                      <p className="text-red-600 text-sm">{errors.pricePerShare.message}</p>
                    )}
                  </div>

                  {/* Date (optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="date">Data da Transação (opcional)</Label>
                    <Input
                      id="date"
                      type="datetime-local"
                      {...register("date")}
                    />
                  </div>

                  {/* Transaction Summary */}
                  {selectedAsset && watchedShares > 0 && watchedPrice > 0 && (
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <h4 className="font-medium">Resumo da Transação</h4>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Ativo:</span>
                          <span className="font-medium">{selectedAssetData?.ticker}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tipo:</span>
                          <Badge variant={watchedType === TransactionType.COMPRA ? "default" : "secondary"}>
                            {watchedType}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Quantidade:</span>
                          <span>{formatNumberByAssetClass(watchedShares, selectedAssetData?.type)} ações</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Preço unitário:</span>
                          <span>{formatCurrency(watchedPrice)}</span>
                        </div>
                        <div className="flex justify-between font-semibold border-t pt-2">
                          <span>Valor Total:</span>
                          <span className={watchedType === TransactionType.COMPRA ? 'text-red-600' : 'text-green-600'}>
                            {watchedType === TransactionType.COMPRA ? '-' : '+'}{formatCurrency(totalValue)}
                          </span>
                        </div>
                        {watchedType === TransactionType.COMPRA && totalValue > currentCashBalance && (
                          <p className="text-red-600 text-sm mt-2">
                            ⚠️ Saldo insuficiente para esta transação
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      !selectedAsset ||
                      addTransactionMutation.isPending ||
                      (watchedType === TransactionType.COMPRA && totalValue > currentCashBalance)
                    }
                  >
                    {addTransactionMutation.isPending ? 'Processando...' : 'Confirmar Transação'}
                  </Button>

                  {addTransactionMutation.error && (
                    <p className="text-red-600 text-sm text-center">
                      {addTransactionMutation.error.message}
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Transações</CardTitle>
              <CardDescription>
                Todas as suas transações realizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filter by Asset */}
              <div className="mb-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <Label htmlFor="assetFilter">Filtrar por Ativo</Label>
                    <select
                      id="assetFilter"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                      value={historyFilterAsset}
                      onChange={(e) => setHistoryFilterAsset(e.target.value)}
                    >
                      <option value="">Todos os ativos</option>
                      {assetsQuery.data?.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.ticker} - {asset.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {historyFilterAsset && (
                    <Button
                      variant="outline"
                      onClick={() => setHistoryFilterAsset("")}
                      className="mt-6"
                    >
                      Limpar Filtro
                    </Button>
                  )}
                </div>
              </div>
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
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${
                          transaction.type === "COMPRA" ? 'bg-success/100' : 'bg-destructive/100'
                        }`} />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{transaction.ativo.ticker}</span>
                            <Badge variant={transaction.type === "COMPRA" ? "default" : "secondary"}>
                              {transaction.type}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatNumberByAssetClass(Number(transaction.shares), transaction.ativo.type)} ações @ {formatCurrency(Number(transaction.pricePerShare))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${
                          transaction.type === "COMPRA" ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {transaction.type === "COMPRA" ? '-' : '+'}
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

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Resumo de Transações</CardTitle>
                <CardDescription>Estatísticas do período</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    const transactions = transactionsQuery.data || [];
                    const compras = transactions.filter(t => t.type === "COMPRA");
                    const vendas = transactions.filter(t => t.type === "VENDA");
                    
                    const volumeCompras = compras.reduce((sum, t) => sum + (Number(t.shares) * Number(t.pricePerShare)), 0);
                    const volumeVendas = vendas.reduce((sum, t) => sum + (Number(t.shares) * Number(t.pricePerShare)), 0);
                    const volumeTotal = volumeCompras + volumeVendas;
                    
                    return (
                      <>
                        <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            <span className="font-medium">Total Compras</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">{compras.length}</div>
                            <div className="text-sm text-green-600">{formatCurrency(volumeCompras)}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <TrendingDown className="h-5 w-5 text-red-600" />
                            <span className="font-medium">Total Vendas</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-red-600">{vendas.length}</div>
                            <div className="text-sm text-red-600">{formatCurrency(volumeVendas)}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-5 w-5 text-primary" />
                            <span className="font-medium">Volume Total</span>
                          </div>
                          <span className="font-bold text-primary">
                            {formatCurrency(volumeTotal)}
                          </span>
                        </div>
                      </>
                    );
                  })()} 
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ativos Mais Transacionados</CardTitle>
                <CardDescription>Top 5 ativos por volume</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(() => {
                    const transactions = transactionsQuery.data || [];
                    if (transactions.length === 0) {
                      return (
                        <div className="text-center text-muted-foreground p-4">
                          Nenhuma transação encontrada
                        </div>
                      );
                    }
                    
                    // Group by asset and calculate volume
                    const assetStats = transactions.reduce((acc, t) => {
                      const key = t.ativo.ticker;
                      const volume = Number(t.shares) * Number(t.pricePerShare);
                      
                      if (!acc[key]) {
                        acc[key] = {
                          ticker: t.ativo.ticker,
                          name: t.ativo.name,
                          volume: 0,
                          transactions: 0,
                          compras: 0,
                          vendas: 0
                        };
                      }
                      
                      acc[key].volume += volume;
                      acc[key].transactions += 1;
                      
                      if (t.type === "COMPRA") {
                        acc[key].compras += 1;
                      } else {
                        acc[key].vendas += 1;
                      }
                      
                      return acc;
                    }, {} as Record<string, any>);
                    
                    // Sort by volume and take top 5
                    const topAssets = Object.values(assetStats)
                      .sort((a: any, b: any) => b.volume - a.volume)
                      .slice(0, 5);
                    
                    return topAssets.map((asset: any, index) => (
                      <div key={asset.ticker} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                            #{index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{asset.ticker}</div>
                            <div className="text-sm text-muted-foreground">
                              {asset.transactions} transação{asset.transactions !== 1 ? 'ões' : ''}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatCurrency(asset.volume)}</div>
                          <div className="text-sm text-muted-foreground">
                            {asset.compras}C / {asset.vendas}V
                          </div>
                        </div>
                      </div>
                    ));
                  })()} 
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Additional Analysis Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Análise Temporal</CardTitle>
                <CardDescription>Transações por período</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const transactions = transactionsQuery.data || [];
                  const now = new Date();
                  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                  
                  const recent7 = transactions.filter(t => new Date(t.date) >= last7Days).length;
                  const recent30 = transactions.filter(t => new Date(t.date) >= last30Days).length;
                  
                  return (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Últimos 7 dias:</span>
                        <span className="font-medium">{recent7} transações</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Últimos 30 dias:</span>
                        <span className="font-medium">{recent30} transações</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Total histórico:</span>
                        <span className="font-medium">{transactions.length} transações</span>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Ticket Médio</CardTitle>
                <CardDescription>Valor médio das operações</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const transactions = transactionsQuery.data || [];
                  if (transactions.length === 0) {
                    return <div className="text-muted-foreground">Sem dados</div>;
                  }
                  
                  const compras = transactions.filter(t => t.type === "COMPRA");
                  const vendas = transactions.filter(t => t.type === "VENDA");
                  
                  const ticketMedioCompras = compras.length > 0 
                    ? compras.reduce((sum, t) => sum + (Number(t.shares) * Number(t.pricePerShare)), 0) / compras.length
                    : 0;
                    
                  const ticketMedioVendas = vendas.length > 0
                    ? vendas.reduce((sum, t) => sum + (Number(t.shares) * Number(t.pricePerShare)), 0) / vendas.length
                    : 0;
                  
                  return (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-green-600">Compras:</span>
                        <span className="font-medium text-green-600">{formatCurrency(ticketMedioCompras)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-red-600">Vendas:</span>
                        <span className="font-medium text-red-600">{formatCurrency(ticketMedioVendas)}</span>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Diversificação</CardTitle>
                <CardDescription>Número de ativos únicos</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const transactions = transactionsQuery.data || [];
                  const uniqueAssets = new Set(transactions.map(t => t.ativo.ticker)).size;
                  const compraAssets = new Set(transactions.filter(t => t.type === "COMPRA").map(t => t.ativo.ticker)).size;
                  const vendaAssets = new Set(transactions.filter(t => t.type === "VENDA").map(t => t.ativo.ticker)).size;
                  
                  return (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Ativos únicos:</span>
                        <span className="font-medium">{uniqueAssets}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-green-600">Comprados:</span>
                        <span className="font-medium text-green-600">{compraAssets}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-red-600">Vendidos:</span>
                        <span className="font-medium text-red-600">{vendaAssets}</span>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Update Cash Balance Modal */}
      {showUpdateCashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Atualizar Saldo Disponível</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="newCashBalance">Novo Saldo (R$)</Label>
                <Input
                  id="newCashBalance"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={newCashBalance}
                  onChange={(e) => setNewCashBalance(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Saldo Atual:</span>
                  <span className="font-medium">{formatCurrency(currentCashBalance)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Novo Saldo:</span>
                  <span className="font-medium">
                    {newCashBalance ? formatCurrency(parseFloat(newCashBalance) || 0) : formatCurrency(0)}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowUpdateCashModal(false);
                    setNewCashBalance("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleUpdateCashBalance}
                  disabled={
                    updateCashMutation.isPending ||
                    !newCashBalance ||
                    isNaN(parseFloat(newCashBalance)) ||
                    parseFloat(newCashBalance) < 0
                  }
                >
                  {updateCashMutation.isPending ? 'Atualizando...' : 'Confirmar'}
                </Button>
              </div>

              {updateCashMutation.error && (
                <p className="text-red-600 text-sm text-center">
                  {updateCashMutation.error.message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}