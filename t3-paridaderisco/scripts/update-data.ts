import { FinancialDataFetcher } from "../src/server/services/financialDataFetcher";

async function updateFinancialData() {
  console.log("🚀 Starting complete financial data update...\n");
  
  const fetcher = new FinancialDataFetcher();
  
  try {
    // Run a complete update (not incremental)
    await fetcher.updateAllAssets(false);
    
    console.log("\n✅ Financial data update completed successfully!");
    console.log("\n📊 You can now view the updated data in the application.");
    
  } catch (error) {
    console.error("❌ Financial data update failed:", error);
    process.exit(1);
  }
}

// Run the update
updateFinancialData().then(() => {
  console.log("\n🎉 Update process finished!");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Update process crashed:", error);
  process.exit(1);
});