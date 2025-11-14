"use client";

import { useState, useEffect } from "react";
import { api } from "~/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Download,
  Globe,
  TrendingUp,
  Play,
  Pause,
  Calendar
} from "lucide-react";

export function DataUpdateManager() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateStatus, setLastUpdateStatus] = useState<string | null>(null);

  const lastUpdateInfoQuery = api.financial.getLastUpdateInfo.useQuery();
  const availableAssetsQuery = api.financial.getAvailableAssets.useQuery();
  const schedulerStatusQuery = api.financial.getSchedulerStatus.useQuery();
  
  const updateAllMutation = api.financial.updateAllAssets.useMutation({
    onSuccess: (data) => {
      setLastUpdateStatus("success");
      setIsUpdating(false);
      // Refetch to get updated info
      lastUpdateInfoQuery.refetch();
    },
    onError: (error) => {
      setLastUpdateStatus("error");
      setIsUpdating(false);
      console.error("Update failed:", error);
    },
  });

  const updateSpecificMutation = api.financial.updateSpecificAsset.useMutation({
    onSuccess: () => {
      lastUpdateInfoQuery.refetch();
    },
  });

  const startSchedulerMutation = api.financial.startScheduler.useMutation({
    onSuccess: () => {
      schedulerStatusQuery.refetch();
    },
  });

  const stopSchedulerMutation = api.financial.stopScheduler.useMutation({
    onSuccess: () => {
      schedulerStatusQuery.refetch();
    },
  });

  const handleUpdateAll = async (incremental = true) => {
    setIsUpdating(true);
    setLastUpdateStatus(null);
    updateAllMutation.mutate({ incremental });
  };

  const handleUpdateSpecific = async (ticker: string) => {
    updateSpecificMutation.mutate({ ticker });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Nunca";
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getStatusBadge = (isOutdated: boolean, lastUpdate: Date | null) => {
    if (!lastUpdate) {
      return <Badge variant="error">Sem dados</Badge>;
    }

    if (isOutdated) {
      return <Badge variant="warning">Desatualizado</Badge>;
    }

    return <Badge variant="success">Atualizado</Badge>;
  };

  const getStatusIcon = (isOutdated: boolean, lastUpdate: Date | null) => {
    if (!lastUpdate) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    
    if (isOutdated) {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    }
    
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gerenciamento de Dados</h2>
          <p className="text-muted-foreground">
            Atualize dados financeiros do Yahoo Finance e BCB
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => handleUpdateAll(true)}
            disabled={isUpdating}
            variant="outline"
          >
            {isUpdating ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Atualização Incremental
          </Button>
          <Button 
            onClick={() => handleUpdateAll(false)}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Atualização Completa
          </Button>
        </div>
      </div>

      {/* Update Status */}
      {isUpdating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
              Atualizando dados...
            </CardTitle>
            <CardDescription>
              Buscando dados mais recentes dos serviços externos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="animate-pulse">•</div>
              <span>Este processo pode levar alguns minutos</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Update Status */}
      {lastUpdateStatus === "success" && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center text-green-700">
              <CheckCircle className="mr-2 h-5 w-5" />
              Atualização Concluída
            </CardTitle>
            <CardDescription className="text-green-600">
              Todos os dados foram atualizados com sucesso
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {lastUpdateStatus === "error" && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Erro na Atualização
            </CardTitle>
            <CardDescription className="text-red-600">
              Ocorreu um erro durante a atualização. Tente novamente.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Assets Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status dos Ativos</CardTitle>
            <CardDescription>
              Última atualização de cada ativo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lastUpdateInfoQuery.isLoading ? (
                <div className="flex justify-center p-4">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : lastUpdateInfoQuery.error ? (
                <p className="text-red-600 text-center">Erro ao carregar status</p>
              ) : (
                lastUpdateInfoQuery.data?.map((asset) => (
                  <div key={asset.ticker} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(asset.isOutdated, asset.lastUpdate)}
                      <div>
                        <div className="font-medium">{asset.ticker}</div>
                        <div className="text-sm text-muted-foreground">{asset.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(asset.isOutdated, asset.lastUpdate)}
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDate(asset.lastUpdate)}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUpdateSpecific(asset.ticker)}
                        disabled={updateSpecificMutation.isPending}
                        className="mt-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fontes de Dados</CardTitle>
            <CardDescription>
              Serviços externos integrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Globe className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium">Yahoo Finance</div>
                    <div className="text-sm text-muted-foreground">Ações e ETFs</div>
                  </div>
                </div>
                <Badge variant="default">Ativo</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-medium">Banco Central (BCB)</div>
                    <div className="text-sm text-muted-foreground">CDI e indicadores</div>
                  </div>
                </div>
                <Badge variant="default">Ativo</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduler Control */}
      <Card>
        <CardHeader>
          <CardTitle>Agendador Automático</CardTitle>
          <CardDescription>
            Controle das atualizações automáticas dos dados financeiros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="font-medium">Status do Agendador</div>
                  <div className="text-sm text-muted-foreground">
                    {schedulerStatusQuery.data?.isRunning ? 'Ativo e funcionando' : 'Inativo'}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={schedulerStatusQuery.data?.isRunning ? 'default' : 'secondary'}>
                  {schedulerStatusQuery.data?.isRunning ? 'Ativo' : 'Inativo'}
                </Badge>
                {schedulerStatusQuery.data?.isRunning ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => stopSchedulerMutation.mutate()}
                    disabled={stopSchedulerMutation.isPending}
                  >
                    <Pause className="h-4 w-4 mr-1" />
                    Parar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => startSchedulerMutation.mutate()}
                    disabled={startSchedulerMutation.isPending}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Iniciar
                  </Button>
                )}
              </div>
            </div>
            
            {schedulerStatusQuery.data?.nextRuns && schedulerStatusQuery.data.nextRuns.length > 0 && (
              <div className="p-3 dark:bg-slate-800/50 bg-slate-50 rounded-lg">
                <div className="font-medium text-sm mb-2">Próximas Execuções:</div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {schedulerStatusQuery.data.nextRuns.map((run, index) => (
                    <li key={index} className="flex items-center">
                      <Clock className="h-3 w-3 mr-2" />
                      {run}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Assets */}
      <Card>
        <CardHeader>
          <CardTitle>Ativos Disponíveis</CardTitle>
          <CardDescription>
            Lista de todos os ativos configurados para atualização
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-4">
            {availableAssetsQuery.data?.map((asset) => (
              <div key={asset.ticker} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <div className="font-medium text-sm">{asset.ticker}</div>
                  <div className="text-xs text-muted-foreground">{asset.type}</div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {asset.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}