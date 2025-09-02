"use client";

import { useState } from "react";
import { Plus, TrendingUp, TrendingDown, PiggyBank, DollarSign } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { api } from "~/lib/api";
import { FundForm } from "./FundForm";
import { FundList } from "./FundList";

export function FundManager() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingFund, setEditingFund] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = api.fundo.getStats.useQuery();
  const { data: funds, isLoading: fundsLoading, refetch } = api.fundo.list.useQuery();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const handleSuccess = () => {
    setIsCreating(false);
    setEditingFund(null);
    refetch();
  };

  if (statsLoading || fundsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Fundos de Investimento</h1>
          <p className="text-muted-foreground">
            Gerencie seus fundos de investimento e acompanhe a rentabilidade
          </p>
        </div>
        <Button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Fundo
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Investido</CardTitle>
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalInvestido)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Atual</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.valorAtual)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ganho/Perda</CardTitle>
              {stats.ganhoPerda >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.ganhoPerda >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(stats.ganhoPerda)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rentabilidade</CardTitle>
              {stats.rentabilidadeMedia >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.rentabilidadeMedia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(stats.rentabilidadeMedia)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.quantidadeFundos} fundo{stats.quantidadeFundos !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Fund Form */}
        {(isCreating || editingFund) && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>
                {isCreating ? 'Novo Fundo' : 'Editar Fundo'}
              </CardTitle>
              <CardDescription>
                {isCreating 
                  ? 'Adicione um novo fundo de investimento ao seu portfólio'
                  : 'Atualize as informações do fundo'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FundForm
                fundId={editingFund}
                onSuccess={handleSuccess}
                onCancel={() => {
                  setIsCreating(false);
                  setEditingFund(null);
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Fund List */}
        <Card className={`${isCreating || editingFund ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <CardHeader>
            <CardTitle>Meus Fundos</CardTitle>
            <CardDescription>
              Lista de todos os seus fundos de investimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FundList
              funds={funds || []}
              onEdit={setEditingFund}
              onRefresh={refetch}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}