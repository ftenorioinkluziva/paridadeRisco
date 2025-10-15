import { FinancialDataFetcher } from "../src/server/services/financialDataFetcher";

async function testFinancialAPI() {
  console.log("🧪 Testing Financial Data API...\n");
  
  const fetcher = new FinancialDataFetcher();
  
  try {
    // Test 1: Test Yahoo Finance API with a Brazilian stock
    console.log("📈 Test 1: Fetching BOVA11.SA data from Yahoo Finance");
    const bovaData = await fetcher.fetchYahooFinanceData("BOVA11.SA");
    
    if (bovaData) {
      console.log(`✅ Success! Got ${bovaData.historicalData.length} records for ${bovaData.name}`);
      console.log(`   Current Price: R$ ${bovaData.currentPrice?.toFixed(2)}`);
      console.log(`   Latest Date: ${bovaData.historicalData[bovaData.historicalData.length - 1]?.date.toISOString().split('T')[0]}`);
    } else {
      console.log("❌ Failed to fetch BOVA11.SA data");
    }

    console.log("\n" + "=".repeat(50) + "\n");

    // Test 2: Test BCB API for CDI
    console.log("🏦 Test 2: Fetching CDI data from BCB");
    const cdiData = await fetcher.fetchBCBData();
    
    if (cdiData) {
      console.log(`✅ Success! Got ${cdiData.historicalData.length} records for ${cdiData.name}`);
      console.log(`   Current Index: ${cdiData.currentPrice?.toFixed(4)}`);
      console.log(`   Latest Date: ${cdiData.historicalData[cdiData.historicalData.length - 1]?.date.toISOString().split('T')[0]}`);
    } else {
      console.log("❌ Failed to fetch CDI data");
    }

    console.log("\n" + "=".repeat(50) + "\n");

    // Test 3: Test USD/BRL currency pair
    console.log("💱 Test 3: Fetching USD/BRL data from Yahoo Finance");
    const usdData = await fetcher.fetchYahooFinanceData("USDBRL=X");
    
    if (usdData) {
      console.log(`✅ Success! Got ${usdData.historicalData.length} records for ${usdData.name}`);
      console.log(`   Current Rate: R$ ${usdData.currentPrice?.toFixed(4)}`);
      console.log(`   Latest Date: ${usdData.historicalData[usdData.historicalData.length - 1]?.date.toISOString().split('T')[0]}`);
    } else {
      console.log("❌ Failed to fetch USD/BRL data");
    }

    console.log("\n" + "=".repeat(50) + "\n");
    console.log("✅ All tests completed!");

  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

// Run the test
testFinancialAPI().then(() => {
  console.log("\n🎉 Test suite finished!");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Test suite crashed:", error);
  process.exit(1);
});