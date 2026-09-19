const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1.5
  });
  const page = await context.newPage();

  // 1. Go to origin and set admin session
  await page.goto('http://localhost:5000');
  await page.waitForTimeout(500);

  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTk4ZmU2OTg3M2RjMzM2YmE3MWIxYzQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODk4MDA4NDgsImV4cCI6MTc5MDQwNTY0OH0.LmE8L2wsqSZ59fzirauEuK-L5gNJ3_dnGQSo_kEGNzw';
  const user = JSON.stringify({ _id: '6a98fe69873dc336ba71b1c4', username: 'admin', role: 'admin' });

  await page.evaluate(({ t, u }) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', u);
  }, { t: token, u: user });

  // 2. Go to Admin Dashboard
  await page.goto('http://localhost:5000/admin/dashboard');
  await page.waitForTimeout(2000);

  // 3. Open notifications dropdown
  const bellButton = page.locator('.topbar-profile button').first();
  await bellButton.click();
  await page.waitForTimeout(500);

  // 4. Click "Test Banner"
  const testBannerBtn = page.locator('text=Test Banner').first();
  await testBannerBtn.click();
  console.log('Clicked Test Banner');
  await page.waitForTimeout(400); // Banner slides down

  // 5. Click the Notification Banner itself!
  const banner = page.locator('aside[aria-label="Push Notification"]');
  await banner.click();
  console.log('Clicked Notification Banner!');
  await page.waitForTimeout(1000); // Chat modal opens

  // 6. Capture screenshot of opened chat modal
  const outDir = 'C:\\Users\\Nihal Wesly G\\.gemini\\antigravity-ide\\brain\\07f3b15d-5772-4ba7-b026-afd0c07a2222';
  const outPath = path.join(outDir, 'admin_notification_click_chat_opened.png');
  await page.screenshot({ path: outPath });
  console.log('Screenshot saved to:', outPath);

  // Also test on mobile viewport
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  const mobileOutPath = path.join(outDir, 'admin_mobile_notification_click_chat_opened.png');
  await page.screenshot({ path: mobileOutPath });
  console.log('Mobile screenshot saved to:', mobileOutPath);

  await browser.close();
})();
