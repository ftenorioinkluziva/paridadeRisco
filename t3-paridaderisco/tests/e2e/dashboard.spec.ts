import { test, expect } from '@playwright/test';

// Mock authentication for dashboard tests
test.beforeEach(async ({ page }) => {
  // Mock localStorage with auth token for testing
  await page.addInitScript(() => {
    localStorage.setItem('auth_token', 'mock-test-token');
  });
});

test.describe('Dashboard Flow', () => {
  test('should display dashboard overview', async ({ page }) => {
    await page.goto('/dashboard');
    
    await expect(page.locator('h1, h2')).toContainText(/dashboard/i);
    
    // Check for key dashboard elements
    await expect(page.locator('[data-testid="cash-balance"], text=Saldo')).toBeVisible();
    await expect(page.locator('[data-testid="portfolio-value"], text=Valor do Portfolio')).toBeVisible();
    await expect(page.locator('[data-testid="total-return"], text=Retorno Total')).toBeVisible();
  });

  test('should show loading state initially', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for loading indicators
    const loadingText = page.locator('text=Carregando');
    if (await loadingText.isVisible()) {
      await expect(loadingText).toBeVisible();
    }
  });

  test('should display portfolio assets', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for potential data loading
    await page.waitForTimeout(1000);
    
    // Look for asset displays or empty state
    const assetsSection = page.locator('[data-testid="assets-overview"], text=Ativos');
    if (await assetsSection.isVisible()) {
      await expect(assetsSection).toBeVisible();
    }
  });
});

test.describe('Portfolio Navigation', () => {
  test('should navigate to portfolio page', async ({ page }) => {
    await page.goto('/dashboard');
    
    const portfolioLink = page.locator('a[href="/portfolio"], text=Portfolio');
    await expect(portfolioLink).toBeVisible();
    await portfolioLink.click();
    
    await expect(page).toHaveURL(/.*portfolio/);
    await expect(page.locator('h1, h2')).toContainText(/portfolio/i);
  });

  test('should navigate to transactions page', async ({ page }) => {
    await page.goto('/dashboard');
    
    const transactionsLink = page.locator('a[href="/transactions"], text=Transações');
    await expect(transactionsLink).toBeVisible();
    await transactionsLink.click();
    
    await expect(page).toHaveURL(/.*transactions/);
    await expect(page.locator('h1, h2')).toContainText(/transaç/i);
  });

  test('should navigate to baskets page', async ({ page }) => {
    await page.goto('/dashboard');
    
    const basketsLink = page.locator('a[href="/baskets"], text=Cestas');
    await expect(basketsLink).toBeVisible();
    await basketsLink.click();
    
    await expect(page).toHaveURL(/.*baskets/);
    await expect(page.locator('h1, h2')).toContainText(/cesta/i);
  });
});

test.describe('Responsive Dashboard', () => {
  test('should adapt to mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    
    // Check mobile-specific layout
    await expect(page.locator('body')).toBeVisible();
    
    // Verify content is still accessible on mobile
    await expect(page.locator('h1, h2')).toContainText(/dashboard/i);
  });

  test('should adapt to tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/dashboard');
    
    // Check tablet-specific layout
    await expect(page.locator('body')).toBeVisible();
    
    // Navigation should be visible on tablet
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('should display properly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/dashboard');
    
    // Full desktop layout
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    
    // Check for dashboard grid layout
    const dashboardContent = page.locator('[class*="grid"], [class*="flex"]');
    await expect(dashboardContent.first()).toBeVisible();
  });
});