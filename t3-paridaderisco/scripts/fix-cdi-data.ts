/**
 * Script para corrigir dados duplicados e resetados do CDI
 *
 * Problema: CDI tem registros duplicados por dia e valores que resetam para 100
 * Solução:
 * 1. Remover duplicatas (manter apenas 1 registro por dia)
 * 2. Recalcular índice acumulado corretamente
 * 3. Garantir crescimento contínuo a partir da base 100
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixCDIData() {
  console.log('🔧 Iniciando correção dos dados do CDI...\n');

  try {
    // 1. Buscar o ativo CDI
    const cdiAtivo = await prisma.ativo.findFirst({
      where: { ticker: 'CDI' },
    });

    if (!cdiAtivo) {
      console.error('❌ Ativo CDI não encontrado!');
      return;
    }

    console.log(`✅ CDI encontrado: ${cdiAtivo.id}\n`);

    // 2. Buscar todos os dados históricos do CDI
    const allData = await prisma.dadoHistorico.findMany({
      where: { ativoId: cdiAtivo.id },
      orderBy: { date: 'asc' },
    });

    console.log(`📊 Total de registros encontrados: ${allData.length}`);

    // 3. Agrupar por data (apenas a data, sem hora)
    const groupedByDate = new Map<string, typeof allData>();

    for (const record of allData) {
      const dateKey = record.date.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!groupedByDate.has(dateKey!)) {
        groupedByDate.set(dateKey!, []);
      }

      groupedByDate.get(dateKey!)!.push(record);
    }

    console.log(`📅 Datas únicas: ${groupedByDate.size}`);

    // 4. Identificar duplicatas
    let duplicatesCount = 0;
    const duplicateDates: string[] = [];

    for (const [dateKey, records] of groupedByDate.entries()) {
      if (records.length > 1) {
        duplicatesCount += records.length - 1;
        duplicateDates.push(dateKey);
      }
    }

    console.log(`🔄 Duplicatas encontradas: ${duplicatesCount} registros em ${duplicateDates.length} datas`);

    if (duplicateDates.length > 0) {
      console.log(`   Primeiras datas com duplicatas: ${duplicateDates.slice(0, 5).join(', ')}\n`);
    }

    // 5. Para cada data, manter apenas o registro com maior price (índice acumulado)
    const idsToKeep: string[] = [];
    const idsToDelete: string[] = [];

    for (const [dateKey, records] of groupedByDate.entries()) {
      if (records.length === 1) {
        // Sem duplicatas, manter o único registro
        idsToKeep.push(records[0]!.id);
      } else {
        // Com duplicatas, manter o de maior price (índice acumulado correto)
        const sorted = records.sort((a, b) => {
          const priceA = a.price?.toNumber() || 0;
          const priceB = b.price?.toNumber() || 0;
          return priceB - priceA; // Decrescente
        });

        idsToKeep.push(sorted[0]!.id);
        idsToDelete.push(...sorted.slice(1).map(r => r.id));
      }
    }

    console.log(`✅ Registros a manter: ${idsToKeep.length}`);
    console.log(`🗑️  Registros a deletar: ${idsToDelete.length}\n`);

    // 6. Deletar duplicatas
    if (idsToDelete.length > 0) {
      const deleteResult = await prisma.dadoHistorico.deleteMany({
        where: {
          id: { in: idsToDelete },
        },
      });

      console.log(`✅ Deletados ${deleteResult.count} registros duplicados\n`);
    }

    // 7. Buscar dados limpos e verificar a continuidade do índice
    const cleanData = await prisma.dadoHistorico.findMany({
      where: { ativoId: cdiAtivo.id },
      orderBy: { date: 'asc' },
    });

    console.log(`📊 Registros após limpeza: ${cleanData.length}\n`);

    // 8. Verificar e corrigir valores que resetaram
    let resets = 0;
    const updates: Array<{ id: string; newPrice: number }> = [];

    // O índice CDI deve sempre crescer. Se um valor for menor que o anterior, está errado.
    let lastValidPrice = cleanData[0]?.price?.toNumber() || 100;

    for (let i = 1; i < cleanData.length; i++) {
      const current = cleanData[i]!;
      const currentPrice = current.price?.toNumber() || 0;
      const percentageChange = current.percentageChange?.toNumber() || 0;

      // Se o preço atual é menor que o anterior, houve um reset
      if (currentPrice < lastValidPrice) {
        resets++;

        // Calcular o preço correto aplicando o percentageChange ao último valor válido
        const correctPrice = lastValidPrice * (1 + percentageChange / 100);

        updates.push({
          id: current.id,
          newPrice: correctPrice,
        });

        lastValidPrice = correctPrice;
      } else {
        lastValidPrice = currentPrice;
      }
    }

    console.log(`🔄 Resets detectados: ${resets}`);
    console.log(`📝 Atualizações necessárias: ${updates.length}\n`);

    // 9. Aplicar correções
    if (updates.length > 0) {
      console.log('🔧 Aplicando correções...');

      for (const update of updates) {
        await prisma.dadoHistorico.update({
          where: { id: update.id },
          data: { price: update.newPrice },
        });
      }

      console.log(`✅ ${updates.length} registros corrigidos\n`);
    }

    // 10. Verificação final
    const finalData = await prisma.dadoHistorico.findMany({
      where: { ativoId: cdiAtivo.id },
      orderBy: { date: 'asc' },
    });

    console.log('📊 Verificação final:');
    console.log(`   Total de registros: ${finalData.length}`);

    const firstRecord = finalData[0];
    const lastRecord = finalData[finalData.length - 1];

    if (firstRecord && lastRecord) {
      console.log(`   Primeiro registro: ${firstRecord.date.toLocaleDateString('pt-BR')} - R$ ${firstRecord.price?.toFixed(2)}`);
      console.log(`   Último registro: ${lastRecord.date.toLocaleDateString('pt-BR')} - R$ ${lastRecord.price?.toFixed(2)}`);

      const totalReturn = ((lastRecord.price?.toNumber() || 0) / (firstRecord.price?.toNumber() || 1) - 1) * 100;
      console.log(`   Retorno acumulado: ${totalReturn.toFixed(2)}%`);
    }

    // Verificar se ainda há valores que resetam
    let stillHasResets = false;
    for (let i = 1; i < finalData.length; i++) {
      const prev = finalData[i - 1]!.price?.toNumber() || 0;
      const curr = finalData[i]!.price?.toNumber() || 0;

      if (curr < prev) {
        stillHasResets = true;
        break;
      }
    }

    if (stillHasResets) {
      console.log('\n⚠️  ATENÇÃO: Ainda existem valores que resetam!');
    } else {
      console.log('\n✅ Índice CDI agora está contínuo e crescente!');
    }

    console.log('\n🎉 Correção concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
fixCDIData()
  .then(() => {
    console.log('\n✅ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falhou:', error);
    process.exit(1);
  });
