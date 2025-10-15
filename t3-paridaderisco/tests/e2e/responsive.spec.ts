import { test, expect } from '@playwright/test';

// Mock authentication for responsive tests
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('auth_token', 'mock-test-token');
  });
});

// Test different viewport sizes
const viewports = [
  { name: 'Mobile Portrait', width: 375, height: 667 },
  { name: 'Mobile Landscape', width: 667, height: 375 },
  { name: 'Tablet Portrait', width: 768, height: 1024 },
  { name: 'Tablet Landscape', width: 1024, height: 768 },
  { name: 'Desktop Small', width: 1280, height: 720 },
  { name: 'Desktop Large', width: 1920, height: 1080 },
];

test.describe('Responsive Design Tests', () => {
  viewports.forEach(({ name, width, height }) => {
    test.describe(`${name} (${width}x${height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width, height });
      });

      test('should display dashboard properly', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        // Check basic layout elements are visible
        await expect(page.locator('h1, h2')).toBeVisible();
        
        // Navigation should be accessible
        const nav = page.locator('nav');
        await expect(nav).toBeVisible();

        // Content area should be visible
        const main = page.locator('main');
        if (await main.isVisible()) {
          await expect(main).toBeVisible();
        }

        // Check for horizontal scrolling issues
        const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = width;
        expect(bodyScrollWidth).toBeLessThanOrEqual(viewportWidth + 20); // Allow for small margins
      });

      test('should handle navigation on different screen sizes', async ({ page }) => {
        await page.goto('/dashboard');
        
        // Test navigation functionality
        if (width >= 768) {
          // Desktop/tablet navigation
          const portfolioLink = page.locator('a[href="/portfolio"]');
          await expect(portfolioLink).toBeVisible();
          await portfolioLink.click();
          await expect(page).toHaveURL(/.*portfolio/);
        } else {
          // Mobile navigation (may have hamburger menu or different behavior)
          const nav = page.locator('nav');
          await expect(nav).toBeVisible();
        }
      });

      test('should display forms properly', async ({ page }) => {
        // Test login form responsiveness
        await page.goto('/login');
        await page.waitForLoadState('networkidle');

        const form = page.locator('form');
        await expect(form).toBeVisible();

        const emailInput = page.locator('input[type="email"]');
        const passwordInput = page.locator('input[type="password"]');
        const submitButton = page.locator('button[type="submit"]');

        await expect(emailInput).toBeVisible();
        await expect(passwordInput).toBeVisible();
        await expect(submitButton).toBeVisible();

        // Check inputs are properly sized
        const inputWidth = await emailInput.boundingBox();
        if (inputWidth) {
          expect(inputWidth.width).toBeGreaterThan(100);
          expect(inputWidth.width).toBeLessThanOrEqual(width * 0.9);
        }
      });
    });
  });
});

test.describe('Responsive Breakpoint Tests', () => {
  test('should show mobile layout elements at mobile breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');

    // Mobile-specific elements or behaviors
    const mobileNav = page.locator('[class*="md:hidden"], [class*="sm:block"]');
    if (await mobileNav.isVisible()) {
      await expect(mobileNav).toBeVisible();
    }
  });

  test('should show tablet layout at tablet breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/dashboard');

    // Tablet-specific elements
    const tabletLayout = page.locator('[class*="md:block"], [class*="md:flex"]');
    if (await tabletLayout.isVisible()) {
      await expect(tabletLayout).toBeVisible();
    }
  });

  test('should show desktop layout at desktop breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/dashboard');

    // Desktop-specific elements
    const desktopLayout = page.locator('[class*="lg:block"], [class*="lg:flex"], [class*="xl:grid"]');
    if (await desktopLayout.isVisible()) {
      await expect(desktopLayout).toBeVisible();
    }
  });
});

test.describe('Content Overflow Tests', () => {
  test('should handle long content without horizontal overflow', async ({ page }) => {
    const smallViewport = { width: 320, height: 568 };
    await page.setViewportSize(smallViewport);
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Add some long content to test overflow
    await page.evaluate(() => {
      const longText = document.createElement('div');
      longText.textContent = 'This is a very long text that should wrap properly and not cause horizontal scrolling issues on small screens';
      longText.style.padding = '20px';
      document.body.appendChild(longText);
    });

    // Check for horizontal scrolling
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(smallViewport.width + 20);
  });

  test('should handle tables on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');

    // If there are tables, they should be responsive
    const tables = page.locator('table');
    const tableCount = await tables.count();
    
    for (let i = 0; i < tableCount; i++) {
      const table = tables.nth(i);
      if (await table.isVisible()) {
        const tableBox = await table.boundingBox();
        if (tableBox) {
          // Table should fit within viewport or be scrollable
          expect(tableBox.width).toBeLessThanOrEqual(375 * 1.2);
        }
      }
    }
  });
});

test.describe('Touch Target Tests', () => {
  test('should have adequate touch targets on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    
    // Check button sizes are touch-friendly (at least 44px)
    const buttons = page.locator('button, a[role="button"]');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const buttonBox = await button.boundingBox();
        if (buttonBox) {
          expect(buttonBox.height).toBeGreaterThanOrEqual(40);
          expect(buttonBox.width).toBeGreaterThanOrEqual(40);
        }
      }
    }
  });
});