// patch_side_file.cjs
// Patches CrewLink_Selenium_IDE_Tests.side to:
// 1. Add a cleanup API call before registration so test can be re-run
// 2. Add step 3 Experience form submit so full registration completes
// 3. Wait for "Proceed to Login" success screen before navigating
const fs = require('fs');

const MAIN_SIDE = 'c:/Users/Nihal Wesly G/mern-project/CrewLink_Selenium_IDE_Tests.side';
const DESKTOP_SIDE = 'c:/Users/Nihal Wesly G/OneDrive/Desktop/CrewLink_Selenium_IDE_Tests.side';

const side = JSON.parse(fs.readFileSync(MAIN_SIDE, 'utf8'));

const regTest = side.tests.find(t => t.name === 'new volunteer login');
if (!regTest) {
  console.error('Could not find "new volunteer login" test');
  process.exit(1);
}

console.log('Original step count:', regTest.commands.length);
regTest.commands.forEach((c, i) => {
  console.log(`  ${i}: ${c.command} | ${String(c.target).slice(0, 60)}`);
});

// ── Step 1: Insert cleanup fetch AFTER step 2 (executeScript session clear) ──
// Selenium IDE's executeAsyncScript waits for done() to be called
const cleanupFetch = `var done = arguments[arguments.length - 1]; fetch('/api/test/cleanup', {method:'POST'}).then(function(r){return r.json()}).then(function(d){done('ok:'+d.deletedCount)}).catch(function(e){done('err')});`;

const cleanupStep = {
  id: 'aaa-cleanup-step-001',
  comment: 'DELETE previous test volunteer accounts so re-runs do not fail with User Already Exists',
  command: 'executeAsyncScript',
  target: cleanupFetch,
  targets: [],
  value: ''
};

// Insert after index 2 (executeScript)
const execIdx = regTest.commands.findIndex(c => c.command === 'executeScript');
regTest.commands.splice(execIdx + 1, 0, cleanupStep);

// ── Step 2: Add Step 3 (experience) submission before pause/open /login ──────
const pauseIdx = regTest.commands.findIndex(c => c.command === 'pause');
console.log('\nPause step now at index:', pauseIdx);

// Only add step-3 steps if reg-btn-submit is not already in the commands
const hasSubmit = regTest.commands.some(c => c.target === 'id=reg-btn-submit');
if (!hasSubmit) {
  const step3Steps = [
    {
      id: 'bbb-step3-wait-submit',
      comment: 'Wait for Step 3 Experience form to appear',
      command: 'waitForElementVisible',
      target: 'id=reg-btn-submit',
      targets: [['id=reg-btn-submit', 'id'], ['css=#reg-btn-submit', 'css:finder']],
      value: '8000'
    },
    {
      id: 'bbb-step3-click-submit',
      comment: 'Click Complete Registration',
      command: 'click',
      target: 'id=reg-btn-submit',
      targets: [['id=reg-btn-submit', 'id'], ['css=#reg-btn-submit', 'css:finder']],
      value: ''
    },
    {
      id: 'bbb-step3-wait-success',
      comment: 'Wait for Registration Success screen with Proceed to Login button',
      command: 'waitForElementVisible',
      target: 'linkText=Proceed to Login',
      targets: [['linkText=Proceed to Login', 'linkText'], ['css=a.btn-primary', 'css:finder']],
      value: '10000'
    },
    {
      id: 'bbb-step3-click-proceed',
      comment: 'Click Proceed to Login link',
      command: 'click',
      target: 'linkText=Proceed to Login',
      targets: [['linkText=Proceed to Login', 'linkText'], ['css=a.btn-primary', 'css:finder']],
      value: ''
    }
  ];

  // Insert BEFORE the pause step
  regTest.commands.splice(pauseIdx, 0, ...step3Steps);

  // Now remove the pause step (no longer needed, replaced by actual waits)
  const newPauseIdx = regTest.commands.findIndex(c => c.command === 'pause');
  if (newPauseIdx !== -1) {
    regTest.commands.splice(newPauseIdx, 1);
  }

  // Also remove the stale "open /login" step since Proceed to Login navigates there already
  const openLoginIdx = regTest.commands.findIndex(c => c.command === 'open' && c.target === '/login');
  if (openLoginIdx !== -1) {
    regTest.commands.splice(openLoginIdx, 1);
    console.log('Removed stale open /login step');
  }
}

console.log('\nUpdated step count:', regTest.commands.length);
regTest.commands.forEach((c, i) => {
  console.log(`  ${i}: ${c.command} | ${String(c.target).slice(0, 70)} | value=${c.value || ''}`);
});

// Write back to both locations
const json = JSON.stringify(side, null, 2);
fs.writeFileSync(MAIN_SIDE, json);
console.log('\n✅ Written to:', MAIN_SIDE);

try {
  fs.writeFileSync(DESKTOP_SIDE, json);
  console.log('✅ Written to:', DESKTOP_SIDE);
} catch (e) {
  console.warn('⚠️  Could not write Desktop copy:', e.message);
}

console.log('\n✅ Patch complete! .side file updated successfully.');
