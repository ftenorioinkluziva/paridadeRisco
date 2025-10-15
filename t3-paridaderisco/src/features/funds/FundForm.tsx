"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { api } from "~/lib/api";

const fundSchema = z.object({
  name: z.string().min(1, "Nome do fundo é obrigatório"),
  initialInvestment: z.number().min(0.01, "Investimento inicial deve ser maior que zero"),
  currentValue: z.number().min(0, "Valor atual deve ser positivo"),
  investmentDate: z.string().min(1, "Data do investimento é obrigatória"),
  indiceId: z.string().optional(),
});

type FundFormData = z.infer<typeof fundSchema>;

interface FundFormProps {
  fundId?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function FundForm({ fundId, onSuccess, onCancel }: FundFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: fundData } = api.fundo.getById.useQuery(
    { id: fundId! },
    { enabled: !!fundId }
  );

  const { data: indices } = api.fundo.getAvailableIndices.useQuery();

  const createMutation = api.fundo.create.useMutation();
  const updateMutation = api.fundo.update.useMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FundFormData>({
    resolver: zodResolver(fundSchema),
    defaultValues: {
      name: "",
      initialInvestment: 0,
      currentValue: 0,
      investmentDate: "",
      indiceId: "",
    },
  });

  // Preencher formulário quando editando
  useEffect(() => {
    if (fundData) {
      setValue("name", fundData.name);
      setValue("initialInvestment", fundData.initialInvestment);
      setValue("currentValue", fundData.currentValue);
      setValue("investmentDate", fundData.investmentDate instanceof Date 
        ? fundData.investmentDate.toISOString().split('T')[0]
        : new Date(fundData.investmentDate).toISOString().split('T')[0]
      );
      setValue("indiceId", fundData.indiceId || "");
    }
  }, [fundData, setValue]);

  const onSubmit = async (data: FundFormData) => {
    setIsSubmitting(true);
    
    try {
      if (fundId) {
        await updateMutation.mutateAsync({
          id: fundId,
          ...data,
        });
      } else {
        await createMutation.mutateAsync(data);
      }

      reset();
      onSuccess();
    } catch (error) {
      console.error('Error saving fund:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Calcular rentabilidade em tempo real
  const watchInitial = register("initialInvestment").onChange;
  const watchCurrent = register("currentValue").onChange;
  const [initialValue, setInitialValue] = useState(0);
  const [currentValue, setCurrentValue] = useState(0);

  const rentabilidade = initialValue > 0 
    ? ((currentValue - initialValue) / initialValue) * 100 
    : 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Fundo</Label>
        <Input
          id="name"
          placeholder="Ex: BTG CDB Plus FIRF CrPr"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="indiceId">Índice Associado (opcional)</Label>
        <select
          id="indiceId"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          {...register("indiceId")}
        >
          <option value="">Selecionar índice...</option>
          {indices?.map((indice) => (
            <option key={indice.id} value={indice.id}>
              {indice.ticker} - {indice.name}
            </option>
          ))}
        </select>
        {errors.indiceId && (
          <p className="text-sm text-red-600">{errors.indiceId.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="initialInvestment">Investimento Inicial (R$)</Label>
          <Input
            id="initialInvestment"
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("initialInvestment", { 
              valueAsNumber: true,
              onChange: (e) => {
                setInitialValue(parseFloat(e.target.value) || 0);
                watchInitial?.(e);
              }
            })}
          />
          {errors.initialInvestment && (
            <p className="text-sm text-red-600">{errors.initialInvestment.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="currentValue">Valor Atual (R$)</Label>
          <Input
            id="currentValue"
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("currentValue", { 
              valueAsNumber: true,
              onChange: (e) => {
                setCurrentValue(parseFloat(e.target.value) || 0);
                watchCurrent?.(e);
              }
            })}
          />
          {errors.currentValue && (
            <p className="text-sm text-red-600">{errors.currentValue.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="investmentDate">Data do Investimento</Label>
        <Input
          id="investmentDate"
          type="date"
          {...register("investmentDate")}
        />
        {errors.investmentDate && (
          <p className="text-sm text-red-600">{errors.investmentDate.message}</p>
        )}
      </div>

      {/* Prévia da Rentabilidade */}
      {initialValue > 0 && currentValue > 0 && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Prévia da Rentabilidade</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Ganho/Perda: </span>
              <span className={currentValue >= initialValue ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(currentValue - initialValue)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Rentabilidade: </span>
              <span className={rentabilidade >= 0 ? 'text-green-600' : 'text-red-600'}>
                {rentabilidade >= 0 ? '+' : ''}{rentabilidade.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting 
            ? 'Salvando...' 
            : fundId 
              ? 'Atualizar Fundo' 
              : 'Criar Fundo'
          }
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}