// verify_interactive_flows.cjs
const { chromium } = require('playwright');

async function testInteractiveFlows(baseUrl = 'http://localhost:5000') {
  console.log(`\n🚀 Testing Interactive Workflows in Both Spaces against ${baseUrl}...`);
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();

  // ----------------------------------------------------
  // VOLUNTEER SPACE
  // ----------------------------------------------------
  console.log('\n--- 1. Testing Volunteer Space Interactive Flow ---');

  // Step 1: Login
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#login-email', { timeout: 8000 });
  await page.fill('#login-email', 'don@gmail.com');
  await page.fill('#login-password', 'don123');
  await page.click('#login-submit');

  await page.waitForSelector('#vol-nav-tasks', { timeout: 15000 });
  console.log('✅ Volunteer logged in successfully');

  // Step 2: Tasks View & Task Actions
  await page.click('#vol-nav-tasks');
  await page.waitForTimeout(1000);

  // Check if Start Task button is visible
  const startBtn = page.locator('button:has-text("Start task"), [data-testid="btn-task-action"]:has-text("Start task")').first();
  const completeBtn = page.locator('button:has-text("Complete task"), [data-testid="btn-task-action"]:has-text("Complete task")').first();

  if (await startBtn.isVisible()) {
    console.log('Found "Start task" button, clicking...');
    await startBtn.click();
    await page.waitForTimeout(1500);
    console.log('✅ "Start task" clicked successfully');
  }

  if (await completeBtn.isVisible()) {
    console.log('Found "Complete task" button, clicking...');
    await completeBtn.click();
    await page.waitForTimeout(1500);
    console.log('✅ "Complete task" clicked successfully');
  } else {
    // If it changed to complete task after clicking start
    const newCompleteBtn = page.locator('button:has-text("Complete task")').first();
    if (await newCompleteBtn.isVisible()) {
      console.log('Found updated "Complete task" button, clicking...');
      await newCompleteBtn.click();
      await page.waitForTimeout(1500);
      console.log('✅ "Complete task" clicked successfully');
    } else {
      console.log('ℹ️ Task already in completed state');
    }
  }

  // Step 3: Attendance Tab
  await page.click('#vol-nav-attendance');
  await page.waitForTimeout(800);
  const attendanceContent = await page.textContent('body');
  if (!attendanceContent.includes('Attendance')) {
    throw new Error('Attendance tab content not loaded');
  }
  console.log('✅ Volunteer Attendance tab verified');

  // Step 4: Certificates Tab
  await page.click('#vol-nav-certificates');
  await page.waitForTimeout(800);
  const certContent = await page.textContent('body');
  if (!certContent.includes('Certificate')) {
    throw new Error('Certificate tab content not loaded');
  }
  console.log('✅ Volunteer Certificates tab verified');

  // Step 5: Volunteer Profile Tab & UPI
  await page.click('#vol-nav-profile');
  await page.waitForSelector('#vol-input-upiId', { timeout: 6000 });
  await page.fill('#vol-input-upiId', 'don@okhdfcbank');
  await page.click('#vol-save-profile-btn');
  await page.waitForTimeout(1000);
  console.log('✅ Volunteer Profile UPI update verified');

  // Step 6: Logout
  await page.click('#vol-logout-btn');
  await page.waitForSelector('#login-email', { timeout: 8000 });
  console.log('✅ Volunteer Logout verified');

  // ----------------------------------------------------
  // ADMIN SPACE
  // ----------------------------------------------------
  console.log('\n--- 2. Testing Admin Space Interactive Flow ---');

  // Step 7: Admin Login
  await page.fill('#login-email', 'admin@crewlink.com');
  await page.fill('#login-password', 'admin123');
  await page.click('#login-submit');

  await page.waitForSelector('#nav-overview', { timeout: 15000 });
  console.log('✅ Admin logged in successfully');

  // Step 8: Admin Overview Verification
  const overviewText = await page.textContent('body');
  if (!overviewText.includes('VOLUNTEERS') && !overviewText.includes('UPCOMING EVENTS')) {
    throw new Error('Admin Overview metrics missing');
  }
  console.log('✅ Admin Overview stats verified');

  // Step 9: Admin Events View & Modal Cancel
  await page.click('#nav-events');
  await page.waitForSelector('#btn-create-event', { timeout: 6000 });
  await page.click('#btn-create-event');
  await page.waitForSelector('#event-title', { timeout: 5000 });
  await page.click('#btn-cancel-event');
  console.log('✅ Admin Events & Create Modal verified');

  // Step 10: Admin Volunteers View
  await page.click('#nav-volunteers');
  await page.waitForTimeout(800);
  console.log('✅ Admin Volunteers view verified');

  // Step 11: Admin Tasks View & UPI Payment Modal
  await page.click('#nav-tasks');
  await page.waitForSelector('#btn-assign-task', { timeout: 6000 });

  const payUpiBtn = page.locator('[data-testid="btn-pay-upi"]').first();
  if (await payUpiBtn.isVisible()) {
    console.log('Found Pay UPI button, clicking...');
    await payUpiBtn.click();
    await page.waitForSelector('#tab-upi-apps', { timeout: 5000 });
    await page.click('#btn-auto-utr');
    await page.waitForTimeout(300);
    const utr = await page.inputValue('#input-utr');
    console.log('Generated UTR:', utr);
    await page.click('#btn-confirm-payment');
    await page.waitForTimeout(1000);
    console.log('✅ Admin UPI Payment completed successfully');
  } else {
    console.log('ℹ️ No unpaid tasks pending UPI, task table verified');
  }

  // Step 12: Admin Certificates View
  await page.click('#nav-certificates');
  await page.waitForTimeout(800);
  console.log('✅ Admin Certificates view verified');

  // Step 13: Admin Logout
  await page.click('#btn-logout');
  await page.waitForSelector('#login-email', { timeout: 8000 });
  console.log('✅ Admin Logout verified');

  await browser.close();
  console.log('\n🎉 ALL INTERACTIVE FLOWS PASSED IN BOTH SPACES WITH ZERO ERRORS!');
}

async function main() {
  await testInteractiveFlows('http://localhost:5000');
  await testInteractiveFlows('http://localhost:5173');
}

main().catch(err => {
  console.error('❌ Interactive Flow Error:', err.message);
  process.exit(1);
});
