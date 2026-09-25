// build_crewlink01_suite.cjs
const fs = require('fs');
const path = require('path');

function makeSafeType(target, value) {
  const safeTarget = (target || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const safeVal = (value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `if(window.__type){window.__type("${safeTarget}","${safeVal}");}else{var sel="${safeTarget}";var val="${safeVal}";var el;if(sel.startsWith("id="))el=document.getElementById(sel.substring(3));else if(sel.startsWith("css="))el=document.querySelector(sel.substring(4));else if(sel.startsWith("name="))el=document.querySelector('[name="'+sel.substring(5)+'"]');else if(sel.startsWith("//")||sel.startsWith("xpath=")){var xp=sel.replace(/^xpath=/,"");el=document.evaluate(xp,document,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue;}else{el=document.querySelector(sel)||document.getElementById(sel);}if(el){var proto=(el instanceof HTMLTextAreaElement)?window.HTMLTextAreaElement.prototype:window.HTMLInputElement.prototype;var s=Object.getOwnPropertyDescriptor(proto,"value")?.set;if(s){s.call(el,val);}else{el.value=val;}el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));el.dispatchEvent(new Event("blur",{bubbles:true}));}}`;
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
        { command: "open", target: "/", value: "", comment: "Open Home Page" },
        { command: "setWindowSize", target: "1366x768", value: "", comment: "Set Window Size" },
        { command: "executeScript", target: "localStorage.clear(); sessionStorage.clear();", value: "", comment: "Clear Storage" },
        { command: "executeAsyncScript", target: "var done = arguments[arguments.length - 1]; fetch('/api/test/cleanup', {method:'POST'}).then(function(r){return r.json()}).then(function(d){done('ok:'+d.deletedCount)}).catch(function(e){done('err')});", value: "", comment: "Clean up test user pari if exists" },
        { command: "waitForElementVisible", target: "id=home-btn-volunteer", value: "10000", comment: "Wait for Become Volunteer button" },
        { command: "click", target: "id=home-btn-volunteer", value: "", comment: "Click Become Volunteer" },
        { command: "waitForElementVisible", target: "id=reg-username", value: "10000", comment: "Wait for Registration Form" },
        { command: "click", target: "id=reg-username", value: "", comment: "Focus Username" },
        { command: "executeScript", target: makeSafeType("id=reg-username", "pari"), value: "", comment: "Enter Username pari" },
        { command: "executeScript", target: makeSafeType("id=reg-email", "pari@gmail.com"), value: "", comment: "Enter Email" },
        { command: "executeScript", target: makeSafeType("id=reg-password", "pari123"), value: "", comment: "Enter Password" },
        { command: "executeScript", target: makeSafeType("id=reg-confirmPassword", "pari123"), value: "", comment: "Enter Confirm Password" },
        { command: "click", target: "id=reg-btn-next", value: "", comment: "Next to Step 2" },
        { command: "waitForElementVisible", target: "id=reg-fullName", value: "8000", comment: "Wait for Full Name" },
        { command: "executeScript", target: makeSafeType("id=reg-fullName", "pari N"), value: "", comment: "Enter Full Name" },
        { command: "executeScript", target: makeSafeType("id=reg-phone", "9087654321"), value: "", comment: "Enter Phone" },
        { command: "executeScript", target: makeSafeType("id=reg-city", "Mandya"), value: "", comment: "Enter City" },
        { command: "click", target: "id=reg-btn-next", value: "", comment: "Next to Step 3" },
        { command: "waitForElementVisible", target: "id=reg-btn-submit", value: "8000", comment: "Wait for Submit button" },
        { command: "click", target: "id=reg-btn-submit", value: "", comment: "Submit Registration" },
        { command: "waitForElementVisible", target: "linkText=Proceed to Login", value: "10000", comment: "Wait for Proceed to Login" },
        { command: "click", target: "linkText=Proceed to Login", value: "", comment: "Proceed to Login" },
        { command: "waitForElementVisible", target: "id=login-email", value: "10000", comment: "Wait for Login page" },
        { command: "executeScript", target: makeSafeType("id=login-email", "pari@gmail.com"), value: "", comment: "Enter Login Email" },
        { command: "executeScript", target: makeSafeType("id=login-password", "pari123"), value: "", comment: "Enter Login Password" },
        { command: "click", target: "id=login-submit", value: "", comment: "Click Sign In" },
        { command: "waitForElementVisible", target: "id=vol-nav-profile", value: "15000", comment: "Verify Volunteer Dashboard loaded" },
        { command: "assertElementPresent", target: "id=vol-nav-profile", value: "", comment: "Assert Profile tab present" },
        { command: "click", target: "id=vol-logout-btn", value: "", comment: "Volunteer Logout" },
        { command: "waitForElementVisible", target: "id=login-email", value: "10000", comment: "Returned to Login" }
      ]
    },

    // -------------------------------------------------------------
    // TEST 2: Admin Login and Overview Dashboard
    // -------------------------------------------------------------
    {
      id: "test-02-admin-login-overview",
      name: "02_Admin_Login_And_Overview",
      commands: [
        { command: "open", target: "/login", value: "", comment: "Open Login Page" },
        { command: "setWindowSize", target: "1366x768", value: "", comment: "Set Window Size" },
        { command: "waitForElementVisible", target: "id=login-email", value: "10000", comment: "Wait for Email input" },
        { command: "executeScript", target: makeSafeType("id=login-email", "admin@crewlink.com"), value: "", comment: "Enter Admin Email" },
        { command: "executeScript", target: makeSafeType("id=login-password", "admin123"), value: "", comment: "Enter Admin Password" },
        { command: "click", target: "id=login-submit", value: "", comment: "Click Sign In" },
        { command: "waitForElementVisible", target: "id=nav-overview", value: "15000", comment: "Wait for Overview Tab" },
        { command: "assertElementPresent", target: "id=nav-overview", value: "", comment: "Overview Tab Present" },
        { command: "assertElementPresent", target: "id=nav-events", value: "", comment: "Events Tab Present" },
        { command: "assertElementPresent", target: "id=nav-volunteers", value: "", comment: "Volunteers Tab Present" },
        { command: "assertElementPresent", target: "id=nav-tasks", value: "", comment: "Tasks Tab Present" },
        { command: "assertElementPresent", target: "id=nav-certificates", value: "", comment: "Certificates Tab Present" },
        { command: "assertElementPresent", target: "id=btn-logout", value: "", comment: "Logout Button Present" }
      ]
    },

    // -------------------------------------------------------------
    // TEST 3: Admin Event Creation and Publishing
    // -------------------------------------------------------------
    {
      id: "test-03-admin-create-event",
      name: "03_Admin_Create_And_Publish_Event",
      commands: [
        { command: "open", target: "/admin/dashboard", value: "", comment: "Navigate to Admin Dashboard" },
        { command: "waitForElementVisible", target: "id=nav-events", value: "10000", comment: "Wait for Events Navigation" },
        { command: "click", target: "id=nav-events", value: "", comment: "Open Events View" },
        { command: "waitForElementVisible", target: "id=btn-create-event", value: "8000", comment: "Wait for Create Event Button" },
        { command: "click", target: "id=btn-create-event", value: "", comment: "Click Create Event" },
        { command: "waitForElementVisible", target: "id=event-title", value: "6000", comment: "Wait for Event Title Input" },
        { command: "executeScript", target: makeSafeType("id=event-title", "Tech Spark Fest 2026"), value: "", comment: "Enter Event Title" },
        { command: "executeScript", target: makeSafeType("id=event-location", "Bangalore International Exhibition Centre"), value: "", comment: "Enter Location" },
        { command: "executeScript", target: makeSafeType("id=event-description", "Annual national technology, robotics, and innovation youth festival."), value: "", comment: "Enter Description" },
        { command: "executeScript", target: makeSafeType("id=event-rules", "Wear official volunteer badges at all times. Follow safety guidelines."), value: "", comment: "Enter Rules" },
        { command: "executeScript", target: makeSafeType("id=event-date", "2026-11-25T10:00"), value: "", comment: "Enter Date and Time" },
        { command: "executeScript", target: makeSafeType("id=event-capacity", "150"), value: "", comment: "Enter Capacity" },
        { command: "executeScript", target: makeSafeType("id=event-price", "200"), value: "", comment: "Enter Price" },
        { command: "click", target: "id=btn-submit-event", value: "", comment: "Submit Event Creation" },
        { command: "pause", target: "1500", value: "", comment: "Allow event creation to save" },
        { command: "waitForElementVisible", target: "id=btn-create-event", value: "8000", comment: "Events view refreshed with new event" }
      ]
    },

    // -------------------------------------------------------------
    // TEST 4: Admin Volunteer Task Assignment
    // -------------------------------------------------------------
    {
      id: "test-04-admin-assign-task",
      name: "04_Admin_Assign_Volunteer_Task",
      commands: [
        { command: "open", target: "/admin/dashboard", value: "", comment: "Navigate to Admin Dashboard" },
        { command: "waitForElementVisible", target: "id=nav-tasks", value: "10000", comment: "Wait for Tasks Tab" },
        { command: "click", target: "id=nav-tasks", value: "", comment: "Click Tasks & Attendance" },
        { command: "waitForElementVisible", target: "id=btn-assign-task", value: "8000", comment: "Wait for Assign Task button" },
        { command: "click", target: "id=btn-assign-task", value: "", comment: "Open Assign Task Modal" },
        { command: "waitForElementVisible", target: "id=select-task-name", value: "6000", comment: "Wait for Task Dropdown" },
        { command: "executeScript", target: "var el = document.getElementById('select-task-name'); if (el && el.options.length > 1) { el.selectedIndex = 1; el.dispatchEvent(new Event('change', {bubbles: true})); }", value: "", comment: "Select Task Name" },
        { command: "executeScript", target: "var el = document.getElementById('select-task-volunteer'); if (el && el.options.length > 1) { el.selectedIndex = 1; el.dispatchEvent(new Event('change', {bubbles: true})); }", value: "", comment: "Select Volunteer" },
        { command: "executeScript", target: "var el = document.getElementById('select-task-event'); if (el && el.options.length > 1) { el.selectedIndex = 1; el.dispatchEvent(new Event('change', {bubbles: true})); }", value: "", comment: "Select Event" },
        { command: "executeScript", target: makeSafeType("id=input-task-rules", "Guide guests, coordinate tech demos, and support event flow."), value: "", comment: "Enter Task Rules" },
        { command: "executeScript", target: makeSafeType("id=input-task-salary", "1500"), value: "", comment: "Enter Stipend Amount" },
        { command: "click", target: "id=btn-submit-assign-task", value: "", comment: "Submit Task Assignment" },
        { command: "pause", target: "1500", value: "", comment: "Allow task to be created" },
        { command: "waitForElementVisible", target: "id=btn-assign-task", value: "8000", comment: "Tasks view refreshed" }
      ]
    },

    // -------------------------------------------------------------
    // TEST 5: Volunteer Space - Tasks, Attendance & Profile
    // -------------------------------------------------------------
    {
      id: "test-05-volunteer-space-execution",
      name: "05_Volunteer_Execute_Task_And_Attendance",
      commands: [
        { command: "open", target: "/login", value: "", comment: "Open Login Page" },
        { command: "waitForElementVisible", target: "id=login-email", value: "10000", comment: "Wait for Login page" },
        { command: "executeScript", target: makeSafeType("id=login-email", "don@gmail.com"), value: "", comment: "Enter Volunteer Email" },
        { command: "executeScript", target: makeSafeType("id=login-password", "don123"), value: "", comment: "Enter Volunteer Password" },
        { command: "click", target: "id=login-submit", value: "", comment: "Sign In as Volunteer" },
        { command: "waitForElementVisible", target: "id=vol-nav-tasks", value: "15000", comment: "Wait for Volunteer Dashboard" },
        { command: "click", target: "id=vol-nav-tasks", value: "", comment: "Open My Tasks" },
        { command: "pause", target: "1200", value: "", comment: "Allow tasks to render" },
        { command: "executeScript", target: "var btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Start task')); if (btn) btn.click();", value: "", comment: "Start task if pending" },
        { command: "pause", target: "1000", value: "", comment: "Wait for task status update" },
        { command: "executeScript", target: "var btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Complete task')); if (btn) btn.click();", value: "", comment: "Complete task" },
        { command: "pause", target: "1000", value: "", comment: "Wait for completion update" },
        { command: "click", target: "id=vol-nav-attendance", value: "", comment: "Check Attendance History" },
        { command: "pause", target: "800", value: "", comment: "View Attendance log" },
        { command: "click", target: "id=vol-nav-certificates", value: "", comment: "Check Certificates Tab" },
        { command: "pause", target: "800", value: "", comment: "View Certificates" },
        { command: "click", target: "id=vol-nav-profile", value: "", comment: "Open Profile Settings" },
        { command: "waitForElementVisible", target: "id=vol-input-upiId", value: "6000", comment: "Wait for UPI input" },
        { command: "executeScript", target: makeSafeType("id=vol-input-upiId", "don@okhdfcbank"), value: "", comment: "Update UPI ID" },
        { command: "click", target: "id=vol-save-profile-btn", value: "", comment: "Save Profile Settings" },
        { command: "pause", target: "1000", value: "", comment: "Allow profile update to save" },
        { command: "click", target: "id=vol-logout-btn", value: "", comment: "Volunteer Logout" },
        { command: "waitForElementVisible", target: "id=login-email", value: "10000", comment: "Returned to Login Page" }
      ]
    },

    // -------------------------------------------------------------
    // TEST 6: Admin UPI Payment Modal & Verification
    // -------------------------------------------------------------
    {
      id: "test-06-admin-upi-payment",
      name: "06_Admin_UPI_Payment_And_Verification",
      commands: [
        { command: "open", target: "/login", value: "", comment: "Open Login Page" },
        { command: "waitForElementVisible", target: "id=login-email", value: "10000", comment: "Wait for Email input" },
        { command: "executeScript", target: makeSafeType("id=login-email", "admin@crewlink.com"), value: "", comment: "Enter Admin Email" },
        { command: "executeScript", target: makeSafeType("id=login-password", "admin123"), value: "", comment: "Enter Admin Password" },
        { command: "click", target: "id=login-submit", value: "", comment: "Sign In as Admin" },
        { command: "waitForElementVisible", target: "id=nav-tasks", value: "15000", comment: "Wait for Dashboard" },
        { command: "click", target: "id=nav-tasks", value: "", comment: "Open Tasks & Attendance view" },
        { command: "pause", target: "1500", value: "", comment: "Allow tasks table to load" },
        { command: "executeScript", target: "var btn = document.querySelector('[data-testid=\"btn-pay-upi\"]'); if (btn) btn.click();", value: "", comment: "Click Pay via UPI for completed task" },
        { command: "pause", target: "1000", value: "", comment: "Allow UPI modal to open" },
        { command: "executeScript", target: "var qr = document.getElementById('tab-upi-qr'); if (qr) qr.click();", value: "", comment: "View Dynamic UPI QR Code tab" },
        { command: "pause", target: "500", value: "", comment: "View QR code" },
        { command: "executeScript", target: "var apps = document.getElementById('tab-upi-apps'); if (apps) apps.click();", value: "", comment: "Switch back to Apps tab" },
        { command: "pause", target: "500", value: "", comment: "View Apps tab" },
        { command: "executeScript", target: "var autoUtr = document.getElementById('btn-auto-utr'); if (autoUtr) autoUtr.click();", value: "", comment: "Auto-generate UTR Transaction Number" },
        { command: "pause", target: "500", value: "", comment: "Wait for UTR generation" },
        { command: "executeScript", target: "var confirmBtn = document.getElementById('btn-confirm-payment'); if (confirmBtn) confirmBtn.click();", value: "", comment: "Confirm Payment" },
        { command: "pause", target: "1500", value: "", comment: "Allow payment confirmation to save" }
      ]
    },

    // -------------------------------------------------------------
    // TEST 7: Admin Certificates & Volunteers Desk Management
    // -------------------------------------------------------------
    {
      id: "test-07-admin-desks-and-logout",
      name: "07_Admin_Certificates_And_Volunteers_Desk",
      commands: [
        { command: "open", target: "/admin/dashboard", value: "", comment: "Navigate to Admin Dashboard" },
        { command: "waitForElementVisible", target: "id=nav-certificates", value: "10000", comment: "Wait for Certificates Navigation" },
        { command: "click", target: "id=nav-certificates", value: "", comment: "Open Certificates Desk" },
        { command: "pause", target: "1000", value: "", comment: "View Certificates Desk" },
        { command: "click", target: "id=nav-volunteers", value: "", comment: "Open Volunteers Directory" },
        { command: "pause", target: "1000", value: "", comment: "Review Volunteers Desk" },
        { command: "click", target: "id=nav-overview", value: "", comment: "Return to Overview Command Centre" },
        { command: "pause", target: "800", value: "", comment: "Overview Command Centre verified" },
        { command: "click", target: "id=btn-logout", value: "", comment: "Click Logout" },
        { command: "waitForElementVisible", target: "id=login-email", value: "10000", comment: "Wiped session and returned to Login" }
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

// Write to:
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

console.log(`\n🎉 Successfully packaged all features into:`);
console.log(`  - ${desktopPath}`);
console.log(`  - ${desktopSuitePath}`);
console.log(`  - ${localCrewlink01}`);
console.log(`  - ${localSuite}`);
console.log(`Total tests: ${suiteData.tests.length}`);
suiteData.tests.forEach((t, i) => console.log(`  ${i+1}. ${t.name} (${t.commands.length} steps)`));
