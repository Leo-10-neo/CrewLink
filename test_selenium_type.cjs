// test_selenium_type.cjs
// Replicates exactly what Selenium IDE does with 'type' command on React inputs
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1550, height: 878 } });
  const page = await ctx.newPage();

  console.log('Navigating to home...');
  await page.goto('http://localhost:5000/', { waitUntil: 'networkidle' });
  await page.click('#home-btn-volunteer');
  await page.waitForSelector('#reg-username', { timeout: 10000 });
  console.log('Registration form loaded');

  // Try page.type() - simulates key-by-key (closest to Selenium)
  await page.click('#reg-username');
  await page.type('#reg-username', 'TestUserPari');
  await page.waitForTimeout(300);

  const val = await page.inputValue('#reg-username');
  console.log('After page.type():', val);

  // Fill rest and next
  await page.fill('#reg-email', 'pari@gmail.com');
  await page.fill('#reg-password', 'pari123');
  await page.fill('#reg-confirmPassword', 'pari123');
  await page.click('#reg-btn-next');
  await page.waitForTimeout(1000);

  const hasFullName = await page.$('#reg-fullName');
  console.log('Step 2 loaded (reg-fullName present):', !!hasFullName);

  await browser.close();
})().catch(e => console.error('Error:', e.message));
