"use client";

import { useState, useMemo } from "react";
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
import { AllocationProgressBar } from "./components/AllocationProgressBar";
import { BasketPerformanceDetail } from "./components/BasketPerformanceDetail";
import {
  PieChart,
  Plus,
  Edit,
  Trash2,
  Target,
  TrendingUp,
  BarChart3,
  Search,
  Check,
  Percent,
  ChevronRight
} from "lucide-react";

const basketSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
});

const basketAllocationSchema = z.object({
  ativoId: z.string().min(1, "Selecione um ativo"),
  targetPercentage: z.number().min(0.1).max(100, "Alocação deve estar entre 0.1% e 100%"),
});

type BasketFormData = z.infer<typeof basketSchema>;
type AllocationFormData = z.infer<typeof basketAllocationSchema>;

export function CestaViewer() {
  const [selectedTab, setSelectedTab] = useState("view");
  const [selectedBasket, setSelectedBasket] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssetForAllocation, setSelectedAssetForAllocation] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'1M' | '3M' | '6M' | '1Y' | 'YTD' | 'ALL'>('3M');
  const [selectedBasketForAnalysis, setSelectedBasketForAnalysis] = useState<string | null>(null);

  // API queries
  const cestasQuery = api.cesta.list.useQuery();
  const assetsQuery = api.asset.list.useQuery();
  
  const selectedBasketQuery = api.cesta.getById.useQuery(
    { id: selectedBasket! },
    { enabled: !!selectedBasket }
  );

  // Form setup for basket creation
  const basketForm = useForm<BasketFormData>({
    resolver: zodResolver(basketSchema),
  });

  const allocationForm = useForm<AllocationFormData>({
    resolver: zodResolver(basketAllocationSchema),
  });

  // Mutations
  const createBasketMutation = api.cesta.create.useMutation({
    onSuccess: (data) => {
      basketForm.reset();
      setIsCreating(false);
      setSelectedBasket(data.id);
      cestasQuery.refetch();
    },
  });

  const addAssetMutation = api.cesta.addAsset.useMutation({
    onSuccess: () => {
      allocationForm.reset();
      setSelectedAssetForAllocation(null);
      cestasQuery.refetch();
      selectedBasketQuery.refetch();
    },
  });

  const removeAssetMutation = api.cesta.removeAsset.useMutation({
    onSuccess: () => {
      cestasQuery.refetch();
      selectedBasketQuery.refetch();
    },
  });

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const onSubmitBasket = (data: BasketFormData) => {
    createBasketMutation.mutate({
      name: data.name,
    });
  };

  const onAddAsset = (data: AllocationFormData) => {
    if (!selectedBasket) return;

    addAssetMutation.mutate({
      cestaId: selectedBasket,
      ativoId: data.ativoId,
      targetPercentage: data.targetPercentage,
    });
  };

  // Calculate total allocation
  const totalAllocated = useMemo(() => {
    if (!selectedBasketQuery.data?.ativos) return 0;
    return selectedBasketQuery.data.ativos.reduce(
      (sum, allocation) => sum + Number(allocation.targetPercentage),
      0
    );
  }, [selectedBasketQuery.data]);

  // Get already allocated asset IDs
  const allocatedAssetIds = useMemo(() => {
    if (!selectedBasketQuery.data?.ativos) return new Set<string>();
    return new Set(selectedBasketQuery.data.ativos.map(a => a.ativo.id));
  }, [selectedBasketQuery.data]);

  // Filter assets for allocation (exclude already allocated)
  const filteredAssets = useMemo(() => {
    const assets = assetsQuery.data?.filter(asset =>
      (asset.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
      !allocatedAssetIds.has(asset.id)
    ) || [];
    return assets;
  }, [assetsQuery.data, searchTerm, allocatedAssetIds]);

  // Get selected asset details
  const selectedAssetDetails = useMemo(() => {
    if (!selectedAssetForAllocation) return null;
    return assetsQuery.data?.find(a => a.id === selectedAssetForAllocation);
  }, [selectedAssetForAllocation, assetsQuery.data]);


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gerenciamento de Cestas</h2>
          <p className="text-muted-foreground">
            Crie e gerencie suas cestas de alocação de ativos
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Cesta
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="view">Visualizar Cestas</TabsTrigger>
          <TabsTrigger value="allocations">Alocações</TabsTrigger>
          <TabsTrigger value="analysis">Análise</TabsTrigger>
        </TabsList>

        <TabsContent value="view" className="space-y-4">
          {isCreating && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle>Criar Nova Cesta</CardTitle>
                <CardDescription>
                  Defina o nome e descrição da sua nova cesta de investimentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={basketForm.handleSubmit(onSubmitBasket)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Cesta</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Cesta Conservadora"
                      {...basketForm.register("name")}
                    />
                    {basketForm.formState.errors.name && (
                      <p className="text-red-600 text-sm">{basketForm.formState.errors.name.message}</p>
                    )}
                  </div>


                  <div className="flex space-x-2">
                    <Button type="submit" disabled={createBasketMutation.isPending}>
                      {createBasketMutation.isPending ? 'Criando...' : 'Criar Cesta'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreating(false);
                        basketForm.reset();
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>

                  {createBasketMutation.error && (
                    <p className="text-red-600 text-sm">{createBasketMutation.error.message}</p>
                  )}
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cestasQuery.isLoading ? (
              <div className="col-span-full flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : cestasQuery.error ? (
              <div className="col-span-full text-center p-8">
                <p className="text-red-600 mb-2">Erro ao carregar cestas</p>
                <Button onClick={() => cestasQuery.refetch()}>
                  Tentar Novamente
                </Button>
              </div>
            ) : cestasQuery.data?.length === 0 ? (
              <div className="col-span-full text-center p-8">
                <PieChart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">Nenhuma cesta criada ainda</p>
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeira Cesta
                </Button>
              </div>
            ) : (
              cestasQuery.data?.map((cesta) => (
                <Card 
                  key={cesta.id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${
                    selectedBasket === cesta.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedBasket(cesta.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{cesta.name}</CardTitle>
                        <CardDescription>
                          {cesta.ativos?.length || 0} ativos configurados
                        </CardDescription>
                      </div>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {cesta.ativos && cesta.ativos.length > 0 ? (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Alocação Target:</h4>
                          {cesta.ativos.slice(0, 3).map((allocation, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span>{allocation.ativo.ticker}</span>
                              <span className="font-medium">
                                {formatPercent(Number(allocation.targetPercentage))}
                              </span>
                            </div>
                          ))}
                          {cesta.ativos.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{cesta.ativos.length - 3} mais ativos
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-4">
                          <Target className="mx-auto h-8 w-8 mb-2" />
                          <p className="text-sm">Nenhuma alocação definida</p>
                        </div>
                      )}

                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span>Total Alocado:</span>
                          <span className="font-bold">
                            {cesta.ativos?.reduce((sum, a) => sum + Number(a.targetPercentage), 0).toFixed(1) || 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Selected Basket Details */}
          {selectedBasket && selectedBasketQuery.data && (
            <Card>
              <CardHeader>
                <CardTitle>Detalhes da Cesta: {selectedBasketQuery.data.name}</CardTitle>
                <CardDescription>
                  Configuração completa da cesta selecionada
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedBasketQuery.data.ativos && selectedBasketQuery.data.ativos.length > 0 ? (
                    <div className="space-y-3">
                      {selectedBasketQuery.data.ativos.map((allocation, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="font-semibold text-primary text-sm">
                                {allocation.ativo.ticker.substring(0, 2)}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">{allocation.ativo.ticker}</div>
                              <div className="text-sm text-muted-foreground">{allocation.ativo.name}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-lg">
                              {formatPercent(Number(allocation.targetPercentage))}
                            </div>
                            <Badge variant="outline">{allocation.ativo.type}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-8 text-muted-foreground">
                      <Target className="mx-auto h-12 w-12 mb-4" />
                      <p>Esta cesta ainda não possui alocações definidas</p>
                      <Button className="mt-4" onClick={() => setSelectedTab("allocations")}>
                        <Plus className="mr-2 h-4 w-4" />
                        Definir Alocações
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="allocations" className="space-y-4">
          {!selectedBasket ? (
            <Card>
              <CardContent className="p-12">
                <div className="text-center text-muted-foreground">
                  <PieChart className="mx-auto h-16 w-16 mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Nenhuma Cesta Selecionada</h3>
                  <p className="mb-4">Selecione uma cesta na aba "Visualizar Cestas" para gerenciar suas alocações</p>
                  <Button onClick={() => setSelectedTab("view")}>
                    Ir para Cestas
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Progress Bar */}
              <AllocationProgressBar
                totalAllocated={totalAllocated}
                assetCount={selectedBasketQuery.data?.ativos?.length || 0}
              />

              <div className="grid gap-4 lg:grid-cols-3">
                {/* Ativos Alocados - Sidebar */}
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Ativos Alocados</CardTitle>
                      <CardDescription>
                        {selectedBasketQuery.data?.ativos?.length || 0} de {assetsQuery.data?.length || 0} disponíveis
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {selectedBasketQuery.data?.ativos && selectedBasketQuery.data.ativos.length > 0 ? (
                        <div className="space-y-2">
                          {selectedBasketQuery.data.ativos.map((allocation) => (
                            <div
                              key={allocation.ativo.id}
                              className="group relative p-3 border rounded-lg hover:border-primary/50 transition-all"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm truncate">
                                      {allocation.ativo.ticker}
                                    </span>
                                    <Badge variant="secondary" className="text-xs">
                                      {allocation.ativo.type}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                                    {allocation.ativo.name}
                                  </p>
                                  <div className="mt-2">
                                    <div className="text-lg font-bold text-primary">
                                      {formatPercent(Number(allocation.targetPercentage))}
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                                      <div
                                        className="bg-primary h-1.5 rounded-full transition-all"
                                        style={{ width: `${Number(allocation.targetPercentage)}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => {
                                    removeAssetMutation.mutate({
                                      cestaId: selectedBasket!,
                                      ativoId: allocation.ativo.id,
                                    });
                                  }}
                                  disabled={removeAssetMutation.isPending}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Target className="mx-auto h-10 w-10 mb-2 opacity-50" />
                          <p className="text-sm">Nenhum ativo alocado</p>
                          <p className="text-xs mt-1">Selecione ativos abaixo</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Adicionar Novos Ativos - Main Area */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Adicionar Ativos à Cesta</CardTitle>
                      <CardDescription>
                        Selecione um ativo e defina sua alocação target
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Search Bar */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Buscar ativos disponíveis..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      {/* Selected Asset Form */}
                      {selectedAssetDetails && (
                        <div className="p-4 border-2 border-primary rounded-lg bg-primary/5 animate-in fade-in-50 slide-in-from-top-2">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <Check className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold">{selectedAssetDetails.ticker}</span>
                                  <Badge>{selectedAssetDetails.type}</Badge>
                                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                                    SELECIONADO
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {selectedAssetDetails.name}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedAssetForAllocation(null);
                                allocationForm.reset();
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>

                          <form onSubmit={allocationForm.handleSubmit(onAddAsset)} className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor="targetPercentage" className="flex items-center gap-2">
                                <Percent className="h-4 w-4" />
                                Alocação Target (%)
                              </Label>
                              <div className="flex gap-2">
                                <Input
                                  id="targetPercentage"
                                  type="number"
                                  step="0.1"
                                  min="0.1"
                                  max="100"
                                  placeholder="Ex: 25.0"
                                  autoFocus
                                  className="text-lg font-medium"
                                  {...allocationForm.register("targetPercentage", { valueAsNumber: true })}
                                />
                                <Button
                                  type="submit"
                                  size="lg"
                                  disabled={addAssetMutation.isPending}
                                  className="min-w-[120px]"
                                >
                                  {addAssetMutation.isPending ? (
                                    <>Adicionando...</>
                                  ) : (
                                    <>
                                      <Plus className="mr-2 h-4 w-4" />
                                      Adicionar
                                    </>
                                  )}
                                </Button>
                              </div>
                              {allocationForm.formState.errors.targetPercentage && (
                                <p className="text-red-600 text-sm">
                                  {allocationForm.formState.errors.targetPercentage.message}
                                </p>
                              )}
                              {addAssetMutation.error && (
                                <p className="text-red-600 text-sm">{addAssetMutation.error.message}</p>
                              )}
                            </div>
                          </form>
                        </div>
                      )}

                      {/* Asset List */}
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {filteredAssets.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            {searchTerm ? (
                              <>
                                <Search className="mx-auto h-10 w-10 mb-2 opacity-50" />
                                <p className="text-sm">Nenhum ativo encontrado para "{searchTerm}"</p>
                              </>
                            ) : (
                              <>
                                <Check className="mx-auto h-10 w-10 mb-2 opacity-50 text-green-600" />
                                <p className="text-sm font-medium">Todos os ativos foram alocados!</p>
                                <p className="text-xs mt-1">Remova algum ativo para adicionar outro</p>
                              </>
                            )}
                          </div>
                        ) : (
                          filteredAssets.map((asset) => (
                            <div
                              key={asset.id}
                              className={`
                                p-3 border-2 rounded-lg cursor-pointer transition-all
                                ${selectedAssetForAllocation === asset.id
                                  ? 'border-primary bg-primary/5 shadow-sm'
                                  : 'border-transparent hover:border-gray-300 hover:shadow-sm'
                                }
                              `}
                              onClick={() => {
                                setSelectedAssetForAllocation(asset.id);
                                allocationForm.setValue("ativoId", asset.id);
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {selectedAssetForAllocation === asset.id ? (
                                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                      <Check className="h-4 w-4 text-primary-foreground" />
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 border-2 border-muted rounded-full flex items-center justify-center">
                                      <div className="w-3 h-3 bg-muted rounded-full" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-semibold">{asset.ticker}</div>
                                    <div className="text-sm text-muted-foreground">{asset.name}</div>
                                  </div>
                                </div>
                                <Badge variant="outline">{asset.type}</Badge>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          {/* Period Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Período de Análise</CardTitle>
              <CardDescription>Selecione o período para visualizar o desempenho</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(['1M', '3M', '6M', '1Y', 'YTD', 'ALL'] as const).map((period) => (
                  <Button
                    key={period}
                    variant={selectedPeriod === period ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPeriod(period)}
                  >
                    {period === 'ALL' ? 'Tudo' : period}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance das Cestas</CardTitle>
                <CardDescription>
                  Análise comparativa - Período: {
                    selectedPeriod === '1M' ? 'Último mês' :
                    selectedPeriod === '3M' ? 'Últimos 3 meses' :
                    selectedPeriod === '6M' ? 'Últimos 6 meses' :
                    selectedPeriod === '1Y' ? 'Último ano' :
                    selectedPeriod === 'YTD' ? 'Ano corrente' :
                    'Desde o início'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cestasQuery.data?.map((cesta) => {
                    // Only show performance if basket has assets
                    if (!cesta.ativos || cesta.ativos.length === 0) {
                      return (
                        <div key={cesta.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                          <div>
                            <div className="font-medium">{cesta.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Sem ativos alocados
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">N/A</div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <BasketPerformanceRow
                        key={cesta.id}
                        cestaId={cesta.id}
                        cestaName={cesta.name}
                        ativosCount={cesta.ativos.length}
                        period={selectedPeriod}
                        onClick={() => setSelectedBasketForAnalysis(cesta.id)}
                        isSelected={selectedBasketForAnalysis === cesta.id}
                      />
                    );
                  })}

                  {(!cestasQuery.data || cestasQuery.data.length === 0) && (
                    <div className="text-center p-8 text-muted-foreground">
                      <BarChart3 className="mx-auto h-12 w-12 mb-4" />
                      <p>Crie cestas para ver análises de performance</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Instruções</CardTitle>
                <CardDescription>Como visualizar análises detalhadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <ChevronRight className="h-5 w-5 text-primary mt-0.5" />
                    <p>Clique em uma cesta para ver análise detalhada com gráficos e métricas</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <ChevronRight className="h-5 w-5 text-primary mt-0.5" />
                    <p>Altere o período no seletor acima para ver diferentes horizontes temporais</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <ChevronRight className="h-5 w-5 text-primary mt-0.5" />
                    <p>Compare a performance da cesta com CDI e IPCA</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analysis View */}
          {selectedBasketForAnalysis && <BasketDetailedAnalysis cestaId={selectedBasketForAnalysis} period={selectedPeriod} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Separate component for basket performance row to handle individual query
interface BasketPerformanceRowProps {
  cestaId: string;
  cestaName: string;
  ativosCount: number;
  period: '1M' | '3M' | '6M' | '1Y' | 'YTD' | 'ALL';
  onClick?: () => void;
  isSelected?: boolean;
}

function BasketPerformanceRow({ cestaId, cestaName, ativosCount, period, onClick, isSelected }: BasketPerformanceRowProps) {
  const performanceQuery = api.cesta.getPerformance.useQuery(
    { cestaId, period },
    { retry: false }
  );

  const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (performanceQuery.isLoading) {
    return (
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div>
          <div className="font-medium">{cestaName}</div>
          <div className="text-sm text-muted-foreground">{ativosCount} ativos</div>
        </div>
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (performanceQuery.error) {
    return (
      <div className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
        <div>
          <div className="font-medium">{cestaName}</div>
          <div className="text-sm text-muted-foreground">{ativosCount} ativos</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-red-600">Erro ao calcular</div>
          <div className="text-xs text-muted-foreground">Dados insuficientes</div>
        </div>
      </div>
    );
  }

  const performance = performanceQuery.data;
  if (!performance) return null;

  const isPositive = performance.retornoPercentual >= 0;

  return (
    <div
      className={`flex items-center justify-between p-3 border-2 rounded-lg hover:shadow-md transition-all cursor-pointer ${
        isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50'
      }`}
      onClick={onClick}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{cestaName}</span>
          {isSelected && <ChevronRight className="h-4 w-4 text-primary" />}
        </div>
        <div className="text-sm text-muted-foreground">{ativosCount} ativos</div>
        {!performance.temDadosSuficientes && (
          <div className="text-xs text-yellow-600 mt-1">⚠️ Dados parciais</div>
        )}
      </div>
      <div className="text-right space-y-1">
        <div className="flex items-center space-x-2">
          <TrendingUp className={`h-4 w-4 ${isPositive ? 'text-green-600' : 'text-red-600'}`} />
          <span className={`${isPositive ? 'text-green-600' : 'text-red-600'} font-semibold text-lg`}>
            {formatPercent(performance.retornoPercentual)}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          {formatCurrency(performance.ganhoAbsoluto)} • {formatPercent(performance.retornoAnualizado)} a.a.
        </div>
      </div>
    </div>
  );
}

// Component to fetch and display detailed basket analysis
interface BasketDetailedAnalysisProps {
  cestaId: string;
  period: '1M' | '3M' | '6M' | '1Y' | 'YTD' | 'ALL';
}

function BasketDetailedAnalysis({ cestaId, period }: BasketDetailedAnalysisProps) {
  const performanceQuery = api.cesta.getPerformance.useQuery({ cestaId, period });
  const cestaQuery = api.cesta.getById.useQuery({ id: cestaId });

  if (performanceQuery.isLoading || cestaQuery.isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (performanceQuery.error || cestaQuery.error) {
    return (
      <Card className="border-red-500">
        <CardContent className="p-6">
          <p className="text-red-600">Erro ao carregar análise detalhada</p>
        </CardContent>
      </Card>
    );
  }

  if (!performanceQuery.data || !cestaQuery.data) return null;

  return <BasketPerformanceDetail performance={performanceQuery.data} cestaName={cestaQuery.data.name} />;
}