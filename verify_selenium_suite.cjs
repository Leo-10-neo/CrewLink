// verify_selenium_suite.cjs
// Runs all test cases that are packaged into CrewLink_Selenium_IDE_Tests.side
const { chromium } = require('playwright');

async function runTests() {
  console.log('🚀 Starting CrewLink Selenium IDE Suite Verification...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 }
  });
  const page = await context.newPage();

  const baseUrl = 'http://localhost:5173';
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`▶ Running: ${name} ... `);
      await fn();
      console.log('✅ PASSED');
      passed++;
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
      failed++;
    }
  }

  // Test 1: Admin Login and Overview
  await test('01_Admin_Login_And_Overview', async () => {
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#login-email', { timeout: 10000 });
    await page.fill('#login-email', 'admin@crewlink.com');
    await page.fill('#login-password', 'admin123');
    await page.click('#login-submit');

    await page.waitForSelector('#nav-overview', { timeout: 15000 });
    const hasEvents = await page.$('#nav-events');
    const hasVolunteers = await page.$('#nav-volunteers');
    const hasTasks = await page.$('#nav-tasks');
    const hasCertificates = await page.$('#nav-certificates');
    const hasLogout = await page.$('#btn-logout');

    if (!hasEvents || !hasVolunteers || !hasTasks || !hasCertificates || !hasLogout) {
      throw new Error('Sidebar navigation items missing on Admin Dashboard');
    }
  });

  // Test 2: Admin Navigation Views
  await test('02_Admin_Navigation_Views', async () => {
    // Navigate to Events
    await page.click('#nav-events');
    await page.waitForSelector('#btn-create-event', { timeout: 5000 });

    // Navigate to Volunteers
    await page.click('#nav-volunteers');
    await page.waitForTimeout(600);

    // Navigate to Tasks
    await page.click('#nav-tasks');
    await page.waitForSelector('#btn-assign-task', { timeout: 5000 });

    // Navigate to Certificates
    await page.click('#nav-certificates');
    await page.waitForTimeout(600);

    // Back to Overview
    await page.click('#nav-overview');
    await page.waitForTimeout(600);
  });

  // Test 3: Admin Create Event Modal
  await test('03_Admin_Create_Event_Modal', async () => {
    await page.click('#nav-events');
    await page.waitForSelector('#btn-create-event', { timeout: 5000 });
    await page.click('#btn-create-event');

    await page.waitForSelector('#event-title', { timeout: 5000 });
    await page.fill('#event-title', 'Selenium Test Tech Meetup 2026');
    await page.fill('#event-location', 'Main Campus Auditorium');
    await page.fill('#event-description', 'Automated test event created via Selenium IDE test runner.');
    await page.fill('#event-rules', 'Follow badge protocols and safety guidelines.');
    await page.fill('#event-date', '2026-11-20T10:00');
    await page.fill('#event-capacity', '100');
    await page.fill('#event-price', '0');

    const hasCancel = await page.$('#btn-cancel-event');
    const hasSubmit = await page.$('#btn-submit-event');
    if (!hasCancel || !hasSubmit) throw new Error('Event modal action buttons not found');

    await page.click('#btn-cancel-event');
    await page.waitForTimeout(500);
  });

  // Test 4: Admin Tasks and UPI Payment Modal
  await test('04_Admin_Tasks_And_UPI_Payment_Modal', async () => {
    await page.click('#nav-tasks');
    await page.waitForSelector('[data-testid="btn-pay-upi"]', { timeout: 8000 });

    // Click UPI Payment button
    await page.click('[data-testid="btn-pay-upi"]');

    // Verify UPI Modal tabs and buttons
    await page.waitForSelector('#tab-upi-apps', { timeout: 5000 });
    const hasQrTab = await page.$('#tab-upi-qr');
    const hasGpay = await page.$('#btn-gpay');
    const hasPhonePe = await page.$('#btn-phonepe');
    const hasOtherUpi = await page.$('#btn-other-upi');
    const hasAutoUtr = await page.$('#btn-auto-utr');
    const hasUtrInput = await page.$('#input-utr');
    const hasCancel = await page.$('#btn-cancel-payment');
    const hasConfirm = await page.$('#btn-confirm-payment');

    if (!hasQrTab || !hasGpay || !hasPhonePe || !hasOtherUpi || !hasAutoUtr || !hasUtrInput || !hasCancel || !hasConfirm) {
      throw new Error('UPI Payment Modal elements missing');
    }

    // Switch to QR tab
    await page.click('#tab-upi-qr');
    await page.waitForTimeout(400);

    // Switch back to Apps tab
    await page.click('#tab-upi-apps');
    await page.waitForTimeout(400);

    // Click Auto UTR generator
    await page.click('#btn-auto-utr');
    const utrVal = await page.inputValue('#input-utr');
    if (!utrVal || !utrVal.startsWith('UPI')) {
      throw new Error('Auto UTR did not generate value');
    }

    // Close Modal via Cancel
    await page.click('#btn-cancel-payment');
    await page.waitForTimeout(500);
  });

  // Test 5: Admin Logout
  await test('05_Admin_Logout', async () => {
    await page.waitForSelector('#btn-logout', { timeout: 5000 });
    await page.click('#btn-logout');
    await page.waitForSelector('#login-email', { timeout: 10000 });
  });

  // Test 6: Volunteer Login and Profile Settings
  await test('06_Volunteer_Login_And_Profile_UPI', async () => {
    await page.waitForSelector('#login-email', { timeout: 5000 });
    await page.fill('#login-email', 'ani@gmail.com');
    await page.fill('#login-password', 'ani123');
    await page.click('#login-submit');

    await page.waitForSelector('#vol-nav-profile', { timeout: 15000 });
    await page.click('#vol-nav-profile');

    await page.waitForSelector('#vol-input-upiId', { timeout: 6000 });
    await page.fill('#vol-input-upiId', '9876543210@upi');
    await page.click('#vol-save-profile-btn');
    await page.waitForTimeout(1000);
  });

  // Test 7: Volunteer Navigation and Logout
  await test('07_Volunteer_Navigation_And_Logout', async () => {
    await page.click('#vol-nav-events');
    await page.waitForTimeout(600);
    await page.click('#vol-nav-tasks');
    await page.waitForTimeout(600);
    await page.click('#vol-nav-attendance');
    await page.waitForTimeout(600);
    await page.click('#vol-nav-certificates');
    await page.waitForTimeout(600);

    await page.waitForSelector('#vol-logout-btn', { timeout: 5000 });
    await page.click('#vol-logout-btn');
    await page.waitForSelector('#login-email', { timeout: 10000 });
  });

  await browser.close();

  console.log('\n========================================');
  console.log(`📊 Suite Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL 7 TESTS PASSED WITH 0 ERRORS!');
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
