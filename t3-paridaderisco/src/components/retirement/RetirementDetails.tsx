"use client";

import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { CheckCircle2, XCircle, Save } from "lucide-react";

interface RetirementDetailsProps {
  simulationResult: {
    patrimonioNecessario: number;
    patrimonioAcumulado: number;
    valorPrimeiroSaque: number;
    planoViavel: boolean;
    resultado: number;
    anosAcumulacao: number;
    capitalInvestido: number;
    rendimentosTotais: number;
    inputData: {
      idadeAtual: number;
      idadeAposentadoria: number;
      periodoUsufruir: number;
      patrimonioInicial: number;
      aporteMensal: number;
      valorReceberAnualDesejado: number;
      taxaRealAcumulacao: number;
      taxaRealAposentadoria: number;
      previsaoInflacaoAnual: number;
      aliquotaIR: number;
    };
  };
  evolucaoPatrimonio: {
    evolucao: Array<{
      idade: number;
      patrimonio: number;
      fase: 'acumulacao' | 'aposentadoria';
    }>;
    patrimonioFinal: number;
    patrimonioMaximo: number;
  };
  onSave: () => void;
  isSaving: boolean;
}

export function RetirementDetails({ simulationResult, evolucaoPatrimonio, onSave, isSaving }: RetirementDetailsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatCurrencyCompact = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calcular porcentagem da meta atingida baseado na simulação real
  const percentualMeta = (simulationResult.patrimonioAcumulado / simulationResult.patrimonioNecessario) * 100;

  // Valor mensal líquido que conseguirá receber (em valores de hoje)
  const valorMensalLiquido = simulationResult.valorPrimeiroSaque / 12;

  // Valor desejado mensal
  const valorMensalDesejado = simulationResult.inputData.valorReceberAnualDesejado / 12;

  // Patrimônio no início da aposentadoria (máximo do gráfico)
  const patrimonioTransicao = evolucaoPatrimonio.patrimonioMaximo;

  // Idade final planejada
  const idadeFinal = simulationResult.inputData.idadeAposentadoria + simulationResult.inputData.periodoUsufruir;

  // Verificar até que idade o dinheiro realmente dura
  const ultimoPontoPositivo = evolucaoPatrimonio.evolucao.filter(p => p.patrimonio > 1000).pop(); // Considera acabado se < R$ 1000
  const idadeFinalReal = ultimoPontoPositivo?.idade || simulationResult.inputData.idadeAposentadoria;

  // Anos que o dinheiro durará na aposentadoria
  const anosSustentaveis = idadeFinalReal - simulationResult.inputData.idadeAposentadoria;
  const anosFaltantes = idadeFinal - idadeFinalReal;

  // Verificar se o plano é realmente sustentável (dura todo o período planejado)
  const planoSustentavel = anosFaltantes <= 0;

  // Calcular evolução da renda para mostrar faixa nominal
  const rendaInicial = simulationResult.valorPrimeiroSaque / 12;
  const anosAcumulacao = simulationResult.inputData.idadeAposentadoria - simulationResult.inputData.idadeAtual;
  const taxaInflacao = simulationResult.inputData.previsaoInflacaoAnual / 100;

  // Renda no último ano (corrigida pela inflação)
  const rendaFinalNominal = rendaInicial * Math.pow(1 + taxaInflacao, anosSustentaveis);

  // Total que conseguirá retirar (aproximado)
  let totalRetirado = 0;
  for (let i = 0; i < anosSustentaveis; i++) {
    const rendaAno = rendaInicial * Math.pow(1 + taxaInflacao, i);
    totalRetirado += rendaAno * 12;
  }

  // Para calcular déficit/superávit, considerar se o plano é sustentável
  // Se não é sustentável, há déficit (precisa de mais dinheiro para durar os anos planejados)
  let mensagemAporte = "";
  let tipoMensagem: "deficit" | "superavit" | "equilibrado" = "equilibrado";

  if (!planoSustentavel) {
    // Há déficit - precisa de mais patrimônio para durar os anos planejados
    // Calcular quanto falta aproximadamente
    const patrimonioFaltante = Math.abs(evolucaoPatrimonio.patrimonioFinal - simulationResult.patrimonioNecessario);
    const aporteMensalExtra = patrimonioFaltante / (simulationResult.anosAcumulacao * 12);
    mensagemAporte = `Faltam ${anosFaltantes} anos`;
    tipoMensagem = "deficit";
  } else if (percentualMeta > 105) {
    // Tem superávit significativo
    mensagemAporte = `Sobra de ${formatCurrency(evolucaoPatrimonio.patrimonioFinal)}`;
    tipoMensagem = "superavit";
  } else {
    // Está equilibrado
    mensagemAporte = "Meta exata";
    tipoMensagem = "equilibrado";
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        {/* Header com Status */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {planoSustentavel ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
            <h2 className={`text-2xl font-bold ${planoSustentavel ? 'text-green-600' : 'text-red-600'}`}>
              {planoSustentavel ? "Meta Atingível!" : "Meta Não Atingível"}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {planoSustentavel
              ? `Seu plano atual conseguirá sustentar ${percentualMeta.toFixed(1)}% da renda desejada.`
              : `Seu plano atual só conseguirá sustentar até os ${idadeFinalReal} anos (de ${idadeFinal} planejados).`
            }
          </p>
        </div>

        {/* Cards Aporte Atual vs Resultado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Com aporte atual */}
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
            <h3 className="text-sm font-medium text-blue-700 mb-2">Com aporte atual:</h3>
            <p className="text-lg font-bold text-gray-900">
              Total de {formatCurrencyCompact(totalRetirado)}
            </p>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-muted-foreground">
                Faixa de renda: {formatCurrency(rendaInicial)} → {formatCurrency(rendaFinalNominal)}
              </p>
              <p className="text-xs text-muted-foreground">
                Durante {anosSustentaveis} anos (dos {simulationResult.inputData.periodoUsufruir} planejados)
              </p>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-primary/30">
                <span className="text-blue-700">Salário mensal atual:</span>
                <span className="font-semibold text-blue-900">{formatCurrency(valorMensalDesejado)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-700">Quando se aposentar:</span>
                <span className="font-semibold text-blue-900">{formatCurrency(rendaInicial)}</span>
              </div>
            </div>
          </div>

          {/* Resultado do Plano */}
          <div className={`p-4 rounded-lg border ${
            tipoMensagem === "superavit"
              ? 'bg-success/10 border-success/30'
              : tipoMensagem === "deficit"
              ? 'bg-destructive/10 border-destructive/30'
              : 'bg-warning/10 border-warning/30'
          }`}>
            <h3 className={`text-sm font-medium mb-2 ${
              tipoMensagem === "superavit"
                ? 'text-green-700'
                : tipoMensagem === "deficit"
                ? 'text-red-700'
                : 'text-yellow-700'
            }`}>
              {tipoMensagem === "superavit" ? "Superávit" : tipoMensagem === "deficit" ? "Déficit" : "Resultado"}:
            </h3>
            <p className="text-lg font-bold text-gray-900">
              {mensagemAporte}
            </p>
            {tipoMensagem === "deficit" && (
              <p className="text-xs text-muted-foreground mt-1">
                Dinheiro acaba aos {idadeFinalReal} anos
              </p>
            )}
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="flex justify-end pt-2">
          <Button onClick={onSave} disabled={isSaving} variant="outline">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </div>

        {/* Resumo Detalhado */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border"></div>
            <h3 className="text-sm font-semibold">Resumo Detalhado</h3>
            <div className="h-px flex-1 bg-border"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Fase de Acumulação */}
            <div className="p-4 rounded-lg bg-success/10 border-2 border-success">
              <h4 className="text-sm font-bold text-green-700 mb-3">Fase de Acumulação</h4>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-gray-900">
                  {simulationResult.inputData.idadeAtual} aos {simulationResult.inputData.idadeAposentadoria} anos
                </p>
                <div>
                  <p className="text-muted-foreground">Crescimento:</p>
                  <p className="font-semibold text-gray-900">
                    {formatCurrencyCompact(simulationResult.inputData.patrimonioInicial)} → {formatCurrencyCompact(patrimonioTransicao)}
                  </p>
                </div>
                <p className="text-muted-foreground">
                  Período: <span className="font-medium text-gray-900">{simulationResult.anosAcumulacao} anos</span>
                </p>
                <p className="text-muted-foreground">
                  Aportes mensais: <span className="font-medium text-gray-900">{formatCurrency(simulationResult.inputData.aporteMensal)}</span>
                </p>
              </div>
            </div>

            {/* Transição */}
            <div className="p-4 rounded-lg bg-chart-1/10 border-2 border-chart-1">
              <h4 className="text-sm font-bold text-orange-700 mb-3">Transição</h4>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-gray-900">Aos {simulationResult.inputData.idadeAposentadoria} anos</p>
                <div>
                  <p className="text-muted-foreground">Patrimônio:</p>
                  <p className="font-semibold text-gray-900">{formatCurrencyCompact(patrimonioTransicao)}</p>
                </div>
                <p className="text-lg font-bold text-yellow-600 mt-2">
                  Meta Atingível!
                </p>
                <div>
                  <p className="text-muted-foreground">Renda passiva:</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(valorMensalLiquido)}</p>
                </div>
              </div>
            </div>

            {/* Fase de Aposentadoria */}
            <div className={`p-4 rounded-lg border-2 ${
              planoSustentavel ? 'bg-primary/10 border-primary' : 'bg-destructive/10 border-destructive'
            }`}>
              <h4 className={`text-sm font-bold mb-3 ${
                planoSustentavel ? 'text-blue-700' : 'text-red-700'
              }`}>Fase de Aposentadoria</h4>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-gray-900">
                  {planoSustentavel
                    ? `${simulationResult.inputData.idadeAposentadoria} aos ${idadeFinal} anos`
                    : `${simulationResult.inputData.idadeAposentadoria} aos ${idadeFinalReal} anos`
                  }
                </p>
                <p className={`text-lg font-bold ${planoSustentavel ? 'text-green-600' : 'text-red-600'}`}>
                  {planoSustentavel ? "Sustentável!" : "Insustentável!"}
                </p>
                {!planoSustentavel && (
                  <div className="p-2 bg-destructive/20 rounded border border-destructive/40">
                    <p className="text-xs text-red-800 font-semibold">
                      ⚠️ Dinheiro acaba aos {idadeFinalReal} anos
                    </p>
                    <p className="text-xs text-red-700 mt-1">
                      Faltam {anosFaltantes} anos para completar o plano de {simulationResult.inputData.periodoUsufruir} anos
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Patrimônio final:</p>
                  <p className="font-semibold text-gray-900">{formatCurrencyCompact(evolucaoPatrimonio.patrimonioFinal)}</p>
                </div>
                {planoSustentavel && evolucaoPatrimonio.patrimonioFinal > 0 && (
                  <p className="text-xs text-green-700 mt-1">
                    ✓ Sobra de {formatCurrencyCompact(evolucaoPatrimonio.patrimonioFinal)} no final
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé com métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Rendimento anual:</p>
            <p className="text-sm font-bold">{simulationResult.inputData.taxaRealAcumulacao.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Inflação anual:</p>
            <p className="text-sm font-bold">{simulationResult.inputData.previsaoInflacaoAnual.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total investido:</p>
            <p className="text-sm font-bold">{formatCurrencyCompact(simulationResult.capitalInvestido)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Alíquota IR:</p>
            <p className="text-sm font-bold">{simulationResult.inputData.aliquotaIR.toFixed(1)}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
