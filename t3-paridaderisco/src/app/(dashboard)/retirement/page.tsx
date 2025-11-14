"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { api } from "~/lib/api";
import { Calculator, TrendingUp, TrendingDown, AlertCircle, Save, HelpCircle, Loader2 } from "lucide-react";
import { calcularIdade } from "~/lib/utils/date";
import { RetirementCharts } from "~/components/retirement/RetirementCharts";
import { RetirementDetails } from "~/components/retirement/RetirementDetails";
import { calcularEvolucaoPatrimonio } from "~/lib/utils/retirementCalculations";

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
  aliquotaIR: z.number().min(0, "Mínimo 0%").max(100, "Máximo 100%"),
});

type RetirementForm = z.infer<typeof retirementSchema>;

export default function RetirementPage() {
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<RetirementForm>({
    resolver: zodResolver(retirementSchema),
    defaultValues: {
      name: "Minha Simulação",
      idadeAtual: 30,
      patrimonioInicial: 0,
      aporteMensal: 2000,
      idadeAposentadoria: 65,
      valorReceberAnualDesejado: 120000,
      periodoUsufruir: 30,
      previsaoInflacaoAnual: 4.5,
      taxaRealAcumulacao: 12,
      taxaRealAposentadoria: 7,
      aliquotaIR: 15,
    },
  });

  // Fetch user profile for age
  const { data: userProfile } = api.user.getUserProfile.useQuery();

  // Fetch portfolio value
  const { data: portfolioValue } = api.retirement.getUserPortfolioValue.useQuery();

  // Fetch market premises (IPCA)
  const { data: marketPremises } = api.retirement.getMarketPremises.useQuery();

  const simulateMutation = api.retirement.simulate.useMutation();
  const createMutation = api.retirement.create.useMutation();

  // Auto-fill form with real data
  useEffect(() => {
    setIsLoadingData(true);

    // Set age from user profile
    if (userProfile?.dataNascimento) {
      const idade = calcularIdade(userProfile.dataNascimento);
      if (idade) {
        setValue("idadeAtual", idade);
      }
    }

    // Set portfolio value
    if (portfolioValue?.valorTotal) {
      setValue("patrimonioInicial", portfolioValue.valorTotal);
    }

    // Set inflation from IPCA_EXP data
    if (marketPremises?.expectativaInflacao12M) {
      setValue("previsaoInflacaoAnual", marketPremises.expectativaInflacao12M);
    }

    setIsLoadingData(false);
  }, [userProfile, portfolioValue, marketPremises, setValue]);

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
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Dados da Simulação</CardTitle>
            <CardDescription className="text-xs">Preencha os campos abaixo</CardDescription>
          </CardHeader>
          <CardContent className="pt-3">
            <form onSubmit={handleSubmit(onSimulate)} className="space-y-4">
              {/* Nome */}
              <div>
                <Label htmlFor="name" className="text-xs">Nome da Simulação</Label>
                <Input id="name" {...register("name")} className="h-9" />
                {errors.name && <p className="text-xs text-red-600 mt-0.5">{errors.name.message}</p>}
              </div>

              {/* Situação Atual */}
              <div className="space-y-3 p-2.5 dark:bg-slate-800/50 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-xs dark:text-slate-300 text-slate-700">
                  Situação Atual
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="idadeAtual" className="text-xs">
                      Idade Atual
                      {userProfile?.dataNascimento && (
                        <span className="text-[10px] text-green-600 ml-1">
                          (perfil)
                        </span>
                      )}
                    </Label>
                    <Input id="idadeAtual" type="number" {...register("idadeAtual", { valueAsNumber: true })} className="h-9" />
                    {errors.idadeAtual && <p className="text-xs text-red-600 mt-0.5">{errors.idadeAtual.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="aporteMensal" className="text-xs">Aporte Mensal (R$)</Label>
                    <Input id="aporteMensal" type="number" step="0.01" {...register("aporteMensal", { valueAsNumber: true })} className="h-9" />
                    {errors.aporteMensal && <p className="text-xs text-red-600 mt-0.5">{errors.aporteMensal.message}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="patrimonioInicial" className="text-xs">
                    Património Inicial
                    {portfolioValue && (
                      <span className="text-[10px] text-green-600 ml-1">
                        ({formatCurrency(portfolioValue.valorTotal)})
                      </span>
                    )}
                  </Label>
                  <Input id="patrimonioInicial" type="number" step="0.01" {...register("patrimonioInicial", { valueAsNumber: true })} className="h-9" />
                  {errors.patrimonioInicial && <p className="text-xs text-red-600 mt-0.5">{errors.patrimonioInicial.message}</p>}
                </div>
              </div>

              {/* Objetivos */}
              <div className="space-y-3 p-2.5 dark:bg-slate-800/50 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-xs dark:text-slate-300 text-slate-700">
                  Objetivos de Aposentadoria
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="idadeAposentadoria" className="text-xs">Idade Aposentadoria</Label>
                    <Input id="idadeAposentadoria" type="number" {...register("idadeAposentadoria", { valueAsNumber: true })} className="h-9" />
                    {errors.idadeAposentadoria && <p className="text-xs text-red-600 mt-0.5">{errors.idadeAposentadoria.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="periodoUsufruir" className="text-xs">Período (anos)</Label>
                    <Input id="periodoUsufruir" type="number" {...register("periodoUsufruir", { valueAsNumber: true })} className="h-9" />
                    {errors.periodoUsufruir && <p className="text-xs text-red-600 mt-0.5">{errors.periodoUsufruir.message}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="valorReceberAnualDesejado" className="text-xs">
                    Valor Anual Desejado
                    <span className="text-[10px] text-muted-foreground ml-1">(R$ de hoje)</span>
                  </Label>
                  <Input id="valorReceberAnualDesejado" type="number" step="0.01" {...register("valorReceberAnualDesejado", { valueAsNumber: true })} className="h-9" />
                  {errors.valorReceberAnualDesejado && <p className="text-xs text-red-600 mt-0.5">{errors.valorReceberAnualDesejado.message}</p>}
                </div>
              </div>

              {/* Premissas */}
              <div className="space-y-3 p-2.5 dark:bg-slate-800/50 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-xs dark:text-slate-300 text-slate-700">
                  Premissas de Mercado (% ao ano)
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="previsaoInflacaoAnual" className="text-xs">
                      Inflação
                      {marketPremises && (
                        <span className="text-[10px] text-green-600 ml-1">
                          ({marketPremises.expectativaInflacao12M.toFixed(1)}%)
                        </span>
                      )}
                    </Label>
                    <Input id="previsaoInflacaoAnual" type="number" step="0.01" {...register("previsaoInflacaoAnual", { valueAsNumber: true })} className="h-9" />
                    {errors.previsaoInflacaoAnual && <p className="text-xs text-red-600 mt-0.5">{errors.previsaoInflacaoAnual.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="aliquotaIR" className="text-xs">
                      IR Rendimentos
                    </Label>
                    <Input id="aliquotaIR" type="number" step="0.01" {...register("aliquotaIR", { valueAsNumber: true })} className="h-9" />
                    {errors.aliquotaIR && <p className="text-xs text-red-600 mt-0.5">{errors.aliquotaIR.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="taxaRealAcumulacao" className="text-xs">
                      Taxa Acumulação
                    </Label>
                    <Input id="taxaRealAcumulacao" type="number" step="0.01" {...register("taxaRealAcumulacao", { valueAsNumber: true })} className="h-9" />
                    {errors.taxaRealAcumulacao && <p className="text-xs text-red-600 mt-0.5">{errors.taxaRealAcumulacao.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="taxaRealAposentadoria" className="text-xs">
                      Taxa Aposentadoria
                    </Label>
                    <Input id="taxaRealAposentadoria" type="number" step="0.01" {...register("taxaRealAposentadoria", { valueAsNumber: true })} className="h-9" />
                    {errors.taxaRealAposentadoria && <p className="text-xs text-red-600 mt-0.5">{errors.taxaRealAposentadoria.message}</p>}
                  </div>
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
              {/* Detalhes */}
              <RetirementDetails
                simulationResult={simulationResult}
                evolucaoPatrimonio={calcularEvolucaoPatrimonio(simulationResult.inputData)}
                onSave={onSave}
                isSaving={isSaving}
              />
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

      {/* Gráficos de Evolução */}
      {simulationResult && simulationResult.inputData && (
        <RetirementCharts inputData={simulationResult.inputData} />
      )}
    </div>
  );
}
