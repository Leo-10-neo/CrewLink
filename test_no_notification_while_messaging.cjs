const { chromium } = require('playwright');
const path = require('path');
const axios = require('axios');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // Mobile viewport matching user's screenshot
    deviceScaleFactor: 1.5
  });
  const page = await context.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTk4ZmU2OTg3M2RjMzM2YmE3MWIxYzQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODk4MDA4NDgsImV4cCI6MTc5MDQwNTY0OH0.LmE8L2wsqSZ59fzirauEuK-L5gNJ3_dnGQSo_kEGNzw';
  const adminUser = JSON.stringify({ _id: '6a98fe69873dc336ba71b1c4', username: 'admin', role: 'admin' });

  const volunteerToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YWExNDc5ZTBhMDU0NzFjODdiNTM2NTAiLCJyb2xlIjoidm9sdW50ZWVyIiwiaWF0IjoxNzg5ODAyNDI0LCJleHAiOjE3OTA0MDcyMjR9.C9ePbi7P18KuY6elRNqx7ya4vjTeJdy-CHHNV_XOFlo';
  const volunteerUser = JSON.stringify({ _id: '6aa1479e0a05471c87b53650', username: 'Jon', fullName: 'Jon das', role: 'volunteer' });

  const outDir = 'C:\\Users\\Nihal Wesly G\\.gemini\\antigravity-ide\\brain\\07f3b15d-5772-4ba7-b026-afd0c07a2222';

  console.log('\n--- 1. Testing Admin Dashboard While Messaging ---');
  await page.goto('http://localhost:5000');
  const taskId = '6aa24e2794fffe45ecaadc47';

  await page.evaluate(({ t, u, taskId }) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', u);
    sessionStorage.setItem('openChatForTask', taskId);
  }, { t: adminToken, u: adminUser, taskId });

  await page.goto('http://localhost:5000/admin/dashboard');
  await page.waitForTimeout(2000); // Chat modal opens automatically via openChatForTask
  console.log('Opened chat modal in Admin Dashboard for task:', taskId);

  // Post a new message from volunteer Jon to this task
  const testMsgAdmin = 'Jon says hello while chatting ' + Date.now().toString().slice(-4);
  try {
    await axios.post(`http://localhost:5000/api/volunteer/tasks/${taskId}/chat`, {
      message: {
        sender: '6aa1479e0a05471c87b53650',
        senderName: 'Jon',
        senderRole: 'volunteer',
        text: testMsgAdmin,
        timestamp: new Date().toISOString()
      }
    }, { headers: { Authorization: `Bearer ${volunteerToken}` } });
    console.log('Posted message from volunteer Jon:', testMsgAdmin);
  } catch (e) {
    console.error('Failed to post volunteer message:', e.message);
  }

  // Wait 3.5s for notification & chat polling intervals
  await page.waitForTimeout(3500);

  const bannerAdmin = page.locator('aside[aria-label="Push Notification"]');
  const bannerAdminCount = await bannerAdmin.count();
  console.log('Admin notification banner count while messaging:', bannerAdminCount);

  const adminScreenshotPath = path.join(outDir, 'admin_chat_no_notification_while_messaging.png');
  await page.screenshot({ path: adminScreenshotPath });
  console.log('Admin screenshot saved to:', adminScreenshotPath);

  if (bannerAdminCount > 0) {
    console.error('FAIL: Notification banner is displaying while admin is messaging!');
  } else {
    console.log('SUCCESS: No notification popup while admin is messaging!');
  }

  console.log('\n--- 2. Testing Volunteer Event Support While Messaging ---');
  await page.goto('http://localhost:5000');
  await page.evaluate(({ t, u }) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', u);
  }, { t: volunteerToken, u: volunteerUser });

  await page.goto(`http://localhost:5000/volunteer/event-support/${taskId}`);
  console.log('Navigated to Volunteer Event Support');
  await page.waitForTimeout(1500);

  // Post a new message from Admin
  const testMsgVolunteer = 'Admin updates you ' + Date.now().toString().slice(-4);
  try {
    await axios.post(`http://localhost:5000/api/volunteer/admin/tasks/${taskId}/chat`, {
      message: {
        sender: '6a98fe69873dc336ba71b1c4',
        senderName: 'Admin',
        senderRole: 'admin',
        text: testMsgVolunteer,
        timestamp: new Date().toISOString()
      }
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    console.log('Posted message from Admin:', testMsgVolunteer);
  } catch (e) {
    console.error('Failed to post admin message:', e.message);
  }

  // Wait 3.5s for chat polling
  await page.waitForTimeout(3500);

  const bannerVolunteer = page.locator('aside[aria-label="Push Notification"]');
  const bannerVolunteerCount = await bannerVolunteer.count();
  console.log('Volunteer notification banner count while messaging:', bannerVolunteerCount);

  const volunteerScreenshotPath = path.join(outDir, 'volunteer_chat_no_notification_while_messaging.png');
  await page.screenshot({ path: volunteerScreenshotPath });
  console.log('Volunteer screenshot saved to:', volunteerScreenshotPath);

  if (bannerVolunteerCount > 0) {
    console.error('FAIL: Notification banner is displaying while volunteer is messaging!');
  } else {
    console.log('SUCCESS: No notification popup while volunteer is messaging!');
  }

  await browser.close();
})();
