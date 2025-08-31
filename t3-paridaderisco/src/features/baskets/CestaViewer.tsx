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
  PieChart,
  Plus,
  Edit,
  Trash2,
  Target,
  TrendingUp,
  BarChart3,
  Search
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
    onSuccess: () => {
      basketForm.reset();
      setIsCreating(false);
      cestasQuery.refetch();
    },
  });

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const onSubmitBasket = (data: BasketFormData) => {
    createBasketMutation.mutate({
      name: data.name,
      ativos: [], // Will be added later in allocation management
    });
  };

  // Filter assets for allocation
  const filteredAssets = assetsQuery.data?.filter(asset =>
    asset.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Alocações</CardTitle>
              <CardDescription>
                {selectedBasket ? 'Defina a alocação target para cada ativo na cesta' : 'Selecione uma cesta para gerenciar alocações'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedBasket ? (
                <div className="text-center p-8 text-muted-foreground">
                  <PieChart className="mx-auto h-12 w-12 mb-4" />
                  <p>Selecione uma cesta na aba "Visualizar Cestas" para gerenciar suas alocações</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Asset Selection */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Adicionar Ativo</h3>
                    
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Buscar ativos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {filteredAssets.map((asset) => (
                        <div
                          key={asset.id}
                          className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            allocationForm.setValue("ativoId", asset.id);
                            setSearchTerm("");
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
                      ))}
                    </div>
                  </div>

                  {/* Allocation Form */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Definir Alocação</h3>
                    <form className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="targetPercentage">Alocação Target (%)</Label>
                        <Input
                          id="targetPercentage"
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="100"
                          placeholder="Ex: 25.0"
                          {...allocationForm.register("targetPercentage", { valueAsNumber: true })}
                        />
                        {allocationForm.formState.errors.targetPercentage && (
                          <p className="text-red-600 text-sm">
                            {allocationForm.formState.errors.targetPercentage.message}
                          </p>
                        )}
                      </div>

                      <Button type="button" className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar à Cesta
                      </Button>
                    </form>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance das Cestas</CardTitle>
                <CardDescription>Análise comparativa</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cestasQuery.data?.map((cesta) => (
                    <div key={cesta.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{cesta.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {cesta.ativos?.length || 0} ativos
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-green-600 font-semibold">+0.00%</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Simulado</div>
                      </div>
                    </div>
                  ))}
                  
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
                <CardTitle>Diversificação</CardTitle>
                <CardDescription>Análise de risco das cestas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8 text-muted-foreground">
                  <Target className="mx-auto h-12 w-12 mb-4" />
                  <p>Análise de diversificação em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}