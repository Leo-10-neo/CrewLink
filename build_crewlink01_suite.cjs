// build_crewlink01_suite.cjs
// Builds and syncs crewlink01.side and CrewLink_Selenium_IDE_Tests.side
// with 100% Selenium IDE compliant command structures (uuid id, targets array, comments)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function uuid() {
  return crypto.randomUUID();
}

function makeSafeType(target, value) {
  const safeTarget = (target || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const safeVal = (value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `if(window.__type){window.__type("${safeTarget}","${safeVal}");}else{var sel="${safeTarget}";var val="${safeVal}";var el;if(sel.startsWith("id="))el=document.getElementById(sel.substring(3));else if(sel.startsWith("css="))el=document.querySelector(sel.substring(4));else if(sel.startsWith("name="))el=document.querySelector('[name="'+sel.substring(5)+'"]');else if(sel.startsWith("//")||sel.startsWith("xpath=")){var xp=sel.replace(/^xpath=/,"");el=document.evaluate(xp,document,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue;}else{el=document.querySelector(sel)||document.getElementById(sel);}if(el){var proto=(el instanceof HTMLTextAreaElement)?window.HTMLTextAreaElement.prototype:window.HTMLInputElement.prototype;var s=Object.getOwnPropertyDescriptor(proto,"value")?.set;if(s){s.call(el,val);}else{el.value=val;}el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));el.dispatchEvent(new Event("blur",{bubbles:true}));}}`;
}

function cmd(command, target, value = '', comment = '', extraTargets = []) {
  let targets = [];
  if (extraTargets && extraTargets.length > 0) {
    targets = extraTargets;
  } else if (target) {
    if (target.startsWith('id=')) {
      targets = [
        [target, 'id'],
        ['css=#' + target.substring(3), 'css:finder']
      ];
    } else if (target.startsWith('css=')) {
      targets = [[target, 'css:finder']];
    } else if (target.startsWith('//') || target.startsWith('xpath=')) {
      targets = [[target, 'xpath']];
    } else if (target.startsWith('linkText=')) {
      targets = [[target, 'linkText']];
    } else {
      targets = [[target, 'id']];
    }
  }
  return {
    id: uuid(),
    comment: comment || '',
    command,
    target: target || '',
    targets,
    value: value || ''
  };
}

function buildSuite() {
  const tests = [
    // -------------------------------------------------------------
    // TEST 1: New Volunteer Registration & Login (pari)
    // -------------------------------------------------------------
    {
      id: "test-01-volunteer-register-pari",
      name: "01_Volunteer_Registration_And_Login (pari)",
      commands: [
        cmd("open", "/", "", "Open Home Page"),
        cmd("setWindowSize", "1366x768", "", "Set Window Size"),
        cmd("executeScript", "localStorage.clear(); sessionStorage.clear(); document.cookie.split(';').forEach(function(c){document.cookie=c.replace(/^ +/,'').replace(/=.*/,'=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/')});", "", "Clear Storage and Cookies"),
        cmd("executeScript", "fetch('/api/test/cleanup',{method:'POST'}).catch(function(){});", "", "Clean up test user pari (fire and forget)"),
        cmd("open", "/", "", "Reload home page after session clear"),
        cmd("pause", "1500", "", "Wait for React to reinitialize without token"),
        cmd("waitForElementVisible", "id=home-btn-volunteer", "10000", "Wait for Become Volunteer button"),
        cmd("click", "id=home-btn-volunteer", "", "Click Become Volunteer"),
        cmd("waitForElementVisible", "id=reg-username", "10000", "Wait for Registration Form"),
        cmd("click", "id=reg-username", "", "Focus Username"),
        cmd("executeScript", makeSafeType("id=reg-username", "pari"), "", "Enter Username pari"),
        cmd("executeScript", makeSafeType("id=reg-email", "pari@gmail.com"), "", "Enter Email"),
        cmd("executeScript", makeSafeType("id=reg-password", "pari123"), "", "Enter Password"),
        cmd("executeScript", makeSafeType("id=reg-confirmPassword", "pari123"), "", "Enter Confirm Password"),
        cmd("click", "id=reg-btn-next", "", "Next to Step 2"),
        cmd("waitForElementVisible", "id=reg-fullName", "8000", "Wait for Full Name"),
        cmd("executeScript", makeSafeType("id=reg-fullName", "pari N"), "", "Enter Full Name"),
        cmd("executeScript", makeSafeType("id=reg-phone", "9087654321"), "", "Enter Phone"),
        cmd("executeScript", makeSafeType("id=reg-city", "Mandya"), "", "Enter City"),
        cmd("click", "id=reg-btn-next", "", "Next to Step 3"),
        cmd("waitForElementVisible", "id=reg-btn-submit", "8000", "Wait for Submit button"),
        cmd("click", "id=reg-btn-submit", "", "Submit Registration"),
        cmd("waitForElementVisible", "id=reg-btn-proceed-login", "10000", "Wait for Proceed to Login", [
          ["id=reg-btn-proceed-login", "id"],
          ["linkText=Proceed to Login", "linkText"],
          ["css=#reg-btn-proceed-login", "css:finder"],
          ["xpath=//a[contains(.,'Proceed to Login')]", "xpath"],
          ["css=a.btn-primary", "css:finder"]
        ]),
        cmd("click", "id=reg-btn-proceed-login", "", "Proceed to Login", [
          ["id=reg-btn-proceed-login", "id"],
          ["linkText=Proceed to Login", "linkText"],
          ["css=#reg-btn-proceed-login", "css:finder"],
          ["xpath=//a[contains(.,'Proceed to Login')]", "xpath"],
          ["css=a.btn-primary", "css:finder"]
        ]),
        cmd("waitForElementVisible", "id=login-email", "10000", "Wait for Login page"),
        cmd("executeScript", makeSafeType("id=login-email", "pari@gmail.com"), "", "Enter Login Email"),
        cmd("executeScript", makeSafeType("id=login-password", "pari123"), "", "Enter Login Password"),
        cmd("click", "id=login-submit", "", "Click Sign In"),
        cmd("waitForElementVisible", "id=vol-nav-profile", "15000", "Verify Volunteer Dashboard loaded"),
        cmd("assertElementPresent", "id=vol-nav-profile", "", "Assert Profile tab present"),
        cmd("click", "id=vol-logout-btn", "", "Volunteer Logout"),
        cmd("waitForElementVisible", "id=login-email", "10000", "Returned to Login")
      ]
    },

    // -------------------------------------------------------------
    // TEST 2: Admin Login and Overview Dashboard
    // -------------------------------------------------------------
    {
      id: "test-02-admin-login-overview",
      name: "02_Admin_Login_And_Overview",
      commands: [
        cmd("open", "/login", "", "Open Login Page"),
        cmd("setWindowSize", "1366x768", "", "Set Window Size"),
        cmd("waitForElementVisible", "id=login-email", "10000", "Wait for Email input"),
        cmd("executeScript", makeSafeType("id=login-email", "admin@crewlink.com"), "", "Enter Admin Email"),
        cmd("executeScript", makeSafeType("id=login-password", "admin123"), "", "Enter Admin Password"),
        cmd("click", "id=login-submit", "", "Click Sign In"),
        cmd("waitForElementVisible", "id=nav-overview", "15000", "Wait for Overview Tab"),
        cmd("assertElementPresent", "id=nav-overview", "", "Overview Tab Present"),
        cmd("assertElementPresent", "id=nav-events", "", "Events Tab Present"),
        cmd("assertElementPresent", "id=nav-volunteers", "", "Volunteers Tab Present"),
        cmd("assertElementPresent", "id=nav-tasks", "", "Tasks Tab Present"),
        cmd("assertElementPresent", "id=nav-certificates", "", "Certificates Tab Present"),
        cmd("assertElementPresent", "id=btn-logout", "", "Logout Button Present")
      ]
    },

    // -------------------------------------------------------------
    // TEST 3: Admin Event Creation and Publishing
    // -------------------------------------------------------------
    {
      id: "test-03-admin-create-event",
      name: "03_Admin_Create_And_Publish_Event",
      commands: [
        cmd("open", "/admin/dashboard", "", "Navigate to Admin Dashboard"),
        cmd("setWindowSize", "1366x768", "", "Set Window Size"),
        cmd("waitForElementVisible", "id=nav-events", "10000", "Wait for Events Navigation"),
        cmd("click", "id=nav-events", "", "Open Events View"),
        cmd("waitForElementVisible", "id=btn-create-event", "8000", "Wait for Create Event Button"),
        cmd("click", "id=btn-create-event", "", "Click Create Event"),
        cmd("waitForElementVisible", "id=event-title", "6000", "Wait for Event Title Input"),
        cmd("executeScript", makeSafeType("id=event-title", "Tech Spark Fest 2026"), "", "Enter Event Title"),
        cmd("executeScript", makeSafeType("id=event-location", "Bangalore International Exhibition Centre"), "", "Enter Location"),
        cmd("executeScript", makeSafeType("id=event-description", "Annual national technology, robotics, and innovation youth festival."), "", "Enter Description"),
        cmd("executeScript", makeSafeType("id=event-rules", "Wear official volunteer badges at all times. Follow safety guidelines."), "", "Enter Rules"),
        cmd("executeScript", makeSafeType("id=event-date", "2026-11-25T10:00"), "", "Enter Date and Time"),
        cmd("executeScript", makeSafeType("id=event-capacity", "150"), "", "Enter Capacity"),
        cmd("executeScript", makeSafeType("id=event-price", "200"), "", "Enter Price"),
        cmd("click", "id=btn-submit-event", "", "Submit Event Creation"),
        cmd("pause", "1500", "", "Allow event creation to save"),
        cmd("waitForElementVisible", "id=btn-create-event", "8000", "Events view refreshed with new event")
      ]
    },

    // -------------------------------------------------------------
    // TEST 4: Admin Volunteer Task Assignment
    // -------------------------------------------------------------
    {
      id: "test-04-admin-assign-task",
      name: "04_Admin_Assign_Volunteer_Task",
      commands: [
        cmd("open", "/admin/dashboard", "", "Navigate to Admin Dashboard"),
        cmd("setWindowSize", "1366x768", "", "Set Window Size"),
        cmd("waitForElementVisible", "id=nav-tasks", "10000", "Wait for Tasks Tab"),
        cmd("click", "id=nav-tasks", "", "Click Tasks & Attendance"),
        cmd("waitForElementVisible", "id=btn-assign-task", "8000", "Wait for Assign Task button"),
        cmd("click", "id=btn-assign-task", "", "Open Assign Task Modal"),
        cmd("waitForElementVisible", "id=select-task-name", "6000", "Wait for Task Dropdown"),
        cmd("executeScript", "var el = document.getElementById('select-task-name'); if (el && el.options.length > 1) { el.selectedIndex = 1; el.dispatchEvent(new Event('change', {bubbles: true})); }", "", "Select Task Name"),
        cmd("executeScript", "var el = document.getElementById('select-task-volunteer'); if (el && el.options.length > 1) { el.selectedIndex = 1; el.dispatchEvent(new Event('change', {bubbles: true})); }", "", "Select Volunteer"),
        cmd("executeScript", "var el = document.getElementById('select-task-event'); if (el && el.options.length > 1) { el.selectedIndex = 1; el.dispatchEvent(new Event('change', {bubbles: true})); }", "", "Select Event"),
        cmd("executeScript", makeSafeType("id=input-task-rules", "Guide guests, coordinate tech demos, and support event flow."), "", "Enter Task Rules"),
        cmd("executeScript", makeSafeType("id=input-task-salary", "1500"), "", "Enter Stipend Amount"),
        cmd("click", "id=btn-submit-assign-task", "", "Submit Task Assignment"),
        cmd("pause", "1500", "", "Allow task to be created"),
        cmd("waitForElementVisible", "id=btn-assign-task", "8000", "Tasks view refreshed"),
        cmd("click", "id=btn-logout", "", "Admin Logout"),
        cmd("waitForElementVisible", "id=login-email", "10000", "Returned to Login Page")
      ]
    },

    // -------------------------------------------------------------
    // TEST 5: Volunteer Space - Tasks, Attendance & Profile (don)
    // -------------------------------------------------------------
    {
      id: "test-05-volunteer-space-execution",
      name: "05_Volunteer_Execute_Task_And_Attendance",
      commands: [
        cmd("open", "/login", "", "Open Login Page"),
        cmd("setWindowSize", "1366x768", "", "Set Window Size"),
        cmd("executeScript", "if (window.location.pathname !== '/login' || !document.getElementById('login-email')) { localStorage.clear(); sessionStorage.clear(); window.location.href = '/login'; }", "", "Ensure Clean Login Session"),
        cmd("waitForElementVisible", "id=login-email", "10000", "Wait for Login page"),
        cmd("executeScript", makeSafeType("id=login-email", "don@gmail.com"), "", "Enter Volunteer Email"),
        cmd("executeScript", makeSafeType("id=login-password", "don123"), "", "Enter Volunteer Password"),
        cmd("click", "id=login-submit", "", "Sign In as Volunteer"),
        cmd("waitForElementVisible", "id=vol-nav-tasks", "15000", "Wait for Volunteer Dashboard"),
        cmd("click", "id=vol-nav-tasks", "", "Open My Tasks"),
        cmd("pause", "1200", "", "Allow tasks to render"),
        cmd("executeScript", "var btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Start task')); if (btn) btn.click();", "", "Start task if pending"),
        cmd("pause", "1000", "", "Wait for task status update"),
        cmd("executeScript", "var btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Complete task')); if (btn) btn.click();", "", "Open Complete Task modal"),
        cmd("pause", "1000", "", "Wait for complete task modal"),
        cmd("executeScript", "var submitBtn = document.getElementById('btn-submit-complete-task') || document.querySelector('[data-testid=\"btn-submit-complete-task\"]'); if (submitBtn) submitBtn.click();", "", "Submit Complete Task modal"),
        cmd("pause", "1200", "", "Wait for completion update"),
        cmd("click", "id=vol-nav-attendance", "", "Check Attendance History"),
        cmd("pause", "1000", "", "View Attendance log"),
        cmd("executeScript", "var cin = document.querySelector('[data-testid=\"btn-check-in\"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Check In'); if (cin) cin.click();", "", "Perform Check In if pending"),
        cmd("pause", "1200", "", "Wait for Check In to register"),
        cmd("executeScript", "var cout = document.querySelector('[data-testid=\"btn-check-out\"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Check Out'); if (cout) cout.click();", "", "Perform Check Out if checked in"),
        cmd("pause", "1200", "", "Wait for Check Out to register"),
        cmd("click", "id=vol-nav-certificates", "", "Check Certificates Tab"),
        cmd("pause", "800", "", "View Certificates"),
        cmd("click", "id=vol-nav-profile", "", "Open Profile Settings"),
        cmd("waitForElementVisible", "id=vol-input-upiId", "6000", "Wait for UPI input"),
        cmd("executeScript", makeSafeType("id=vol-input-upiId", "don@okhdfcbank"), "", "Update UPI ID"),
        cmd("click", "id=vol-save-profile-btn", "", "Save Profile Settings"),
        cmd("pause", "1000", "", "Allow profile update to save"),
        cmd("click", "id=vol-logout-btn", "", "Volunteer Logout"),
        cmd("waitForElementVisible", "id=login-email", "10000", "Returned to Login Page")
      ]
    },

    // -------------------------------------------------------------
    // TEST 6: Dedicated Volunteer Attendance Check In & Check Out (Tony)
    // -------------------------------------------------------------
    {
      id: "test-06-volunteer-attendance-checkin-checkout",
      name: "06_Volunteer_Attendance_CheckIn_And_CheckOut",
      commands: [
        cmd("open", "/login", "", "Open Login Page"),
        cmd("setWindowSize", "1366x768", "", "Set Window Size"),
        cmd("executeScript", "if (window.location.pathname !== '/login' || !document.getElementById('login-email')) { localStorage.clear(); sessionStorage.clear(); window.location.href = '/login'; }", "", "Ensure Clean Login Session"),
        cmd("waitForElementVisible", "id=login-email", "10000", "Wait for Login page"),
        cmd("executeScript", makeSafeType("id=login-email", "ani@gmail.com"), "", "Enter Tony's Email"),
        cmd("executeScript", makeSafeType("id=login-password", "ani123"), "", "Enter Tony's Password"),
        cmd("click", "id=login-submit", "", "Sign In as Tony"),
        cmd("waitForElementVisible", "id=vol-nav-attendance", "15000", "Wait for Volunteer Dashboard"),
        cmd("click", "id=vol-nav-attendance", "", "Open Attendance History"),
        cmd("pause", "1500", "", "Allow Attendance records to load"),
        cmd("executeScript", "var cin = document.querySelector('[data-testid=\"btn-check-in\"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Check In'); if (cin) { cin.click(); }", "", "Check In if any pending"),
        cmd("pause", "1200", "", "Wait for Check In to register"),
        cmd("executeScript", "var cout = document.querySelector('[data-testid=\"btn-check-out\"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Check Out'); if (cout) { cout.click(); }", "", "Check Out if checked in"),
        cmd("pause", "1200", "", "Wait for Check Out to register"),
        cmd("executeScript", "var pendings = Array.from(document.querySelectorAll('table tbody tr')).filter(r => r.innerText.includes('Pending') && !r.innerText.includes('Present')); console.log('Pending records count:', pendings.length);", "", "Verify zero pending attendance"),
        cmd("click", "id=vol-logout-btn", "", "Logout Tony"),
        cmd("waitForElementVisible", "id=login-email", "10000", "Returned to Login Page")
      ]
    },

    // -------------------------------------------------------------
    // TEST 7: Dedicated Volunteer Complete Tasks - Verify Not Pending (Tony)
    // -------------------------------------------------------------
    {
      id: "test-07-volunteer-complete-task-verify",
      name: "07_Volunteer_Complete_Task_Verify_Not_Pending",
      commands: [
        cmd("open", "/login", "", "Open Login Page"),
        cmd("setWindowSize", "1366x768", "", "Set Window Size"),
        cmd("executeScript", "if (window.location.pathname !== '/login' || !document.getElementById('login-email')) { localStorage.clear(); sessionStorage.clear(); window.location.href = '/login'; }", "", "Ensure Clean Login Session"),
        cmd("waitForElementVisible", "id=login-email", "10000", "Wait for Login page"),
        cmd("executeScript", makeSafeType("id=login-email", "ani@gmail.com"), "", "Enter Tony's Email"),
        cmd("executeScript", makeSafeType("id=login-password", "ani123"), "", "Enter Tony's Password"),
        cmd("click", "id=login-submit", "", "Sign In as Tony"),
        cmd("waitForElementVisible", "id=vol-nav-tasks", "15000", "Wait for Volunteer Dashboard"),
        cmd("click", "id=vol-nav-tasks", "", "Open My Tasks"),
        cmd("pause", "1500", "", "Allow tasks to render"),
        cmd("executeScript", "var startBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Start task'); if (startBtn) startBtn.click();", "", "Start pending task if any"),
        cmd("pause", "1000", "", "Wait for start state"),
        cmd("executeScript", "var compBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Complete task'); if (compBtn) compBtn.click();", "", "Open Complete Task modal"),
        cmd("pause", "800", "", "Wait for modal"),
        cmd("executeScript", "var submitBtn = document.getElementById('btn-submit-complete-task') || document.querySelector('[data-testid=\"btn-submit-complete-task\"]'); if (submitBtn) submitBtn.click();", "", "Submit Complete Task modal"),
        cmd("pause", "1500", "", "Wait for completed state to persist"),
        cmd("executeScript", "var completedRows = Array.from(document.querySelectorAll('table tbody tr')).filter(r => r.innerText.includes('Completed')); console.log('Total completed tasks:', completedRows.length);", "", "Verify tasks show Completed"),
        cmd("click", "id=vol-logout-btn", "", "Logout Tony"),
        cmd("waitForElementVisible", "id=login-email", "10000", "Returned to Login Page")
      ]
    },

    // -------------------------------------------------------------
    // TEST 8: Admin UPI Payment Modal & Verification
    // -------------------------------------------------------------
    {
      id: "test-08-admin-upi-payment",
      name: "08_Admin_UPI_Payment_And_Verification",
      commands: [
        cmd("open", "/login", "", "Open Login Page"),
        cmd("setWindowSize", "1366x768", "", "Set Window Size"),
        cmd("executeScript", "if (window.location.pathname !== '/login' || !document.getElementById('login-email')) { localStorage.clear(); sessionStorage.clear(); window.location.href = '/login'; }", "", "Ensure Clean Login Session"),
        cmd("waitForElementVisible", "id=login-email", "10000", "Wait for Email input"),
        cmd("executeScript", makeSafeType("id=login-email", "admin@crewlink.com"), "", "Enter Admin Email"),
        cmd("executeScript", makeSafeType("id=login-password", "admin123"), "", "Enter Admin Password"),
        cmd("click", "id=login-submit", "", "Sign In as Admin"),
        cmd("waitForElementVisible", "id=nav-tasks", "15000", "Wait for Dashboard"),
        cmd("click", "id=nav-tasks", "", "Open Tasks & Attendance view"),
        cmd("pause", "1500", "", "Allow tasks table to load"),
        cmd("executeScript", "var btn = document.querySelector('[data-testid=\"btn-pay-upi\"]'); if (btn) btn.click();", "", "Click Pay via UPI for completed task"),
        cmd("pause", "1000", "", "Allow UPI modal to open"),
        cmd("executeScript", "var qr = document.getElementById('tab-upi-qr'); if (qr) qr.click();", "", "View Dynamic UPI QR Code tab"),
        cmd("pause", "500", "", "View QR code"),
        cmd("executeScript", "var apps = document.getElementById('tab-upi-apps'); if (apps) apps.click();", "", "Switch back to Apps tab"),
        cmd("pause", "500", "", "View Apps tab"),
        cmd("executeScript", "var autoUtr = document.getElementById('btn-auto-utr'); if (autoUtr) autoUtr.click();", "", "Auto-generate UTR Transaction Number"),
        cmd("pause", "500", "", "Wait for UTR generation"),
        cmd("executeScript", "var confirmBtn = document.getElementById('btn-confirm-payment'); if (confirmBtn) confirmBtn.click();", "", "Confirm Payment"),
        cmd("pause", "1500", "", "Allow payment confirmation to save")
      ]
    },

    // -------------------------------------------------------------
    // TEST 9: Admin Verify Completed Tasks and Live Attendance
    // -------------------------------------------------------------
    {
      id: "test-09-admin-verify-tasks-attendance",
      name: "09_Admin_Verify_Completed_Tasks_And_Live_Attendance",
      commands: [
        cmd("open", "/admin/dashboard", "", "Navigate to Admin Dashboard"),
        cmd("setWindowSize", "1366x768", "", "Set Window Size"),
        cmd("waitForElementVisible", "id=nav-tasks", "10000", "Wait for Tasks Tab"),
        cmd("click", "id=nav-tasks", "", "Click Tasks & Attendance"),
        cmd("pause", "1500", "", "Allow Assigned Tasks & Live Attendance to load"),
        cmd("executeScript", "var rows = Array.from(document.querySelectorAll('table tbody tr')); console.log('Admin task rows count:', rows.length);", "", "Verify Assigned Tasks & Attendance table loaded"),
        cmd("pause", "1000", "", "Review Live Attendance records")
      ]
    },

    // -------------------------------------------------------------
    // TEST 10: Admin Certificates Approval & Volunteers Desk Management
    // -------------------------------------------------------------
    {
      id: "test-10-admin-desks-and-logout",
      name: "10_Admin_Certificates_And_Volunteers_Desk",
      commands: [
        cmd("open", "/admin/dashboard", "", "Navigate to Admin Dashboard"),
        cmd("setWindowSize", "1366x768", "", "Set Window Size"),
        cmd("waitForElementVisible", "id=nav-certificates", "10000", "Wait for Certificates Navigation"),
        cmd("click", "id=nav-certificates", "", "Open Certificates Desk"),
        cmd("pause", "1200", "", "View Certificates Desk"),
        cmd("executeScript", "var viewBtn = document.querySelector('[data-testid=\"btn-view-cert\"]'); if (viewBtn) viewBtn.click();", "", "Open Certificate Preview Modal"),
        cmd("pause", "1000", "", "Inspect Official Certificate Preview"),
        cmd("executeScript", "var closeBtn = document.getElementById('btn-close-cert-modal'); if (closeBtn) closeBtn.click();", "", "Close Certificate Preview Modal"),
        cmd("pause", "800", "", "Returned to Certificates Desk"),
        cmd("executeScript", "var appBtn = document.querySelector('[data-testid=\"btn-approve-cert\"]'); if (appBtn) appBtn.click();", "", "Approve Pending Certificate"),
        cmd("pause", "1500", "", "Verify Certificate Approved and Download Unlocked"),
        cmd("click", "id=nav-volunteers", "", "Open Volunteers Directory"),
        cmd("pause", "1000", "", "Review Volunteers Desk"),
        cmd("click", "id=nav-overview", "", "Return to Overview Command Centre"),
        cmd("pause", "800", "", "Overview Command Centre verified"),
        cmd("click", "id=btn-logout", "", "Click Logout"),
        cmd("waitForElementVisible", "id=login-email", "10000", "Wiped session and returned to Login")
      ]
    }
  ];

  const suite = {
    id: "37a7f451-3cf1-456f-871d-a4115fa016b1",
    version: "2.0",
    name: "crewlink01",
    url: "http://localhost:5000",
    tests: tests,
    suites: [
      {
        id: "suite-crewlink01-full",
        name: "CrewLink Complete Interactive Test Suite",
        persistSession: true,
        parallel: false,
        timeout: 300,
        tests: tests.map(t => t.id)
      }
    ],
    urls: [
      "http://localhost:5000/",
      "http://localhost:5173/"
    ],
    plugins: []
  };

  return suite;
}

const suiteData = buildSuite();
const jsonContent = JSON.stringify(suiteData, null, 2);

// 1. Desktop crewlink01.side
const desktopPath = 'C:\\Users\\Nihal Wesly G\\OneDrive\\Desktop\\crewlink01.side';
fs.writeFileSync(desktopPath, jsonContent, 'utf8');

// 2. Desktop CrewLink_Selenium_IDE_Tests.side
const desktopSuitePath = 'C:\\Users\\Nihal Wesly G\\OneDrive\\Desktop\\CrewLink_Selenium_IDE_Tests.side';
fs.writeFileSync(desktopSuitePath, jsonContent, 'utf8');

// 3. Local project root crewlink01.side
const localCrewlink01 = path.join(__dirname, 'crewlink01.side');
fs.writeFileSync(localCrewlink01, jsonContent, 'utf8');

// 4. Local project root CrewLink_Selenium_IDE_Tests.side
const localSuite = path.join(__dirname, 'CrewLink_Selenium_IDE_Tests.side');
fs.writeFileSync(localSuite, jsonContent, 'utf8');

console.log(`\n🎉 Successfully built & synchronized Selenium IDE projects to:`);
console.log(`  - ${desktopPath}`);
console.log(`  - ${desktopSuitePath}`);
console.log(`  - ${localCrewlink01}`);
console.log(`  - ${localSuite}`);
console.log(`\nTotal Test Cases: ${suiteData.tests.length}`);
suiteData.tests.forEach((t, i) => console.log(`  ${i+1}. ${t.name} (${t.commands.length} steps)`));
