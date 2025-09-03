"use client";

import React, { useState, useMemo } from "react";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { 
  BarChart3, 
  LineChart, 
  TrendingUp, 
  Activity,
  AlertCircle,
  Loader2
} from "lucide-react";
import { api } from "~/lib/api";
import { 
  TimeSeriesChart,
  ComparisonChart,
  AssetSelector,
  TimeRangeSelector,
  ChartSkeleton,
  AssetSelectorSkeleton,
  StatsSkeleton,
  ChartEmptyState,
  MobileDrawer,
  ErrorBoundaryCard,
  ProgressiveLoader
} from "~/features/charts/components";
import type { TimeRange, AssetOption } from "~/features/charts/types/charts";
import { formatPercentageChange, calculateStats } from "~/features/charts/utils/calculations";

export default function ChartsPage() {
  // State management
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("365d");
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [activeTab, setActiveTab] = useState<"single" | "normalized" | "compare">("single");

  // API queries
  const { 
    data: availableAssets, 
    isLoading: loadingAssets 
  } = api.charts.getAvailableAssets.useQuery();

  // Separate queries for single and normalized views
  const { 
    data: singleTimeSeriesData, 
    isLoading: loadingSingleTimeSeries,
    error: singleTimeSeriesError
  } = api.charts.getTimeSeriesData.useQuery(
    {
      assetId: selectedAssets[0] || "",
      timeRange,
      startDate: customStartDate,
      endDate: customEndDate,
      normalized: false,
    },
    { 
      enabled: selectedAssets.length > 0 && activeTab === "single",
      refetchOnWindowFocus: false
    }
  );

  const { 
    data: normalizedTimeSeriesData, 
    isLoading: loadingNormalizedTimeSeries,
    error: normalizedTimeSeriesError
  } = api.charts.getTimeSeriesData.useQuery(
    {
      assetId: selectedAssets[0] || "",
      timeRange,
      startDate: customStartDate,
      endDate: customEndDate,
      normalized: true,
    },
    { 
      enabled: selectedAssets.length > 0 && activeTab === "normalized",
      refetchOnWindowFocus: false
    }
  );

  const {
    data: multiAssetData,
    isLoading: loadingMultiAsset,
    error: multiAssetError
  } = api.charts.getMultiAssetComparison.useQuery(
    {
      assetIds: selectedAssets,
      timeRange,
      startDate: customStartDate,
      endDate: customEndDate,
    },
    {
      enabled: selectedAssets.length > 1 && activeTab === "compare",
      refetchOnWindowFocus: false
    }
  );

  // Processar dados dos assets para o selector
  const assetOptions: AssetOption[] = useMemo(() => {
    if (!availableAssets) return [];
    
    return availableAssets.map(asset => ({
      id: asset.id,
      ticker: asset.ticker,
      name: asset.name,
      type: asset.type,
      dataPoints: asset._count.dadosHistoricos,
    }));
  }, [availableAssets]);

  // Calcular estatísticas do asset selecionado
  const currentAssetStats = useMemo(() => {
    const dataToUse = activeTab === "single" ? singleTimeSeriesData : 
                     activeTab === "normalized" ? normalizedTimeSeriesData : null;
    if (!dataToUse?.data) return null;
    return calculateStats(dataToUse.data);
  }, [singleTimeSeriesData, normalizedTimeSeriesData, activeTab]);

  // Handlers
  const handleAssetSelectionChange = (assetIds: string[]) => {
    setSelectedAssets(assetIds);
  };

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    if (range !== "custom") {
      setCustomStartDate(undefined);
      setCustomEndDate(undefined);
    }
  };

  const handleCustomRangeChange = (startDate: Date, endDate: Date) => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
  };

  // Render error state
  const renderError = (error: any, retry?: () => void) => (
    <ErrorBoundaryCard 
      error={error}
      retry={retry}
      fallback="Erro ao carregar dados do gráfico"
      suggestions={[
        "Tente um período menor",
        "Verifique sua conexão", 
        "Selecione um ativo diferente"
      ]}
    />
  );

  // Render progressive loading state
  const renderProgressiveLoading = (stage: "fetching" | "processing" = "fetching", details?: string) => (
    <ProgressiveLoader
      stage={stage}
      message={
        stage === "fetching" 
          ? "Carregando dados históricos dos ativos selecionados" 
          : "Processando dados para visualização"
      }
      details={details}
      estimatedTime={stage === "fetching" ? 3 : 1}
    />
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2 animate-fade-in-up">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Gráficos Financeiros</h1>
        </div>
        <p className="text-muted-foreground">
          Visualize e compare a evolução histórica dos seus ativos e índices de referência
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Mobile Controls Drawer */}
        <div className="lg:hidden animate-fade-in-up">
          <MobileDrawer 
            title="Controles dos Gráficos"
            trigger={
              <Button variant="outline" className="w-full mb-4">
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
                Controles e Filtros
              </Button>
            }
          >
            <div className="space-y-4">
              {/* Mobile Asset Selector */}
              {loadingAssets ? (
                <AssetSelectorSkeleton />
              ) : (
                <div className="p-3 border rounded-lg">
                  <AssetSelector
                    assets={assetOptions}
                    selectedAssets={selectedAssets}
                    onSelectionChange={handleAssetSelectionChange}
                    maxSelection={activeTab === "compare" ? 10 : 1}
                    isLoading={loadingAssets}
                    placeholder={
                      activeTab === "compare" 
                        ? "Selecione até 10 ativos..."
                        : "Selecione um ativo..."
                    }
                  />
                </div>
              )}

              {/* Mobile Time Range */}
              <div className="p-3 border rounded-lg">
                <TimeRangeSelector
                  selectedRange={timeRange}
                  onRangeChange={handleTimeRangeChange}
                  customStartDate={customStartDate}
                  customEndDate={customEndDate}
                  onCustomRangeChange={handleCustomRangeChange}
                />
              </div>

              {/* Mobile Stats */}
              {activeTab === "single" && selectedAssets.length > 0 && currentAssetStats && (
                <div className="p-3 border rounded-lg">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      <span className="text-sm font-medium">Estatísticas</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Retorno Total</span>
                        <div className={`font-medium ${currentAssetStats.totalChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentageChange(currentAssetStats.totalChangePercent)}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Máximo</span>
                        <div className="font-mono">
                          {activeTab === "normalized" 
                            ? formatPercentageChange(currentAssetStats.max)
                            : `R$ ${currentAssetStats.max.toFixed(2)}`
                          }
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Mínimo</span>
                        <div className="font-mono">
                          {activeTab === "normalized" 
                            ? formatPercentageChange(currentAssetStats.min)
                            : `R$ ${currentAssetStats.min.toFixed(2)}`
                          }
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Dados</span>
                        <div>{currentAssetStats.dataPoints} pts</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </MobileDrawer>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:col-span-3 space-y-6 animate-slide-in-left">
          {/* Seleção de Ativos */}
          {loadingAssets ? (
            <AssetSelectorSkeleton />
          ) : (
            <Card className="p-4 hover-grow">
              <AssetSelector
                assets={assetOptions}
                selectedAssets={selectedAssets}
                onSelectionChange={handleAssetSelectionChange}
                maxSelection={activeTab === "compare" ? 10 : 1}
                isLoading={loadingAssets}
                placeholder={
                  activeTab === "compare" 
                    ? "Selecione até 10 ativos para comparar..."
                    : "Selecione um ativo..."
                }
              />
            </Card>
          )}

          {/* Controles de Período */}
          <Card className="p-4 hover-grow">
            <TimeRangeSelector
              selectedRange={timeRange}
              onRangeChange={handleTimeRangeChange}
              customStartDate={customStartDate}
              customEndDate={customEndDate}
              onCustomRangeChange={handleCustomRangeChange}
            />
          </Card>

          {/* Estatísticas do Asset (apenas para visualização única) */}
          {activeTab === "single" && selectedAssets.length > 0 && (
            loadingSingleTimeSeries ? (
              <StatsSkeleton />
            ) : currentAssetStats ? (
              <Card className="p-4 hover-grow animate-scale-in">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    <span className="text-sm font-medium">Estatísticas</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center animate-fade-in-up-delay-100">
                      <span className="text-xs text-muted-foreground">Retorno Total</span>
                      <Badge 
                        variant="secondary"
                        className={
                          currentAssetStats.totalChangePercent >= 0 
                            ? "text-green-700 bg-green-50 border-green-200" 
                            : "text-red-700 bg-red-50 border-red-200"
                        }
                      >
                        {formatPercentageChange(currentAssetStats.totalChangePercent)}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center animate-fade-in-up-delay-200">
                      <span className="text-xs text-muted-foreground">Máximo</span>
                      <span className="text-xs font-mono">
                        {activeTab === "normalized" 
                          ? formatPercentageChange(currentAssetStats.max)
                          : `R$ ${currentAssetStats.max.toFixed(2)}`
                        }
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center animate-fade-in-up-delay-300">
                      <span className="text-xs text-muted-foreground">Mínimo</span>
                      <span className="text-xs font-mono">
                        {activeTab === "normalized" 
                          ? formatPercentageChange(currentAssetStats.min)
                          : `R$ ${currentAssetStats.min.toFixed(2)}`
                        }
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center animate-fade-in-up-delay-300">
                      <span className="text-xs text-muted-foreground">Pontos de Dados</span>
                      <span className="text-xs">{currentAssetStats.dataPoints}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ) : null
          )}
        </div>

        {/* Área principal do gráfico */}
        <div className="lg:col-span-9 animate-fade-in-up-delay-200">
          <Card className="p-3 sm:p-6 hover-grow">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <TabsList className="grid w-full grid-cols-3 sm:w-auto h-12 sm:h-10">
                  <TabsTrigger value="single" className="flex flex-col sm:flex-row items-center gap-1 text-xs sm:text-sm py-2">
                    <LineChart className="h-4 w-4" />
                    <span className="text-[10px] sm:text-sm">Único</span>
                  </TabsTrigger>
                  <TabsTrigger value="normalized" className="flex flex-col sm:flex-row items-center gap-1 text-xs sm:text-sm py-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-[10px] sm:text-sm">Retorno</span>
                  </TabsTrigger>
                  <TabsTrigger value="compare" className="flex flex-col sm:flex-row items-center gap-1 text-xs sm:text-sm py-2">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-[10px] sm:text-sm">Compare</span>
                  </TabsTrigger>
                </TabsList>

                {/* Informações do período atual */}
                {(singleTimeSeriesData || normalizedTimeSeriesData || multiAssetData) && (
                  <div className="text-sm text-muted-foreground">
                    {selectedAssets.length} ativo{selectedAssets.length > 1 ? 's' : ''} • {timeRange.toUpperCase()}
                  </div>
                )}
              </div>

              {/* Tab: Visualização Única */}
              <TabsContent value="single" className="space-y-4">
                {selectedAssets.length === 0 ? (
                  <ChartEmptyState type="single" />
                ) : singleTimeSeriesError ? (
                  renderError(singleTimeSeriesError, () => window.location.reload())
                ) : loadingSingleTimeSeries ? (
                  renderProgressiveLoading("fetching", `${selectedAssets.length} ativo selecionado`)
                ) : (
                  <div className="space-y-4 animate-fade-in-up">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-sm sm:text-base">
                          {singleTimeSeriesData?.asset?.ticker} - {singleTimeSeriesData?.asset?.name}
                        </h3>
                        <Badge variant="outline" className="mt-1">
                          {singleTimeSeriesData?.asset?.type}
                        </Badge>
                      </div>
                    </div>
                    
                    {singleTimeSeriesData && (
                      <div className="animate-scale-in">
                        <TimeSeriesChart
                          data={singleTimeSeriesData}
                          timeRange={timeRange}
                          config={{ 
                            height: 400,
                            margin: { top: 20, right: 30, left: 10, bottom: 20 }
                          }}
                          enableZoom={true}
                          enableBrush={true}
                        />
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Tab: Retorno Normalizado */}
              <TabsContent value="normalized" className="space-y-4">
                {selectedAssets.length === 0 ? (
                  <ChartEmptyState type="normalized" />
                ) : normalizedTimeSeriesError ? (
                  renderError(normalizedTimeSeriesError, () => window.location.reload())
                ) : loadingNormalizedTimeSeries ? (
                  renderProgressiveLoading("processing", "Normalizando dados de retorno")
                ) : (
                  <div className="space-y-4 animate-fade-in-up">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-sm sm:text-base">
                          Retorno Normalizado - {normalizedTimeSeriesData?.asset?.ticker}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Performance relativa baseada no primeiro ponto do período
                        </p>
                      </div>
                    </div>
                    
                    {normalizedTimeSeriesData && (
                      <div className="animate-scale-in">
                        <TimeSeriesChart
                          data={normalizedTimeSeriesData}
                          timeRange={timeRange}
                          config={{ 
                            height: 400,
                            margin: { top: 20, right: 30, left: 10, bottom: 20 }
                          }}
                          enableZoom={true}
                          enableBrush={true}
                        />
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Tab: Comparação */}
              <TabsContent value="compare" className="space-y-4">
                {selectedAssets.length < 2 ? (
                  <ChartEmptyState type="compare" />
                ) : multiAssetError ? (
                  renderError(multiAssetError, () => window.location.reload())
                ) : loadingMultiAsset ? (
                  renderProgressiveLoading("processing", `Comparando ${selectedAssets.length} ativos`)
                ) : (
                  <div className="space-y-4 animate-fade-in-up">
                    <div>
                      <h3 className="font-medium text-sm sm:text-base">Comparação de Performance</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Retorno percentual normalizado para comparação direta
                      </p>
                    </div>
                    
                    {multiAssetData && (
                      <div className="animate-scale-in">
                        <ComparisonChart
                          data={multiAssetData}
                          timeRange={timeRange}
                          config={{ 
                            height: 400,
                            margin: { top: 20, right: 30, left: 10, bottom: 20 }
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}