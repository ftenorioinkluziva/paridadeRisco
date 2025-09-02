import { FinancialDataFetcher } from "../src/server/services/financialDataFetcher";

async function testIPCAExpectativaAPI() {
  console.log("🧪 Testing IPCA Expectativa API from IPEADATA...\n");
  
  const fetcher = new FinancialDataFetcher();
  
  try {
    // Test IPCA Expectativa API
    console.log("📈 Fetching IPCA Expectativa data from IPEADATA API");
    const ipcaExpData = await fetcher.fetchIPCAExpectativaData();
    
    if (ipcaExpData) {
      console.log(`✅ Success! Got ${ipcaExpData.historicalData.length} records for ${ipcaExpData.name}`);
      console.log(`   Current Expectation: ${ipcaExpData.currentPrice?.toFixed(4)}%`);
      console.log(`   Latest Date: ${ipcaExpData.historicalData[ipcaExpData.historicalData.length - 1]?.date.toISOString().split('T')[0]}`);
      console.log(`   Oldest Date: ${ipcaExpData.historicalData[0]?.date.toISOString().split('T')[0]}`);
      
      // Show last 5 records
      console.log(`\n📊 Last 5 IPCA Expectativa records:`);
      const lastRecords = ipcaExpData.historicalData.slice(-5);
      lastRecords.forEach(record => {
        const dateStr = record.date.toISOString().split('T')[0];
        const changeStr = record.percentageChange ? ` (${record.percentageChange > 0 ? '+' : ''}${record.percentageChange.toFixed(2)}%)` : '';
        console.log(`   ${dateStr}: ${record.price?.toFixed(4)}%${changeStr}`);
      });
      
      // Compare with historical trends
      if (ipcaExpData.historicalData.length >= 12) {
        const recent = ipcaExpData.historicalData.slice(-12);
        const avgRecent = recent.reduce((sum, r) => sum + (r.price || 0), 0) / recent.length;
        console.log(`\n📈 Average expectation (last 12 months): ${avgRecent.toFixed(4)}%`);
      }
      
    } else {
      console.log("❌ Failed to fetch IPCA Expectativa data");
    }

    console.log("\n" + "=".repeat(50));
    console.log("✅ IPCA Expectativa API test completed!");

  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

// Run the test
testIPCAExpectativaAPI().then(() => {
  console.log("\n🎉 Test finished!");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Test crashed:", error);
  process.exit(1);
});