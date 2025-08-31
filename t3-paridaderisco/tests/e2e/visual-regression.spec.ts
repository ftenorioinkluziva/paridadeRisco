import { test, expect } from '@playwright/test';

// Mock authentication for visual tests
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('auth_token', 'mock-test-token');
  });
});

test.describe('Visual Regression Tests', () => {
  test('should match dashboard screenshot', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Wait for any animations or loading states to complete
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('dashboard-desktop.png');
  });

  test('should match portfolio page screenshot', async ({ page }) => {
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('portfolio-desktop.png');
  });

  test('should match transactions page screenshot', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('transactions-desktop.png');
  });

  test('should match baskets page screenshot', async ({ page }) => {
    await page.goto('/baskets');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('baskets-desktop.png');
  });
});

test.describe('Mobile Visual Regression', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should match dashboard mobile screenshot', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('dashboard-mobile.png');
  });

  test('should match portfolio mobile screenshot', async ({ page }) => {
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('portfolio-mobile.png');
  });
});

test.describe('Component Visual Tests', () => {
  test('should match navigation component', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const nav = page.locator('nav');
    await expect(nav).toHaveScreenshot('navigation-component.png');
  });

  test('should match login form', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const form = page.locator('form');
    await expect(form).toHaveScreenshot('login-form.png');
  });

  test('should match register form', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    const form = page.locator('form');
    await expect(form).toHaveScreenshot('register-form.png');
  });
});

test.describe('Theme Visual Tests', () => {
  test('should match light theme dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Ensure light theme is active
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
    });
    
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('dashboard-light-theme.png');
  });

  test('should match dark theme dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Switch to dark theme
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('dashboard-dark-theme.png');
  });
});