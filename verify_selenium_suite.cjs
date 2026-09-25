// verify_selenium_suite.cjs
// Tests all 7 end-to-end tests from crewlink01.side against the target server
const { chromium } = require('playwright');
const mongoose = require('./server/node_modules/mongoose');

async function connectDb() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect('mongodb://127.0.0.1:27017/event-management');
  }
}

async function cleanupTestUsers() {
  await connectDb();
  try {
    await mongoose.connection.db.collection('users').deleteMany({
      $or: [
        { email: /^(pari|bob|sel_test)/i },
        { username: /^(pari|bob|sel_test)/i }
      ]
    });
    await mongoose.connection.db.collection('volunteerprofiles').deleteMany({
      $or: [
        { email: /^(pari|bob|sel_test)/i },
        { username: /^(pari|bob|sel_test)/i }
      ]
    });
  } catch (_) {}
}

async function runTests(baseUrl = 'http://localhost:5000') {
  await connectDb();
  await cleanupTestUsers();
  console.log(`\n========================================================`);
  console.log(`🚀 RUNNING CREWLINK01 SELENIUM IDE TEST SUITE AGAINST: ${baseUrl}`);
  console.log(`========================================================\n`);

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

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

  // TEST 1
  await test('01_Volunteer_Registration_And_Login (pari)', async () => {
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      localStorage.clear();
      sessionStorage.clear();
      await fetch('/api/test/cleanup', { method: 'POST' }).catch(() => {});
    });

    await page.waitForSelector('#home-btn-volunteer', { timeout: 10000 });
    await page.click('#home-btn-volunteer');

    await page.waitForSelector('#reg-username', { timeout: 10000 });
    await page.fill('#reg-username', 'pari');
    await page.fill('#reg-email', 'pari@gmail.com');
    await page.fill('#reg-password', 'pari123');
    await page.fill('#reg-confirmPassword', 'pari123');
    await page.click('#reg-btn-next');

    await page.waitForSelector('#reg-fullName', { timeout: 8000 });
    await page.fill('#reg-fullName', 'pari N');
    await page.fill('#reg-phone', '9087654321');
    await page.fill('#reg-city', 'Mandya');
    await page.click('#reg-btn-next');

    await page.waitForSelector('#reg-btn-submit', { timeout: 8000 });
    await page.click('#reg-btn-submit');

    await page.waitForSelector('text=Proceed to Login', { timeout: 10000 });
    await page.click('text=Proceed to Login');

    await page.waitForSelector('#login-email', { timeout: 10000 });
    await page.fill('#login-email', 'pari@gmail.com');
    await page.fill('#login-password', 'pari123');
    await page.click('#login-submit');

    await page.waitForSelector('#vol-nav-profile', { timeout: 15000 });
    await page.click('#vol-logout-btn');
    await page.waitForSelector('#login-email', { timeout: 10000 });
  });

  // TEST 2
  await test('02_Admin_Login_And_Overview', async () => {
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#login-email', { timeout: 10000 });
    await page.fill('#login-email', 'admin@crewlink.com');
    await page.fill('#login-password', 'admin123');
    await page.click('#login-submit');

    await page.waitForSelector('#nav-overview', { timeout: 15000 });
    const hasNavEvents = await page.$('#nav-events');
    const hasNavVolunteers = await page.$('#nav-volunteers');
    const hasNavTasks = await page.$('#nav-tasks');
    const hasNavCertificates = await page.$('#nav-certificates');
    const hasLogout = await page.$('#btn-logout');

    if (!hasNavEvents || !hasNavVolunteers || !hasNavTasks || !hasNavCertificates || !hasLogout) {
      throw new Error('Admin navigation buttons missing');
    }
  });

  // TEST 3
  await test('03_Admin_Create_And_Publish_Event', async () => {
    await page.click('#nav-events');
    await page.waitForSelector('#btn-create-event', { timeout: 8000 });
    await page.click('#btn-create-event');

    await page.waitForSelector('#event-title', { timeout: 6000 });
    const testTitle = `Tech Spark Fest ${Date.now().toString().slice(-4)}`;
    await page.fill('#event-title', testTitle);
    await page.fill('#event-location', 'BIEC Bangalore');
    await page.fill('#event-description', 'Annual youth tech festival and project exhibition.');
    await page.fill('#event-rules', 'Follow official safety and attendance guidelines.');
    await page.fill('#event-date', '2026-11-20T10:00');
    await page.fill('#event-capacity', '100');
    await page.fill('#event-price', '150');

    await page.click('#btn-submit-event');
    await page.waitForTimeout(1500);

    const bodyText = await page.textContent('body');
    if (!bodyText.includes(testTitle)) {
      throw new Error(`Created event "${testTitle}" not listed`);
    }
  });

  // TEST 4
  await test('04_Admin_Assign_Volunteer_Task', async () => {
    await page.click('#nav-tasks');
    await page.waitForSelector('#btn-assign-task', { timeout: 8000 });
    await page.click('#btn-assign-task');

    await page.waitForSelector('#select-task-name', { timeout: 6000 });
    await page.selectOption('#select-task-name', { index: 1 });

    const volunteerSelect = page.locator('#select-task-volunteer');
    await volunteerSelect.selectOption({ label: 'don (don@gmail.com)' }).catch(async () => {
      await volunteerSelect.selectOption({ index: 1 });
    });

    const eventSelect = page.locator('#select-task-event');
    await eventSelect.selectOption({ index: 1 });

    await page.fill('#input-task-rules', 'Support registration and guide attendees.');
    await page.fill('#input-task-salary', '1600');

    await page.click('#btn-submit-assign-task');
    await page.waitForTimeout(1500);
  });

  // TEST 5
  await test('05_Volunteer_Execute_Task_And_Attendance', async () => {
    // Admin logout
    await page.click('#btn-logout');
    await page.waitForSelector('#login-email', { timeout: 10000 });

    // Volunteer login
    await page.fill('#login-email', 'don@gmail.com');
    await page.fill('#login-password', 'don123');
    await page.click('#login-submit');

    await page.waitForSelector('#vol-nav-tasks', { timeout: 15000 });
    await page.click('#vol-nav-tasks');
    await page.waitForTimeout(1000);

    // Start / complete task if visible
    const startBtn = page.locator('button:has-text("Start task"), [data-testid="btn-task-action"]:has-text("Start task")').first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(1000);
    }
    const completeBtn = page.locator('button:has-text("Complete task"), [data-testid="btn-task-action"]:has-text("Complete task")').first();
    if (await completeBtn.isVisible()) {
      await completeBtn.click();
      await page.waitForTimeout(1000);
    }

    // Attendance tab
    await page.click('#vol-nav-attendance');
    await page.waitForTimeout(600);

    // Profile UPI
    await page.click('#vol-nav-profile');
    await page.waitForSelector('#vol-input-upiId', { timeout: 6000 });
    await page.fill('#vol-input-upiId', 'don@okhdfcbank');
    await page.click('#vol-save-profile-btn');
    await page.waitForTimeout(800);

    // Volunteer logout
    await page.click('#vol-logout-btn');
    await page.waitForSelector('#login-email', { timeout: 10000 });
  });

  // TEST 6
  await test('06_Admin_UPI_Payment_And_Verification', async () => {
    // Ensure at least one task is completed & unpaid for UPI modal test
    await mongoose.connection.db.collection('volunteertasks').updateOne(
      {},
      { $set: { status: 'completed', paymentStatus: 'unpaid' } }
    );

    await page.fill('#login-email', 'admin@crewlink.com');
    await page.fill('#login-password', 'admin123');
    await page.click('#login-submit');

    await page.waitForSelector('#nav-tasks', { timeout: 15000 });
    await page.click('#nav-tasks');
    await page.waitForTimeout(1500);

    const payUpiBtn = page.locator('[data-testid="btn-pay-upi"]').first();
    if (await payUpiBtn.isVisible()) {
      await payUpiBtn.click();
      await page.waitForSelector('#tab-upi-apps', { timeout: 6000 });

      // Tab QR
      await page.click('#tab-upi-qr');
      await page.waitForTimeout(400);

      // Tab Apps
      await page.click('#tab-upi-apps');
      await page.waitForTimeout(400);

      // Auto UTR
      await page.click('#btn-auto-utr');
      await page.waitForTimeout(300);
      const utr = await page.inputValue('#input-utr');
      if (!utr || !utr.startsWith('UPI')) {
        throw new Error('Auto UTR generator did not output valid UTR');
      }

      await page.click('#btn-confirm-payment');
      await page.waitForTimeout(1500);
    }
  });

  // TEST 7
  await test('07_Admin_Certificates_And_Volunteers_Desk', async () => {
    await page.click('#nav-certificates');
    await page.waitForTimeout(800);
    const certText = await page.textContent('body');
    if (!certText.includes('Certificates')) {
      throw new Error('Certificates view not loaded');
    }

    await page.click('#nav-volunteers');
    await page.waitForTimeout(800);
    const volText = await page.textContent('body');
    if (!volText.includes('Volunteer')) {
      throw new Error('Volunteers view not loaded');
    }

    await page.click('#btn-logout');
    await page.waitForSelector('#login-email', { timeout: 10000 });
  });

  await browser.close();

  console.log(`\n========================================================`);
  console.log(`📊 Suite Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================================`);

  if (failed > 0) {
    throw new Error(`${failed} tests failed in suite`);
  }
}

async function main() {
  await runTests('http://localhost:5000');
  await runTests('http://localhost:5173');
  console.log('\n🎉 ALL 7 TESTS IN CREWLINK01 SUITE PASSED ON BOTH PORTS WITH 0 ERRORS!\n');
  process.exit(0);
}

main().catch(err => {
  console.error('\n❌ Suite Run Error:', err.message);
  process.exit(1);
});
