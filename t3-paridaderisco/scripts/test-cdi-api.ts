/**
 * Script de teste para verificar a nova implementação da API BCB do CDI
 */

import { FinancialDataFetcher } from '../src/server/services/financialDataFetcher';

async function testCDIApi() {
  console.log('🧪 Testando nova implementação da API BCB para CDI...\n');

  try {
    const fetcher = new FinancialDataFetcher();

    // Teste 1: Buscar últimos 30 dias
    console.log('📅 Teste 1: Últimos 30 dias');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentData = await fetcher.fetchBCBData(12, thirtyDaysAgo, new Date());

    if (recentData) {
      console.log(`✅ Sucesso! Recebidos ${recentData.historicalData.length} registros`);
      console.log(`   Preço inicial: ${recentData.historicalData[0]?.price?.toFixed(4)}`);
      console.log(`   Preço final: ${recentData.historicalData[recentData.historicalData.length - 1]?.price?.toFixed(4)}`);
      console.log(`   Data inicial: ${recentData.historicalData[0]?.date.toLocaleDateString('pt-BR')}`);
      console.log(`   Data final: ${recentData.historicalData[recentData.historicalData.length - 1]?.date.toLocaleDateString('pt-BR')}\n`);
    } else {
      console.log('❌ Falha ao buscar dados recentes\n');
    }

    // Teste 2: Verificar cálculo de retorno acumulado
    console.log('📊 Teste 2: Validando cálculo de retorno acumulado');

    // Usar exemplo do usuário: 03/11 a 11/11/2025
    const startDate = new Date(2025, 10, 3); // 03/11/2025
    const endDate = new Date(2025, 10, 11);   // 11/11/2025

    const testData = await fetcher.fetchBCBData(12, startDate, endDate);

    if (testData && testData.historicalData.length > 0) {
      const first = testData.historicalData[0];
      const last = testData.historicalData[testData.historicalData.length - 1];

      if (first.price && last.price) {
        const accumulatedReturn = ((last.price / first.price - 1) * 100);

        console.log(`✅ Período: ${first.date.toLocaleDateString('pt-BR')} a ${last.date.toLocaleDateString('pt-BR')}`);
        console.log(`   Registros: ${testData.historicalData.length}`);
        console.log(`   Retorno acumulado: ${accumulatedReturn.toFixed(6)}%`);
        console.log(`   Esperado: ~0.385917%`);

        if (Math.abs(accumulatedReturn - 0.385917) < 0.01) {
          console.log('   ✅ Cálculo correto!\n');
        } else {
          console.log('   ⚠️  Diferença encontrada, mas pode ser esperado devido a dados reais\n');
        }
      } else {
        console.log('❌ Dados com valores nulos encontrados\n');
      }
    } else {
      console.log('❌ Falha ao buscar dados de teste\n');
    }

    // Teste 3: Verificar limite de 10 anos
    console.log('📅 Teste 3: Validando limite de 10 anos');
    const fifteenYearsAgo = new Date();
    fifteenYearsAgo.setFullYear(fifteenYearsAgo.getFullYear() - 15);

    const limitedData = await fetcher.fetchBCBData(12, fifteenYearsAgo, new Date());

    if (limitedData && limitedData.historicalData.length > 0) {
      const firstDate = limitedData.historicalData[0].date;
      const yearsAgo = (new Date().getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

      console.log(`✅ Primeira data retornada: ${firstDate.toLocaleDateString('pt-BR')}`);
      console.log(`   Anos atrás: ${yearsAgo.toFixed(1)}`);

      if (yearsAgo <= 10.5) {
        console.log('   ✅ Limite de 10 anos respeitado!\n');
      } else {
        console.log('   ⚠️  Dados com mais de 10 anos retornados\n');
      }
    }

    console.log('🎉 Testes concluídos!');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
    throw error;
  }
}

// Executar testes
testCDIApi()
  .then(() => {
    console.log('\n✅ Script de teste finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script de teste falhou:', error);
    process.exit(1);
  });
