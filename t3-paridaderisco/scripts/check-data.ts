import { prisma } from "../src/lib/prisma";

async function checkData() {
  console.log("🔍 Verificando dados no banco...\n");
  
  try {
    // Count assets
    const assetCount = await prisma.ativo.count();
    console.log(`📊 Total de ativos: ${assetCount}`);

    // Get detailed stats per asset
    const assets = await prisma.ativo.findMany({
      include: {
        dadosHistoricos: true,
      },
    });

    console.log("\n📈 Dados por ativo:");
    console.log("=" .repeat(60));

    for (const asset of assets) {
      const latestData = await prisma.dadoHistorico.findFirst({
        where: { ativoId: asset.id },
        orderBy: { date: 'desc' },
      });

      console.log(`${asset.ticker.padEnd(12)} | ${asset.name.padEnd(25)} | ${asset.dadosHistoricos.length.toString().padStart(6)} registros | Último: ${latestData?.date.toISOString().split('T')[0] || 'N/A'}`);
    }

    const totalHistoricalRecords = await prisma.dadoHistorico.count();
    console.log("=" .repeat(60));
    console.log(`📊 Total de registros históricos: ${totalHistoricalRecords}`);

    // Test financial data ranges
    console.log("\n🎯 Amostras de dados:");
    const sampleData = await prisma.dadoHistorico.findMany({
      take: 3,
      include: {
        ativo: {
          select: { ticker: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    sampleData.forEach(record => {
      console.log(`${record.ativo.ticker}: ${record.date.toISOString().split('T')[0]} - R$ ${record.price?.toFixed(2)}`);
    });

  } catch (error) {
    console.error("❌ Erro ao verificar dados:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData().then(() => {
  console.log("\n✅ Verificação concluída!");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Erro:", error);
  process.exit(1);
});