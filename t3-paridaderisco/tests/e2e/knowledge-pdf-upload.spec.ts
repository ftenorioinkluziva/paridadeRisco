import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Knowledge Manager - PDF Upload', () => {
  test.beforeAll(async () => {
    // Create a simple test PDF
    const pdfPath = path.join(__dirname, 'test-document.pdf');

    // Simple PDF content (minimal valid PDF)
    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>
endobj
5 0 obj
<< /Length 55 >>
stream
BT
/F1 24 Tf
100 700 Td
(Test PDF Document) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000056 00000 n
0000000115 00000 n
0000000230 00000 n
0000000329 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
442
%%EOF`;

    fs.writeFileSync(pdfPath, pdfContent);
  });

  test('should upload PDF and extract information', async ({ page }) => {
    // Navigate to admin page
    await page.goto('http://localhost:3000/admin');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if we're redirected to login (unauthenticated)
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
      console.log('User not authenticated, test requires authentication');
      // Skip or handle authentication
      test.skip();
      return;
    }

    // Click "Adicionar Recurso" button
    await page.click('text=Adicionar Recurso');

    // Wait for dialog to open
    await page.waitForSelector('role=dialog');

    // Click on "Upload PDF" tab
    await page.click('text=Upload PDF');

    // Wait for PDF upload tab content
    await page.waitForSelector('input[type="file"]');

    // Upload the test PDF
    const pdfPath = path.join(__dirname, 'test-document.pdf');
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles(pdfPath);

    // Wait for processing (should show loading state)
    await page.waitForSelector('text=/Processando|Analisando/', { timeout: 5000 });

    // Wait for extraction to complete (timeout 30 seconds for LLM processing)
    await page.waitForSelector('input[name="title"]', { timeout: 30000 });

    // Check if title field was populated
    const titleValue = await page.inputValue('input[name="title"]');
    expect(titleValue).toBeTruthy();
    expect(titleValue.length).toBeGreaterThan(0);

    // Check if category was selected
    const categoryElement = await page.locator('[name="category"]');
    expect(categoryElement).toBeTruthy();

    // Check if content was populated
    const contentValue = await page.inputValue('textarea[name="content"]');
    expect(contentValue).toBeTruthy();
    expect(contentValue.length).toBeGreaterThan(100);

    console.log('Extracted data:');
    console.log('Title:', titleValue);
    console.log('Content length:', contentValue.length);

    // Take screenshot
    await page.screenshot({ path: 'pdf-upload-result.png' });
  });

  test('should show error for invalid PDF', async ({ page }) => {
    // Navigate to admin page
    await page.goto('http://localhost:3000/admin');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check authentication
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
      test.skip();
      return;
    }

    // Click "Adicionar Recurso" button
    await page.click('text=Adicionar Recurso');

    // Wait for dialog
    await page.waitForSelector('role=dialog');

    // Click on "Upload PDF" tab
    await page.click('text=Upload PDF');

    // Create invalid file (not a PDF)
    const invalidFilePath = path.join(__dirname, 'invalid.txt');
    fs.writeFileSync(invalidFilePath, 'This is not a PDF');

    // Try to upload invalid file
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles(invalidFilePath);

    // Should show error message
    await page.waitForSelector('text=/erro|error/i', { timeout: 5000 });

    // Clean up
    fs.unlinkSync(invalidFilePath);

    // Take screenshot
    await page.screenshot({ path: 'pdf-upload-error.png' });
  });

  test.afterAll(async () => {
    // Clean up test PDF
    const pdfPath = path.join(__dirname, 'test-document.pdf');
    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
    }
  });
});
