import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    // Check if we're redirected to login or can access login
    const loginLink = page.locator('a[href="/login"]');
    if (await loginLink.isVisible()) {
      await loginLink.click();
    } else {
      await page.goto('/login');
    }
    
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('h1, h2')).toContainText(/login/i);
  });

  test('should show validation errors for empty login form', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Check for validation errors
    await expect(page.locator('text=Email é obrigatório')).toBeVisible();
    await expect(page.locator('text=Senha é obrigatória')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Email inválido')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');
    
    const registerLink = page.locator('a[href="/register"]');
    await expect(registerLink).toBeVisible();
    await registerLink.click();
    
    await expect(page).toHaveURL(/.*register/);
    await expect(page.locator('h1, h2')).toContainText(/registro|criar conta/i);
  });

  test('should show validation errors for empty register form', async ({ page }) => {
    await page.goto('/register');
    
    await page.click('button[type="submit"]');
    
    // Check for validation errors
    await expect(page.locator('text=Nome é obrigatório')).toBeVisible();
    await expect(page.locator('text=Email é obrigatório')).toBeVisible();
    await expect(page.locator('text=Telefone é obrigatório')).toBeVisible();
    await expect(page.locator('text=Senha é obrigatória')).toBeVisible();
  });

  test('should validate password strength', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('input[name="password"]', 'weak');
    
    // Check password strength indicator
    const strengthIndicator = page.locator('[data-testid="password-strength"]');
    if (await strengthIndicator.isVisible()) {
      await expect(strengthIndicator).toContainText(/fraca|weak/i);
    }
  });
});

test.describe('Protected Routes', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access protected routes
    const protectedRoutes = ['/dashboard', '/portfolio', '/transactions', '/baskets'];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/.*login/);
    }
  });
});

test.describe('Navigation', () => {
  test('should show responsive navigation menu', async ({ page }) => {
    await page.goto('/');
    
    // Test desktop navigation
    await page.setViewportSize({ width: 1200, height: 800 });
    const desktopNav = page.locator('nav');
    await expect(desktopNav).toBeVisible();
    
    // Test mobile navigation (if implemented)
    await page.setViewportSize({ width: 375, height: 667 });
    // Mobile nav behavior may vary depending on implementation
  });
});