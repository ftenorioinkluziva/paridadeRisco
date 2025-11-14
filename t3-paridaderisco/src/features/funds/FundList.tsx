"use client";

import { useState } from "react";
import { 
  Edit, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  Calendar,
  DollarSign
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { api } from "~/lib/api";

interface Fund {
  id: string;
  name: string;
  initialInvestment: number;
  currentValue: number;
  investmentDate: Date;
  rentabilidade: number;
  ganhoPerda: number;
  createdAt: Date;
  updatedAt: Date;
}

interface FundListProps {
  funds: Fund[];
  onEdit: (fundId: string) => void;
  onRefresh: () => void;
}

export function FundList({ funds, onEdit, onRefresh }: FundListProps) {
  const [updatingValue, setUpdatingValue] = useState<{ [key: string]: number }>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const updateValueMutation = api.fundo.updateCurrentValue.useMutation();
  const deleteMutation = api.fundo.delete.useMutation();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const handleUpdateValue = async (fundId: string) => {
    const newValue = updatingValue[fundId];
    if (newValue === undefined || newValue < 0) return;

    try {
      await updateValueMutation.mutateAsync({
        id: fundId,
        currentValue: newValue,
      });
      
      // Remove from updating state
      setUpdatingValue(prev => {
        const updated = { ...prev };
        delete updated[fundId];
        return updated;
      });
      
      onRefresh();
    } catch (error) {
      console.error('Error updating fund value:', error);
    }
  };

  const handleDelete = async (fundId: string) => {
    if (!confirm('Tem certeza que deseja excluir este fundo? Esta ação não pode ser desfeita.')) {
      return;
    }

    setDeletingId(fundId);
    try {
      await deleteMutation.mutateAsync({ id: fundId });
      onRefresh();
    } catch (error) {
      console.error('Error deleting fund:', error);
    } finally {
      setDeletingId(null);
    }
  };

  if (funds.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="dark:text-gray-400 text-gray-600 mb-4">
          <DollarSign className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium dark:text-white text-gray-900 mb-2">
          Nenhum fundo cadastrado
        </h3>
        <p className="dark:text-gray-400 text-gray-600">
          Adicione seu primeiro fundo de investimento para começar a acompanhar sua rentabilidade.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {funds.map((fund) => (
        <div 
          key={fund.id} 
          className="p-4 border rounded-lg hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-lg">{fund.name}</h3>
              <div className="flex items-center gap-4 text-sm dark:text-gray-400 text-gray-600 mt-1">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(fund.investmentDate)}
                </div>
                <div>
                  Atualizado em: {formatDate(fund.updatedAt)}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(fund.id)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(fund.id)}
                disabled={deletingId === fund.id}
              >
                {deletingId === fund.id ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Investimento Inicial */}
            <div>
              <div className="text-sm dark:text-gray-400 text-gray-600 mb-1">Investimento Inicial</div>
              <div className="font-medium">{formatCurrency(fund.initialInvestment)}</div>
            </div>

            {/* Valor Atual */}
            <div>
              <div className="text-sm dark:text-gray-400 text-gray-600 mb-1">Valor Atual</div>
              <div className="font-medium">{formatCurrency(fund.currentValue)}</div>
            </div>

            {/* Ganho/Perda */}
            <div>
              <div className="text-sm dark:text-gray-400 text-gray-600 mb-1">Ganho/Perda</div>
              <div className={`font-medium flex items-center gap-1 ${
                fund.ganhoPerda >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {fund.ganhoPerda >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {formatCurrency(fund.ganhoPerda)}
              </div>
            </div>

            {/* Rentabilidade */}
            <div>
              <div className="text-sm dark:text-gray-400 text-gray-600 mb-1">Rentabilidade</div>
              <Badge
                variant={fund.rentabilidade >= 0 ? "success" : "error"}
                className="font-medium"
              >
                {formatPercentage(fund.rentabilidade)}
              </Badge>
            </div>
          </div>

          {/* Atualização Rápida de Valor */}
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm dark:text-gray-400 text-gray-600 min-w-fit">Atualizar valor:</span>
              <Input
                type="number"
                step="0.01"
                placeholder="Novo valor atual"
                value={updatingValue[fund.id] || ''}
                onChange={(e) => 
                  setUpdatingValue(prev => ({ 
                    ...prev, 
                    [fund.id]: parseFloat(e.target.value) || 0 
                  }))
                }
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={() => handleUpdateValue(fund.id)}
                disabled={!updatingValue[fund.id] || updateValueMutation.isPending}
              >
                {updateValueMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  'Atualizar'
                )}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}