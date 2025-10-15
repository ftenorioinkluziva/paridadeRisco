import { FinancialDataFetcher } from "../src/server/services/financialDataFetcher";

async function updateIPCAExpectativaOnly() {
  console.log("🚀 Starting IPCA Expectativa-only update...\n");
  
  const fetcher = new FinancialDataFetcher();
  
  try {
    console.log("📈 Processing IPCA Expectativa 12M...");
    await fetcher.updateSpecificAsset('IPCA_EXP');
    
    console.log("\n✅ IPCA Expectativa update completed successfully!");
    console.log("\n📊 IPCA Expectativa data has been saved to the database.");
    
  } catch (error) {
    console.error("❌ IPCA Expectativa update failed:", error);
    process.exit(1);
  }
}

// Run the update
updateIPCAExpectativaOnly().then(() => {
  console.log("\n🎉 Update process finished!");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Update process crashed:", error);
  process.exit(1);
});