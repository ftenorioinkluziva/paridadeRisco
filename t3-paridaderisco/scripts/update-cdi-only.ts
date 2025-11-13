/**
 * Script para atualizar apenas os dados do CDI com a nova API real do BCB
 */

import { FinancialDataFetcher } from '../src/server/services/financialDataFetcher';

async function updateCDI() {
  console.log('🚀 Iniciando atualização do CDI com API real do BCB...\n');

  try {
    const fetcher = new FinancialDataFetcher();

    // Deletar dados antigos sintéticos e buscar todos os dados reais
    console.log('📊 Buscando dados do CDI...\n');

    // Buscar últimos 10 anos (máximo permitido pela API)
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

    await fetcher.updateSpecificAsset('CDI', tenYearsAgo, new Date());

    console.log('\n✅ CDI atualizado com sucesso com dados reais da API BCB!');

  } catch (error) {
    console.error('❌ Erro durante a atualização:', error);
    throw error;
  }
}

// Executar atualização
updateCDI()
  .then(() => {
    console.log('\n✅ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falhou:', error);
    process.exit(1);
  });
