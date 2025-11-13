/**
 * Script para limpar todos os dados históricos do CDI
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanCDIData() {
  console.log('🧹 Iniciando limpeza dos dados do CDI...\n');

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

    // 2. Contar registros antes de deletar
    const count = await prisma.dadoHistorico.count({
      where: { ativoId: cdiAtivo.id },
    });

    console.log(`📊 Registros a deletar: ${count}`);

    // 3. Deletar todos os registros históricos do CDI
    const deleteResult = await prisma.dadoHistorico.deleteMany({
      where: { ativoId: cdiAtivo.id },
    });

    console.log(`✅ Deletados ${deleteResult.count} registros do CDI\n`);

    // 4. Verificar se limpeza foi completa
    const remainingCount = await prisma.dadoHistorico.count({
      where: { ativoId: cdiAtivo.id },
    });

    if (remainingCount === 0) {
      console.log('✅ Limpeza completa! Nenhum registro restante.\n');
    } else {
      console.log(`⚠️  Ainda restam ${remainingCount} registros\n`);
    }

    console.log('🎉 Limpeza concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar limpeza
cleanCDIData()
  .then(() => {
    console.log('\n✅ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falhou:', error);
    process.exit(1);
  });
