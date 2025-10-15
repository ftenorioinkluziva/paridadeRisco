import { FinancialDataFetcher } from "../src/server/services/financialDataFetcher";

async function updateIPCAOnly() {
  console.log("🚀 Starting IPCA-only update...\n");
  
  const fetcher = new FinancialDataFetcher();
  
  try {
    console.log("📈 Processing IPCA (Inflação)...");
    await fetcher.updateSpecificAsset('IPCA');
    
    console.log("\n✅ IPCA update completed successfully!");
    console.log("\n📊 IPCA data has been saved to the database.");
    
  } catch (error) {
    console.error("❌ IPCA update failed:", error);
    process.exit(1);
  }
}

// Run the update
updateIPCAOnly().then(() => {
  console.log("\n🎉 Update process finished!");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Update process crashed:", error);
  process.exit(1);
});