import { FinancialDataFetcher } from "~/server/services/financialDataFetcher";
import cron from "node-cron";

class FinancialScheduler {
  private fetcher: FinancialDataFetcher;
  private isRunning = false;

  constructor() {
    this.fetcher = new FinancialDataFetcher();
  }

  start() {
    if (this.isRunning) {
      console.log("⚠️ Financial scheduler is already running");
      return;
    }

    console.log("🚀 Starting financial data scheduler...");
    this.isRunning = true;

    // Update data every day at 6 PM (18:00) on weekdays only
    cron.schedule('0 18 * * 1-5', async () => {
      console.log("⏰ Starting scheduled financial data update...");
      try {
        await this.fetcher.updateAllAssets(true); // Incremental update
        console.log("✅ Scheduled financial data update completed successfully");
      } catch (error) {
        console.error("❌ Scheduled financial data update failed:", error);
      }
    }, {
      scheduled: true,
      timezone: "America/Sao_Paulo"
    });

    // Update data every Monday at 8 AM (complete update)
    cron.schedule('0 8 * * 1', async () => {
      console.log("⏰ Starting weekly complete financial data update...");
      try {
        await this.fetcher.updateAllAssets(false); // Complete update
        console.log("✅ Weekly financial data update completed successfully");
      } catch (error) {
        console.error("❌ Weekly financial data update failed:", error);
      }
    }, {
      scheduled: true,
      timezone: "America/Sao_Paulo"
    });

    console.log("✅ Financial data scheduler started");
    console.log("📅 Daily updates: Weekdays at 6 PM");
    console.log("📅 Weekly complete updates: Mondays at 8 AM");
  }

  stop() {
    if (!this.isRunning) {
      console.log("⚠️ Financial scheduler is not running");
      return;
    }

    cron.destroy();
    this.isRunning = false;
    console.log("🛑 Financial data scheduler stopped");
  }

  async runUpdate(incremental = true) {
    console.log(`🔄 Running ${incremental ? 'incremental' : 'complete'} financial data update...`);
    
    try {
      await this.fetcher.updateAllAssets(incremental);
      console.log("✅ Manual financial data update completed successfully");
    } catch (error) {
      console.error("❌ Manual financial data update failed:", error);
      throw error;
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      nextRuns: cron.getTasks().size > 0 ? [
        "Daily: Weekdays at 6 PM (Brazil time)",
        "Weekly: Mondays at 8 AM (Brazil time)"
      ] : []
    };
  }
}

// Singleton instance
let schedulerInstance: FinancialScheduler | null = null;

export function getFinancialScheduler(): FinancialScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new FinancialScheduler();
  }
  return schedulerInstance;
}

// Auto-start in production
if (process.env.NODE_ENV === 'production') {
  const scheduler = getFinancialScheduler();
  scheduler.start();
}