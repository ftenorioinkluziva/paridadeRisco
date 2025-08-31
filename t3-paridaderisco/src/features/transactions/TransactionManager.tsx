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

const transactionSchema = z.object({
  ativoId: z.string().min(1, "Selecione um ativo"),
  type: z.nativeEnum(TransactionType),
  shares: z.number().positive("Quantidade deve ser positiva"),
  pricePerShare: z.number().positive("Preço deve ser positivo"),
  date: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

export function TransactionManager() {
  const [selectedTab, setSelectedTab] = useState("add");
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // API queries
  const portfolioQuery = api.portfolio.get.useQuery();
  const assetsQuery = api.asset.list.useQuery();
  const transactionsQuery = api.portfolio.listTransactions.useQuery({
    limit: 50,
    offset: 0,
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
      date: data.date ? new Date(data.date) : undefined,
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
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <DollarSign className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">Saldo Disponível</h3>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(currentCashBalance)}
              </p>
            </div>
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
                          className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
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
                      step="1"
                      min="1"
                      placeholder="Ex: 100"
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
                    <div className="p-4 bg-gray-50 rounded-lg space-y-2">
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
                          <span>{watchedShares} ações</span>
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
                          transaction.type === "COMPRA" ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{transaction.ativo.ticker}</span>
                            <Badge variant={transaction.type === "COMPRA" ? "default" : "secondary"}>
                              {transaction.type}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {Number(transaction.shares)} ações @ {formatCurrency(Number(transaction.pricePerShare))}
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
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Total Compras</span>
                    </div>
                    <span className="font-bold text-green-600">
                      {transactionsQuery.data?.filter(t => t.type === "COMPRA").length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                      <span className="font-medium">Total Vendas</span>
                    </div>
                    <span className="font-bold text-red-600">
                      {transactionsQuery.data?.filter(t => t.type === "VENDA").length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Volume Total</span>
                    </div>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(
                        transactionsQuery.data?.reduce(
                          (sum, t) => sum + (Number(t.shares) * Number(t.pricePerShare)),
                          0
                        ) || 0
                      )}
                    </span>
                  </div>
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
                  {/* This would be calculated from transaction data */}
                  <div className="text-center text-muted-foreground p-4">
                    Dados de análise serão exibidos aqui após mais transações
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}