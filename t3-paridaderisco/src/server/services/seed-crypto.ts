import { FinancialDataFetcher } from './financialDataFetcher';

async function seedCryptocurrencies() {
  console.log('🚀 Starting cryptocurrency data seeding...\n');

  const fetcher = new FinancialDataFetcher();
  const cryptoTickers = ['BTC-USD', 'ETH-USD', 'BNB-USD'];

  // Fetch last 30 days for initial seed
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  console.log(`📅 Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}\n`);

  for (const ticker of cryptoTickers) {
    try {
      console.log(`\n📊 Processing ${ticker}...`);

      const cryptoData = await fetcher.fetchCryptoData(ticker, startDate, endDate);

      if (cryptoData && cryptoData.historicalData.length > 0) {
        console.log(`   ✓ Fetched ${cryptoData.historicalData.length} records`);
        console.log(`   ✓ Current price: R$ ${cryptoData.currentPrice?.toFixed(2)}`);

        // Save to database
        await fetcher.upsertAsset(cryptoData);
        console.log(`   ✅ Successfully saved ${ticker} to database`);
      } else {
        console.log(`   ❌ No data available for ${ticker}`);
      }

    } catch (error) {
      console.error(`   ❌ Error processing ${ticker}:`, error);
    }
  }

  console.log('\n✅ Cryptocurrency seeding completed!');
  console.log('\n💡 You can now use these cryptos in your portfolio');
  console.log('   - Bitcoin (BTC-USD)');
  console.log('   - Ethereum (ETH-USD)');
  console.log('   - Binance Coin (BNB-USD)');
}

// Run the seed
seedCryptocurrencies()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
