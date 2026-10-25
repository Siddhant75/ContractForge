import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('ContractForge Cinematic Developer-Flow Demo Video', () => {
  // Allow up to 5 minutes for full voiceover-matched presentation recording
  test.setTimeout(300 * 1000);

  test('Record authentic developer workflow precisely timed to Kokoro voiceover', async ({ page }) => {
    // 0. Inject Virtual Mouse Cursor & Click Ripple Helper
    await page.addInitScript(() => {
      const cursor = document.createElement('div');
      cursor.id = 'playwright-virtual-cursor';
      cursor.style.position = 'fixed';
      cursor.style.width = '18px';
      cursor.style.height = '18px';
      cursor.style.borderRadius = '50%';
      cursor.style.backgroundColor = 'rgba(16, 185, 129, 0.75)'; // Emerald accent
      cursor.style.border = '2px solid rgba(255, 255, 255, 0.95)';
      cursor.style.boxShadow = '0 0 12px rgba(16, 185, 129, 0.9)';
      cursor.style.pointerEvents = 'none';
      cursor.style.zIndex = '999999';
      cursor.style.transition = 'transform 0.12s ease, background-color 0.18s';
      cursor.style.transform = 'translate(-50%, -50%)';
      cursor.style.display = 'none';
      document.documentElement.appendChild(cursor);

      window.addEventListener('mousemove', (e) => {
        cursor.style.display = 'block';
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
      });

      window.addEventListener('mousedown', (e) => {
        cursor.style.transform = 'translate(-50%, -50%) scale(0.65)';
        cursor.style.backgroundColor = 'rgba(99, 102, 241, 0.95)'; // Indigo on click
        
        // Animated click ripple
        const ripple = document.createElement('div');
        ripple.style.position = 'fixed';
        ripple.style.left = `${e.clientX}px`;
        ripple.style.top = `${e.clientY}px`;
        ripple.style.width = '26px';
        ripple.style.height = '26px';
        ripple.style.borderRadius = '50%';
        ripple.style.border = '2px solid rgba(16, 185, 129, 0.85)';
        ripple.style.transform = 'translate(-50%, -50%) scale(1)';
        ripple.style.opacity = '1';
        ripple.style.transition = 'transform 0.45s ease-out, opacity 0.45s ease-out';
        ripple.style.pointerEvents = 'none';
        ripple.style.zIndex = '999998';
        document.documentElement.appendChild(ripple);
        
        requestAnimationFrame(() => {
          ripple.style.transform = 'translate(-50%, -50%) scale(2.8)';
          ripple.style.opacity = '0';
        });
        setTimeout(() => ripple.remove(), 450);
      });

      window.addEventListener('mouseup', () => {
        cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        cursor.style.backgroundColor = 'rgba(16, 185, 129, 0.75)';
      });
    });

    // ─────────────────────────────────────────────────────────────
    // ACT 1: THE AGONY & REAL-WORLD INGESTION (~46s matching audio)
    // ─────────────────────────────────────────────────────────────
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(4000); // 4s hold: Viewer takes in the Obsidian studio while voiceover introduces agent pain

    // Developer clears editor to demonstrate bringing in external API
    const clearBtn = page.getByRole('button', { name: /Clear/i });
    await clearBtn.hover();
    await page.waitForTimeout(600);
    await clearBtn.click();
    await page.waitForTimeout(3000); // 3s hold on empty canvas while voiceover discusses boilerplate typing

    // Developer pastes a real-world multi-line cURL command copied from Stripe documentation
    const editor = page.locator('textarea');
    await editor.click();
    const realisticCurl = `curl -X POST https://api.stripe.com/v1/payment_intents \\
  -H "Authorization: Bearer sk_test_51Mz982Jk109" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 4999,
    "currency": "usd",
    "customer": "cus_N9Xv7Y98Z0",
    "payment_method_types": ["card"],
    "receipt_email": "alex.chen@example.com",
    "metadata": {
      "order_id": "ord_8829103",
      "tier": "enterprise"
    }
  }'`;
    
    await editor.fill(realisticCurl);
    // Dwell for remainder of Act 1 (~35s): viewer sees POST badge, headers stripped, target URL
    await page.waitForTimeout(35000);

    // ─────────────────────────────────────────────────────────────
    // ACT 2: QUERY-PARAM SCHEMAS & RESILIENT AUTO-SANITIZER (~20s matching audio)
    // ─────────────────────────────────────────────────────────────
    // Demonstrate GET request with query-string parameters and NO request body
    const queryOnlyCurl = `curl -X GET "https://api.github.com/search/repositories?q=machine-learning&sort=stars&order=desc&per_page=25&active=true" \\
  -H "Accept: application/vnd.github+json"`;
    
    await editor.click();
    await editor.fill(queryOnlyCurl);
    await page.waitForTimeout(7000); // 7s hold: Voiceover explains query parameter extraction into root schema

    // Demonstrate Resilient Auto-Sanitizer on corrupted developer JSON
    const brokenJson = `{\n  // Corrupted developer payload from Slack\n  name: "ContractForge Engine",\n  active: true,\n  tags: ["ast", "zod", "openai",],\n  version: 1,\n}`;
    await editor.click();
    await editor.fill(brokenJson);
    await page.waitForTimeout(4000); // 4s hold: Viewer sees amber alert banner "Auto-sanitized syntax issues"

    // Click "Apply Clean JSON"
    const applyCleanBtn = page.getByRole('button', { name: /Apply Clean JSON/i });
    if (await applyCleanBtn.isVisible()) {
      await applyCleanBtn.hover();
      await page.waitForTimeout(600);
      await applyCleanBtn.click();
      await page.waitForTimeout(8000); // 8s hold: Viewer sees syntax repaired and clean formatting
    }

    // ─────────────────────────────────────────────────────────────
    // ACT 3: DEEP SCHEMAS & 4 MULTI-TARGET GENERATORS (~33s matching audio)
    // ─────────────────────────────────────────────────────────────
    // Load Stripe Payment preset for deep production schema demonstration
    const stripePresetBtn = page.getByRole('button', { name: /Stripe Payment/i });
    await stripePresetBtn.hover();
    await page.waitForTimeout(600);
    await stripePresetBtn.click();
    await page.waitForTimeout(4000); // 4s hold: 25-field deep schema

    // 3.1 Tour TypeScript Tab
    const tsTab = page.getByRole('button', { name: /TypeScript/i });
    await tsTab.hover();
    await page.waitForTimeout(400);
    await tsTab.click();
    await page.waitForTimeout(5000); // 5s hold: Idiomatic TypeScript interfaces

    // 3.2 Tour Zod Schema Tab
    const zodTab = page.getByRole('button', { name: /Zod Schema/i });
    await zodTab.hover();
    await page.waitForTimeout(400);
    await zodTab.click();
    await page.waitForTimeout(6000); // 6s hold: Semantic validators (.datetime(), .uuid(), .email())

    // 3.3 Tour OpenAI (Strict) Tab — The Frontier Agent Superpower
    const openAiTab = page.getByRole('button', { name: /OpenAI \(Strict\)/i });
    await openAiTab.hover();
    await page.waitForTimeout(400);
    await openAiTab.click();
    await page.waitForTimeout(5000); // Pause on top of schema

    // Subtle smooth scroll down through the OpenAI strict schema
    const codeArea = page.locator('pre code, .font-mono').last();
    if (await codeArea.isVisible()) {
      await codeArea.evaluate((el) => el.scrollBy({ top: 220, behavior: 'smooth' }));
      await page.waitForTimeout(8000); // 8s hold: Highlight recursive additionalProperties: false & required null-unions
    }

    // 3.4 Tour Anthropic Claude Tool Tab
    const claudeTab = page.getByRole('button', { name: /Anthropic Tool/i });
    await claudeTab.hover();
    await page.waitForTimeout(400);
    await claudeTab.click();
    await page.waitForTimeout(4500); // 4.5s hold: Claude Draft-7 tool spec

    // ─────────────────────────────────────────────────────────────
    // ACT 4: THE UNIQUE KERNEL — IN-BROWSER CHAOS MOCK RUNNER (~34s matching audio)
    // ─────────────────────────────────────────────────────────────
    const runChaosBtn = page.getByRole('button', { name: /Run Chaos Mock/i }).first();
    await runChaosBtn.hover();
    await page.waitForTimeout(600);
    await runChaosBtn.click();
    await page.waitForTimeout(1500); // Drawer slides up smoothly

    // Wait for simulated execution latency to complete and status badges to illuminate
    const okBadge = page.getByText('200 OK').first();
    await expect(okBadge).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(6000); // 6s hold on glowing green 200 OK baseline while voiceover explains in-memory compile

    // Expand the first rejected chaos mutation card to inspect live diagnostics
    const rejectedBadge = page.getByText('422 REJECTED').first();
    await rejectedBadge.hover();
    await page.waitForTimeout(600);
    await rejectedBadge.click();
    await page.waitForTimeout(20000); // 20s hold: Viewer reads exact diagnostic path (id: Required) while voiceover details mutation catching

    // Close the drawer smoothly
    const closeDrawerBtn = page.locator('div.fixed button:has(svg.lucide-x)').first();
    if (await closeDrawerBtn.isVisible()) {
      await closeDrawerBtn.hover();
      await page.waitForTimeout(500);
      await closeDrawerBtn.click();
      await page.waitForTimeout(3000);
    }

    // ─────────────────────────────────────────────────────────────
    // ACT 5: 1-CLICK CLIPBOARD & AUTONOMOUS MCP AGENT WRAP (~22s matching audio)
    // ─────────────────────────────────────────────────────────────
    // Click Copy Code to show animated checkmark confirmation
    const copyBtn = page.getByRole('button', { name: /Copy Code/i });
    await copyBtn.hover();
    await page.waitForTimeout(600);
    await copyBtn.click();
    await page.waitForTimeout(7000); // 7s hold showing green checkmark "Copied!"

    // Final closing hold on the studio with footer status and MCP badge visible
    await page.waitForTimeout(14000); // 14s hold while voiceover delivers closing open-source statement and MCP wrap

    // Finalize video stream cleanly for Windows
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
