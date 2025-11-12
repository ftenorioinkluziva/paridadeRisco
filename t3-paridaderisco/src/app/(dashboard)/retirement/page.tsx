"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { api } from "~/lib/api";
import { Calculator, TrendingUp, TrendingDown, AlertCircle, Save, HelpCircle } from "lucide-react";

const retirementSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  idadeAtual: z.number().int().min(18, "Idade mínima: 18").max(100, "Idade máxima: 100"),
  patrimonioInicial: z.number().min(0, "Deve ser maior ou igual a zero"),
  aporteMensal: z.number().min(0, "Deve ser maior ou igual a zero"),
  idadeAposentadoria: z.number().int().min(18, "Idade mínima: 18").max(120, "Idade máxima: 120"),
  valorReceberAnualDesejado: z.number().min(1, "Deve ser maior que zero"),
  periodoUsufruir: z.number().int().min(1, "Mínimo 1 ano").max(100, "Máximo 100 anos"),
  previsaoInflacaoAnual: z.number().min(0).max(100),
  taxaRealAcumulacao: z.number().min(-10).max(100),
  taxaRealAposentadoria: z.number().min(-10).max(100),
});

type RetirementForm = z.infer<typeof retirementSchema>;

export default function RetirementPage() {
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<RetirementForm>({
    resolver: zodResolver(retirementSchema),
    defaultValues: {
      name: "Minha Simulação",
      idadeAtual: 44,
      patrimonioInicial: 82000,
      aporteMensal: 2000,
      idadeAposentadoria: 70,
      valorReceberAnualDesejado: 120000,
      periodoUsufruir: 30,
      previsaoInflacaoAnual: 4.5,
      taxaRealAcumulacao: 12,
      taxaRealAposentadoria: 7,
    },
  });

  const simulateMutation = api.retirement.simulate.useMutation();
  const createMutation = api.retirement.create.useMutation();

  const onSimulate = async (data: RetirementForm) => {
    try {
      const result = await simulateMutation.mutateAsync(data);
      setSimulationResult(result);
    } catch (error) {
      console.error("Erro na simulação:", error);
    }
  };

  const onSave = async () => {
    if (!simulationResult) return;

    setIsSaving(true);
    try {
      await createMutation.mutateAsync(simulationResult.inputData);
      alert("Simulação salva com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar simulação");
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Simulador de Aposentadoria</h2>
          <p className="text-muted-foreground">
            Calcule se seu plano de acumulação é suficiente para atingir sua meta de renda passiva
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle>Dados da Simulação</CardTitle>
            <CardDescription>Preencha os campos abaixo para simular seu plano</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSimulate)} className="space-y-6">
              {/* Nome */}
              <div>
                <Label htmlFor="name">Nome da Simulação</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
              </div>

              {/* Situação Atual */}
              <div className="space-y-4 p-3 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-sm">
                  Situação Atual
                </h3>

                <div>
                  <Label htmlFor="idadeAtual">Idade Atual</Label>
                  <Input id="idadeAtual" type="number" {...register("idadeAtual", { valueAsNumber: true })} />
                  {errors.idadeAtual && <p className="text-sm text-red-600 mt-1">{errors.idadeAtual.message}</p>}
                </div>

                <div>
                  <Label htmlFor="patrimonioInicial">Património Inicial (R$)</Label>
                  <Input id="patrimonioInicial" type="number" step="0.01" {...register("patrimonioInicial", { valueAsNumber: true })} />
                  {errors.patrimonioInicial && <p className="text-sm text-red-600 mt-1">{errors.patrimonioInicial.message}</p>}
                </div>

                <div>
                  <Label htmlFor="aporteMensal">Aporte Mensal (R$)</Label>
                  <Input id="aporteMensal" type="number" step="0.01" {...register("aporteMensal", { valueAsNumber: true })} />
                  {errors.aporteMensal && <p className="text-sm text-red-600 mt-1">{errors.aporteMensal.message}</p>}
                </div>
              </div>

              {/* Objetivos */}
              <div className="space-y-4 p-3 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-sm">
                  Objetivos de Aposentadoria
                </h3>

                <div>
                  <Label htmlFor="idadeAposentadoria">Idade de Aposentadoria</Label>
                  <Input id="idadeAposentadoria" type="number" {...register("idadeAposentadoria", { valueAsNumber: true })} />
                  {errors.idadeAposentadoria && <p className="text-sm text-red-600 mt-1">{errors.idadeAposentadoria.message}</p>}
                </div>

                <div>
                  <Label htmlFor="valorReceberAnualDesejado">
                    Valor Anual Desejado (R$)
                    <span className="text-xs text-muted-foreground ml-2">(em R$ de hoje)</span>
                  </Label>
                  <Input id="valorReceberAnualDesejado" type="number" step="0.01" {...register("valorReceberAnualDesejado", { valueAsNumber: true })} />
                  {errors.valorReceberAnualDesejado && <p className="text-sm text-red-600 mt-1">{errors.valorReceberAnualDesejado.message}</p>}
                </div>

                <div>
                  <Label htmlFor="periodoUsufruir">Período de Usufruto (anos)</Label>
                  <Input id="periodoUsufruir" type="number" {...register("periodoUsufruir", { valueAsNumber: true })} />
                  {errors.periodoUsufruir && <p className="text-sm text-red-600 mt-1">{errors.periodoUsufruir.message}</p>}
                </div>
              </div>

              {/* Premissas */}
              <div className="space-y-4 p-3 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-sm">
                  Premissas de Mercado (% ao ano)
                </h3>

                <div>
                  <Label htmlFor="previsaoInflacaoAnual">Previsão de Inflação (%)</Label>
                  <Input id="previsaoInflacaoAnual" type="number" step="0.01" {...register("previsaoInflacaoAnual", { valueAsNumber: true })} />
                  {errors.previsaoInflacaoAnual && <p className="text-sm text-red-600 mt-1">{errors.previsaoInflacaoAnual.message}</p>}
                </div>

                <div>
                  <Label htmlFor="taxaRealAcumulacao">
                    Taxa Real Acumulação (%)
                    <span className="text-xs text-muted-foreground ml-2">(acima da inflação)</span>
                  </Label>
                  <Input id="taxaRealAcumulacao" type="number" step="0.01" {...register("taxaRealAcumulacao", { valueAsNumber: true })} />
                  {errors.taxaRealAcumulacao && <p className="text-sm text-red-600 mt-1">{errors.taxaRealAcumulacao.message}</p>}
                </div>

                <div>
                  <Label htmlFor="taxaRealAposentadoria">
                    Taxa Real Aposentadoria (%)
                    <span className="text-xs text-muted-foreground ml-2">(acima da inflação)</span>
                  </Label>
                  <Input id="taxaRealAposentadoria" type="number" step="0.01" {...register("taxaRealAposentadoria", { valueAsNumber: true })} />
                  {errors.taxaRealAposentadoria && <p className="text-sm text-red-600 mt-1">{errors.taxaRealAposentadoria.message}</p>}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={simulateMutation.isPending}
              >
                <Calculator className="h-4 w-4 mr-2" />
                {simulateMutation.isPending ? "Calculando..." : "Simular Plano"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Resultados */}
        <div className="space-y-4">
          {simulationResult ? (
            <>
              {/* Veredito */}
              <div className={`p-3 rounded-lg flex items-center justify-between ${simulationResult.planoViavel ? "bg-green-50" : "bg-red-50"}`}>
                <div className="flex items-center gap-3">
                  {simulationResult.planoViavel ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <h3 className={`font-semibold ${simulationResult.planoViavel ? "text-green-600" : "text-red-600"}`}>
                      {simulationResult.planoViavel ? "Plano Viável" : "Plano Insuficiente"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {simulationResult.planoViavel ? "Superávit" : "Déficit"} de {formatCurrency(Math.abs(simulationResult.resultado))}
                    </p>
                  </div>
                </div>
                <Button onClick={onSave} disabled={isSaving} size="sm" variant="outline">
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Salvando..." : "Salvar"}
                </Button>
              </div>

              {/* Detalhes */}
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes da Simulação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">Património Necessário (Meta)</span>
                    <span className="font-bold">{formatCurrency(simulationResult.patrimonioNecessario)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Património Acumulado (Projeção)</span>
                    <span className="font-bold">{formatCurrency(simulationResult.patrimonioAcumulado)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Valor do 1º Saque (Corrigido)</span>
                    <span className="font-bold">{formatCurrency(simulationResult.valorPrimeiroSaque)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground p-3 border-t">
                    <p>Valor necessário para bancar {formatCurrency(simulationResult.valorPrimeiroSaque)}/ano por {simulationResult.inputData.periodoUsufruir} anos</p>
                    <p className="mt-1">Projeção com {formatCurrency(simulationResult.inputData.patrimonioInicial)} inicial + {formatCurrency(simulationResult.inputData.aporteMensal)}/mês por {simulationResult.anosAcumulacao} anos</p>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Preencha os dados e clique em "Simular Plano" para ver os resultados</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
