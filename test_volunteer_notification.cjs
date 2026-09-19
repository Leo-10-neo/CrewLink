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

  // 1. Go to origin and set Jon volunteer session
  await page.goto('http://localhost:5000');
  await page.waitForTimeout(500);

  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YWExNDc5ZTBhMDU0NzFjODdiNTM2NTAiLCJyb2xlIjoidm9sdW50ZWVyIiwiaWF0IjoxNzg5ODAyNDI0LCJleHAiOjE3OTA0MDcyMjR9.C9ePbi7P18KuY6elRNqx7ya4vjTeJdy-CHHNV_XOFlo';
  const user = JSON.stringify({ _id: '6aa1479e0a05471c87b53650', username: 'Jon', fullName: 'Jon das', role: 'volunteer' });

  await page.evaluate(({ t, u }) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', u);
  }, { t: token, u: user });

  // Post a new message from Admin to ensure a fresh unread notification is waiting
  const axios = require('axios');
  const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTk4ZmU2OTg3M2RjMzM2YmE3MWIxYzQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODk4MDA4NDgsImV4cCI6MTc5MDQwNTY0OH0.LmE8L2wsqSZ59fzirauEuK-L5gNJ3_dnGQSo_kEGNzw';
  try {
    await axios.post('http://localhost:5000/api/volunteer/admin/tasks/6aaa7a22e97a11cdc7c335c7/chat', {
      message: {
        sender: '6a98fe69873dc336ba71b1c4',
        senderName: 'Admin',
        senderRole: 'admin',
        text: 'Please report to Gate B at 9:30 AM sharp',
        timestamp: new Date().toISOString()
      }
    }, { headers: { Authorization: 'Bearer ' + adminToken } });
  } catch (e) {
    console.error('Failed to post admin message:', e.message);
  }

  // 2. Go to Volunteer Dashboard
  await page.goto('http://localhost:5000/volunteer/dashboard');
  console.log('Navigated to Volunteer Dashboard. Waiting for live notification polling...');
  await page.waitForTimeout(3500); // Polling picks up the new notification and shows banner

  const outDir = 'C:\\Users\\Nihal Wesly G\\.gemini\\antigravity-ide\\brain\\07f3b15d-5772-4ba7-b026-afd0c07a2222';
  
  // 3. Take screenshot of the notification banner with admin message displayed!
  const bannerPath = path.join(outDir, 'volunteer_notification_banner_with_message.png');
  await page.screenshot({ path: bannerPath });
  console.log('Notification banner screenshot saved to:', bannerPath);

  // 4. Click the Notification Banner
  const banner = page.locator('aside[aria-label="Push Notification"]');
  if (await banner.count() > 0) {
    await banner.click();
    console.log('Clicked Notification Banner!');
  } else {
    console.log('Banner not found via locator, trying bell dropdown...');
    const bellBtn = page.locator('header button[aria-label="Notifications"]').or(page.locator('.lucide-bell').locator('..'));
    await bellBtn.first().click();
    await page.waitForTimeout(500);
    const notifItem = page.locator('text=Please report to Gate B').first();
    await notifItem.click();
  }

  await page.waitForTimeout(2000); // Event support chat loads
  console.log('Current URL after click:', page.url());

  // 5. Capture screenshot of opened chat support page
  const chatDesktopPath = path.join(outDir, 'volunteer_chat_opened_from_notification.png');
  await page.screenshot({ path: chatDesktopPath });
  console.log('Volunteer chat screenshot saved to:', chatDesktopPath);

  // 6. Mobile viewport verification
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  const chatMobilePath = path.join(outDir, 'volunteer_mobile_chat_opened_from_notification.png');
  await page.screenshot({ path: chatMobilePath });
  console.log('Volunteer mobile chat screenshot saved to:', chatMobilePath);

  await browser.close();
})();
