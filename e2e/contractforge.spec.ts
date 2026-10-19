import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('ContractForge E2E & Visual Verification', () => {
  test.beforeAll(async () => {
    // Ensure screenshot output directory exists
    const screenshotsDir = path.resolve('docs', 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    const recordingsDir = path.resolve('recordings');
    if (!fs.existsSync(recordingsDir)) {
      fs.mkdirSync(recordingsDir, { recursive: true });
    }
  });

  test('Walk through core journey, verify AST generation & chaos mock, and capture assets', async ({ page }) => {
    // Step 1: Navigate to ContractForge
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify Branding
    await expect(page.getByRole('heading', { name: 'ContractForge' })).toBeVisible();
    await page.screenshot({ path: 'docs/screenshots/01-landing-studio.png', fullPage: true });

    // Step 2: Test cURL Command Preset & Ingestion Engine
    const curlPresetBtn = page.getByRole('button', { name: /cURL Command/i });
    await curlPresetBtn.click();
    await page.waitForTimeout(300);

    // Verify cURL Lexer tokenized POST badge
    await expect(page.getByRole('main').getByText('cURL Command')).toBeVisible();
    await expect(page.getByText('POST', { exact: true })).toBeVisible();
    await page.screenshot({ path: 'docs/screenshots/02-curl-ingestion.png', fullPage: true });

    // Step 3: Switch to Stripe Payment Preset for Deep Schemas
    const stripePresetBtn = page.getByRole('button', { name: /Stripe Payment/i });
    await stripePresetBtn.click();
    await page.waitForTimeout(300);

    // Step 4: Verify & Capture 4 Multi-Target Contract Generators
    // 4.1 TypeScript Tab
    const tsTab = page.getByRole('button', { name: /TypeScript/i });
    await tsTab.click();
    await page.waitForTimeout(200);
    await expect(page.getByText('TypeScript Interface')).toBeVisible();
    await page.screenshot({ path: 'docs/screenshots/03-typescript-contract.png', fullPage: true });

    // 4.2 Zod Schema Tab
    const zodTab = page.getByRole('button', { name: /Zod Schema/i });
    await zodTab.click();
    await page.waitForTimeout(200);
    await expect(page.getByText('Zod Validator Schema')).toBeVisible();
    await page.screenshot({ path: 'docs/screenshots/04-zod-contract.png', fullPage: true });

    // 4.3 OpenAI Strict Tool Tab
    const openAiTab = page.getByRole('button', { name: /OpenAI \(Strict\)/i });
    await openAiTab.click();
    await page.waitForTimeout(200);
    await expect(page.getByText('OpenAI Strict Tool Spec')).toBeVisible();
    await page.screenshot({ path: 'docs/screenshots/05-openai-strict-tool.png', fullPage: true });

    // 4.4 Anthropic Claude Tool Tab
    const anthropicTab = page.getByRole('button', { name: /Anthropic Tool/i });
    await anthropicTab.click();
    await page.waitForTimeout(200);
    await expect(page.getByText('Anthropic Claude Tool Spec')).toBeVisible();
    await page.screenshot({ path: 'docs/screenshots/06-claude-tool.png', fullPage: true });

    // Step 5: Execute In-Browser Chaos Mock Runner
    const runChaosBtn = page.getByRole('button', { name: /Run Chaos Mock/i }).first();
    await runChaosBtn.click();

    // Verify Drawer Opens and Simulated Execution Completes
    await expect(page.getByRole('heading', { name: /Interactive Chaos & Mock Runner/i })).toBeVisible();

    // Wait for simulated latency to complete and status badges to illuminate
    const okBadge = page.getByText('200 OK').first();
    await expect(okBadge).toBeVisible({ timeout: 10000 });

    const rejectedBadge = page.getByText('422 REJECTED').first();
    await expect(rejectedBadge).toBeVisible();

    // Expand the first rejected edge-case mutation card to show diagnostics
    await rejectedBadge.click();
    await page.waitForTimeout(400);

    // Final Action Screenshot: Chaos Runner Drawer with passing and intercepted mutations
    await page.screenshot({ path: 'docs/screenshots/07-chaos-mock-results.png', fullPage: true });
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Copy the recorded video to recordings/demo-walkthrough.webm
    const video = page.video();
    if (video) {
      const videoPath = await video.path();
      if (fs.existsSync(videoPath)) {
        const destPath = path.resolve('recordings', 'demo-walkthrough.webm');
        fs.copyFileSync(videoPath, destPath);
        console.log(`Saved demo video to: ${destPath}`);
      }
    }
  });
});
