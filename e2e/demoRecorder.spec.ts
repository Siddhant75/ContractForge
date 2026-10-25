import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('ContractForge Cinematic Demo Video Automation', () => {
  // Allow up to 4 minutes for deliberate, presentation-paced recording
  test.setTimeout(240 * 1000);

  test('Record full 2-minute demo video walkthrough matching script', async ({ page }) => {
    // 0. Inject Virtual Mouse Cursor & Click Ripple Helper
    await page.addInitScript(() => {
      const cursor = document.createElement('div');
      cursor.id = 'playwright-virtual-cursor';
      cursor.style.position = 'fixed';
      cursor.style.width = '18px';
      cursor.style.height = '18px';
      cursor.style.borderRadius = '50%';
      cursor.style.backgroundColor = 'rgba(16, 185, 129, 0.7)'; // Emerald accent
      cursor.style.border = '2px solid rgba(255, 255, 255, 0.9)';
      cursor.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.8)';
      cursor.style.pointerEvents = 'none';
      cursor.style.zIndex = '999999';
      cursor.style.transition = 'transform 0.15s ease, background-color 0.2s';
      cursor.style.transform = 'translate(-50%, -50%)';
      cursor.style.display = 'none';
      document.documentElement.appendChild(cursor);

      window.addEventListener('mousemove', (e) => {
        cursor.style.display = 'block';
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
      });

      window.addEventListener('mousedown', (e) => {
        cursor.style.transform = 'translate(-50%, -50%) scale(0.7)';
        cursor.style.backgroundColor = 'rgba(99, 102, 241, 0.9)'; // Indigo on click
        
        // Create click ripple
        const ripple = document.createElement('div');
        ripple.style.position = 'fixed';
        ripple.style.left = `${e.clientX}px`;
        ripple.style.top = `${e.clientY}px`;
        ripple.style.width = '24px';
        ripple.style.height = '24px';
        ripple.style.borderRadius = '50%';
        ripple.style.border = '2px solid rgba(16, 185, 129, 0.8)';
        ripple.style.transform = 'translate(-50%, -50%) scale(1)';
        ripple.style.opacity = '1';
        ripple.style.transition = 'transform 0.4s ease-out, opacity 0.4s ease-out';
        ripple.style.pointerEvents = 'none';
        ripple.style.zIndex = '999998';
        document.documentElement.appendChild(ripple);
        
        requestAnimationFrame(() => {
          ripple.style.transform = 'translate(-50%, -50%) scale(2.5)';
          ripple.style.opacity = '0';
        });
        setTimeout(() => ripple.remove(), 450);
      });

      window.addEventListener('mouseup', () => {
        cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        cursor.style.backgroundColor = 'rgba(16, 185, 129, 0.7)';
      });
    });

    // Phase 1: Landing Studio & cURL Ingestion (0:00 - 0:25)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3500); // 3.5s hold on Obsidian landing studio

    // Move to and click cURL Command preset
    const curlBtn = page.getByRole('button', { name: /cURL Command/i });
    await curlBtn.hover();
    await page.waitForTimeout(600);
    await curlBtn.click();
    await page.waitForTimeout(4000); // 4s pause showing POST badge & query extraction

    // Demonstrate Malformed JSON Recovery
    const editor = page.locator('textarea');
    await editor.click();
    await editor.fill('{\n  // Malformed developer snippet\n  name: "ContractForge",\n  features: ["AST", "Zod",],\n}');
    await page.waitForTimeout(3000); // 3s hold to see amber auto-sanitized banner
    
    const applyCleanBtn = page.getByRole('button', { name: /Apply Clean JSON/i });
    if (await applyCleanBtn.isVisible()) {
      await applyCleanBtn.hover();
      await page.waitForTimeout(600);
      await applyCleanBtn.click();
      await page.waitForTimeout(3500); // 3.5s pause showing clean green state
    }

    // Phase 2: Stripe Payment Preset for Deep Schemas (0:25 - 0:45)
    const stripeBtn = page.getByRole('button', { name: /Stripe Payment/i });
    await stripeBtn.hover();
    await page.waitForTimeout(600);
    await stripeBtn.click();
    await page.waitForTimeout(4000); // 4s hold showing deep 25-field nested schema

    // Phase 3: Tour 4 Multi-Target Contract Generators (0:45 - 1:15)
    // 3.1 TypeScript Tab
    const tsTab = page.getByRole('button', { name: /TypeScript/i });
    await tsTab.hover();
    await page.waitForTimeout(400);
    await tsTab.click();
    await page.waitForTimeout(4000);

    // 3.2 Zod Schema Tab
    const zodTab = page.getByRole('button', { name: /Zod Schema/i });
    await zodTab.hover();
    await page.waitForTimeout(400);
    await zodTab.click();
    await page.waitForTimeout(4500); // 4.5s hold showing .datetime(), .uuid()

    // 3.3 OpenAI Strict Tab
    const openAiTab = page.getByRole('button', { name: /OpenAI \(Strict\)/i });
    await openAiTab.hover();
    await page.waitForTimeout(400);
    await openAiTab.click();
    await page.waitForTimeout(7000); // 7s hold to read additionalProperties: false & required nullable unions

    // 3.4 Anthropic Claude Tool Tab
    const claudeTab = page.getByRole('button', { name: /Anthropic Tool/i });
    await claudeTab.hover();
    await page.waitForTimeout(400);
    await claudeTab.click();
    await page.waitForTimeout(4000);

    // Phase 4: In-Browser Chaos Mock Runner (1:15 - 1:45)
    const runChaosBtn = page.getByRole('button', { name: /Run Chaos Mock/i }).first();
    await runChaosBtn.hover();
    await page.waitForTimeout(600);
    await runChaosBtn.click();
    await page.waitForTimeout(1500); // Drawer slides up

    // Wait for simulated latency to complete and status badges to illuminate
    const okBadge = page.getByText('200 OK').first();
    await expect(okBadge).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(3000); // 3s hold on 200 OK baseline

    // Expand the first rejected mutation card to inspect diagnostics
    const rejectedBadge = page.getByText('422 REJECTED').first();
    await rejectedBadge.hover();
    await page.waitForTimeout(600);
    await rejectedBadge.click();
    await page.waitForTimeout(6000); // 6s pause to read id: Required error path

    // Phase 5: Copy & Closing Wrap (1:45 - 2:00)
    // Close drawer via SVG close button
    const closeDrawerBtn = page.locator('div.fixed button:has(svg.lucide-x)').first();
    if (await closeDrawerBtn.isVisible()) {
      await closeDrawerBtn.hover();
      await page.waitForTimeout(400);
      await closeDrawerBtn.click();
      await page.waitForTimeout(1500);
    }

    // Click Copy Code
    const copyBtn = page.getByRole('button', { name: /Copy Code/i });
    await copyBtn.hover();
    await page.waitForTimeout(500);
    await copyBtn.click();
    await page.waitForTimeout(4000); // 4s pause showing green checkmark "Copied!"

    // Final closing hold on the studio
    await page.waitForTimeout(3000);

    // Explicitly close page to flush the video recording stream on Windows
    const video = page.video();
    await page.close();

    if (video) {
      const recordingsDir = path.resolve('recordings');
      if (!fs.existsSync(recordingsDir)) {
        fs.mkdirSync(recordingsDir, { recursive: true });
      }
      const destPath = path.resolve(recordingsDir, 'demo-video-presentation.webm');
      await video.saveAs(destPath);
      console.log(`Successfully recorded presentation video to: ${destPath}`);
    }
  });
});
