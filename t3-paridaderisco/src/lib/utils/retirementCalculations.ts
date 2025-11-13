/**
 * Calcula a evolução ano a ano do patrimônio durante acumulação e aposentadoria
 */
export function calcularEvolucaoPatrimonio(params: {
  idadeAtual: number;
  patrimonioInicial: number;
  aporteMensal: number;
  idadeAposentadoria: number;
  periodoUsufruir: number;
  previsaoInflacaoAnual: number;
  taxaRealAcumulacao: number;
  taxaRealAposentadoria: number;
  valorReceberAnualDesejado: number;
  aliquotaIR: number;
}) {
  const {
    idadeAtual,
    patrimonioInicial,
    aporteMensal,
    idadeAposentadoria,
    periodoUsufruir,
    previsaoInflacaoAnual,
    taxaRealAcumulacao,
    taxaRealAposentadoria,
    valorReceberAnualDesejado,
    aliquotaIR,
  } = params;

  const anosAcumulacao = idadeAposentadoria - idadeAtual;
  const taxaInflacaoDecimal = previsaoInflacaoAnual / 100;
  const taxaRealAcumulacaoDecimal = taxaRealAcumulacao / 100;
  const taxaRealAposentadoriaDecimal = taxaRealAposentadoria / 100;
  const aliquotaIRDecimal = aliquotaIR / 100;

  const evolucao: Array<{
    idade: number;
    ano: number;
    patrimonio: number;
    fase: 'acumulacao' | 'aposentadoria';
    aporteAcumulado: number;
    rendimentos: number;
  }> = [];

  // Fase de Acumulação
  let patrimonioAtual = patrimonioInicial;
  let aporteAcumulado = patrimonioInicial;

  for (let ano = 0; ano <= anosAcumulacao; ano++) {
    const idade = idadeAtual + ano;

    evolucao.push({
      idade,
      ano,
      patrimonio: patrimonioAtual,
      fase: 'acumulacao',
      aporteAcumulado,
      rendimentos: patrimonioAtual - aporteAcumulado,
    });

    // Aplicar rendimento anual
    patrimonioAtual = patrimonioAtual * (1 + taxaRealAcumulacaoDecimal);

    // Adicionar aportes mensais (se não for o último ano)
    if (ano < anosAcumulacao) {
      patrimonioAtual += aporteMensal * 12;
      aporteAcumulado += aporteMensal * 12;
    }
  }

  // Fase de Aposentadoria
  const capitalInvestido = aporteAcumulado;
  const patrimonioInicioAposentadoria = patrimonioAtual;

  for (let ano = 1; ano <= periodoUsufruir; ano++) {
    const idade = idadeAposentadoria + ano;

    // Aplicar rendimento anual PRIMEIRO (no patrimônio do início do ano)
    patrimonioAtual = patrimonioAtual * (1 + taxaRealAposentadoriaDecimal);

    // Calcular valor do saque anual corrigido pela inflação
    const valorAnualCorrigido = valorReceberAnualDesejado * Math.pow(1 + taxaInflacaoDecimal, anosAcumulacao + ano - 1);

    // Proporção de rendimentos no patrimônio atual
    const proporcaoRendimentos = Math.max(0, Math.min(1, (patrimonioAtual - capitalInvestido) / patrimonioAtual));

    // Calcular saque bruto considerando IR sobre rendimentos
    const fatorAjusteIR = 1 - (proporcaoRendimentos * aliquotaIRDecimal);
    const valorSaqueBruto = valorAnualCorrigido / fatorAjusteIR;

    // Realizar saque DEPOIS (no final do ano)
    patrimonioAtual -= valorSaqueBruto;

    evolucao.push({
      idade,
      ano: anosAcumulacao + ano,
      patrimonio: Math.max(0, patrimonioAtual),
      fase: 'aposentadoria',
      aporteAcumulado: capitalInvestido,
      rendimentos: Math.max(0, patrimonioAtual - capitalInvestido),
    });

    // Parar se patrimônio acabou
    if (patrimonioAtual <= 0) break;
  }

  return {
    evolucao,
    patrimonioInicial,
    patrimonioMaximo: Math.max(...evolucao.map(e => e.patrimonio)),
    patrimonioFinal: evolucao[evolucao.length - 1]?.patrimonio || 0,
    idadeInicioAposentadoria: idadeAposentadoria,
  };
}

/**
 * Calcula a evolução da renda durante a aposentadoria
 */
export function calcularEvolucaoRenda(params: {
  valorReceberAnualDesejado: number;
  periodoUsufruir: number;
  idadeAposentadoria: number;
  idadeAtual: number;
  previsaoInflacaoAnual: number;
}) {
  const {
    valorReceberAnualDesejado,
    periodoUsufruir,
    idadeAposentadoria,
    idadeAtual,
    previsaoInflacaoAnual,
  } = params;

  const anosAcumulacao = idadeAposentadoria - idadeAtual;
  const taxaInflacaoDecimal = previsaoInflacaoAnual / 100;

  const evolucaoRenda: Array<{
    idade: number;
    ano: number;
    rendaBruta: number;
    rendaLiquida: number;
  }> = [];

  for (let ano = 1; ano <= periodoUsufruir; ano++) {
    const idade = idadeAposentadoria + ano;

    // Renda líquida desejada (em valor de hoje)
    const rendaLiquida = valorReceberAnualDesejado;

    // Renda bruta corrigida pela inflação (valor nominal futuro)
    const rendaBruta = valorReceberAnualDesejado * Math.pow(1 + taxaInflacaoDecimal, anosAcumulacao + ano - 1);

    evolucaoRenda.push({
      idade,
      ano,
      rendaBruta,
      rendaLiquida,
    });
  }

  const rendaInicial = evolucaoRenda[0]?.rendaBruta || 0;
  const rendaFinal = evolucaoRenda[evolucaoRenda.length - 1]?.rendaBruta || 0;
  const crescimento = rendaInicial > 0 ? ((rendaFinal - rendaInicial) / rendaInicial) * 100 : 0;

  return {
    evolucaoRenda,
    rendaInicial,
    rendaFinal,
    crescimento,
  };
}
