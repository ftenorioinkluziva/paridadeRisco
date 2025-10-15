import { FinancialDataFetcher } from './financialDataFetcher';

async function testCryptoFetcher() {
  console.log('🧪 Testing Cryptocurrency Data Fetcher\n');

  const fetcher = new FinancialDataFetcher();

  // Test with Bitcoin (last 7 days for faster testing)
  const ticker = 'BTC-USD';
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7); // Last 7 days

  console.log(`📊 Fetching ${ticker} data from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}\n`);

  try {
    const cryptoData = await fetcher.fetchCryptoData(ticker, startDate, endDate);

    if (cryptoData) {
      console.log('✅ Success! Crypto data fetched and converted to BRL\n');
      console.log(`📈 Asset: ${cryptoData.name} (${cryptoData.ticker})`);
      console.log(`🏷️  Type: ${cryptoData.type}`);
      console.log(`💰 Current Price (BRL): R$ ${cryptoData.currentPrice?.toFixed(2)}`);
      console.log(`📊 Historical Records: ${cryptoData.historicalData.length}`);

      if (cryptoData.historicalData.length > 0) {
        console.log('\n📅 Sample Data (first 3 records):');
        cryptoData.historicalData.slice(0, 3).forEach((record, index) => {
          console.log(`\n  ${index + 1}. Date: ${record.date.toISOString().split('T')[0]}`);
          console.log(`     Price: R$ ${record.price?.toFixed(2)}`);
          console.log(`     Change: ${record.percentageChange?.toFixed(2)}%`);
        });

        console.log('\n📅 Last record:');
        const lastRecord = cryptoData.historicalData[cryptoData.historicalData.length - 1];
        console.log(`   Date: ${lastRecord.date.toISOString().split('T')[0]}`);
        console.log(`   Price: R$ ${lastRecord.price?.toFixed(2)}`);
        console.log(`   Change: ${lastRecord.percentageChange?.toFixed(2)}%`);
      }

      console.log('\n✅ Test completed successfully!');
      console.log('\n💡 Next steps:');
      console.log('   1. Run: npx tsx prisma/seed.ts (to add cryptos to database)');
      console.log('   2. Or manually test update: await fetcher.updateSpecificAsset("BTC-USD")');

    } else {
      console.error('❌ Failed to fetch crypto data');
    }

  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

// Run the test
testCryptoFetcher()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
