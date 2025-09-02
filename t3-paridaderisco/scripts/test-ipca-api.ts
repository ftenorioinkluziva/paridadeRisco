import { FinancialDataFetcher } from "../src/server/services/financialDataFetcher";

async function testIPCAAPI() {
  console.log("🧪 Testing IPCA API from BCB...\n");
  
  const fetcher = new FinancialDataFetcher();
  
  try {
    // Test IPCA API
    console.log("📈 Fetching IPCA data from BCB API");
    const ipcaData = await fetcher.fetchIPCAData();
    
    if (ipcaData) {
      console.log(`✅ Success! Got ${ipcaData.historicalData.length} records for ${ipcaData.name}`);
      console.log(`   Current Rate: ${ipcaData.currentPrice?.toFixed(4)}%`);
      console.log(`   Latest Date: ${ipcaData.historicalData[ipcaData.historicalData.length - 1]?.date.toISOString().split('T')[0]}`);
      console.log(`   Oldest Date: ${ipcaData.historicalData[0]?.date.toISOString().split('T')[0]}`);
      
      // Show last 5 records
      console.log(`\n📊 Last 5 IPCA records:`);
      const lastRecords = ipcaData.historicalData.slice(-5);
      lastRecords.forEach(record => {
        const dateStr = record.date.toISOString().split('T')[0];
        console.log(`   ${dateStr}: ${record.price?.toFixed(4)}%`);
      });
      
    } else {
      console.log("❌ Failed to fetch IPCA data");
    }

    console.log("\n" + "=".repeat(50));
    console.log("✅ IPCA API test completed!");

  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

// Run the test
testIPCAAPI().then(() => {
  console.log("\n🎉 Test finished!");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Test crashed:", error);
  process.exit(1);
});