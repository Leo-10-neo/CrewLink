// generate_side_file.cjs
// Generates the standard CrewLink_Selenium_IDE_Tests.side project file
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function uuid() {
  return crypto.randomUUID();
}

function cmd(command, target, value = '', comment = '', targets = []) {
  return {
    id: uuid(),
    comment,
    command,
    target,
    targets: targets.length > 0 ? targets : [[target, 'id']],
    value
  };
}

const tests = [
  {
    id: 'c99e4f21-729f-4ee7-910a-e3746654e808',
    name: 'new volunteer login',
    commands: [
      cmd('open', '/', '', 'Open CrewLink Home Page'),
      cmd('setWindowSize', '1550x878', '', 'Set Browser Size'),
      cmd('waitForElementVisible', 'id=home-btn-volunteer', '10000', 'Wait for Become a Volunteer button', [
        ['id=home-btn-volunteer', 'id'],
        ['linkText=Become a Volunteer', 'linkText'],
        ['css=#home-btn-volunteer', 'css:finder'],
        ['xpath=//a[@id="home-btn-volunteer"]', 'xpath:attributes']
      ]),
      cmd('click', 'id=home-btn-volunteer', '', 'Click Become a Volunteer', [
        ['id=home-btn-volunteer', 'id'],
        ['linkText=Become a Volunteer', 'linkText'],
        ['css=#home-btn-volunteer', 'css:finder']
      ]),
      cmd('waitForElementVisible', 'id=reg-username', '10000', 'Wait for registration form', [
        ['id=reg-username', 'id'],
        ['name=username', 'name'],
        ['css=#reg-username', 'css:finder']
      ]),
      cmd('click', 'id=reg-username', '', 'Focus Username', [
        ['id=reg-username', 'id'],
        ['name=username', 'name']
      ]),
      cmd('type', 'id=reg-username', 'Bob', 'Enter Username', [
        ['id=reg-username', 'id'],
        ['name=username', 'name']
      ]),
      cmd('type', 'id=reg-email', 'bob@gmail.com', 'Enter Email', [
        ['id=reg-email', 'id'],
        ['name=email', 'name']
      ]),
      cmd('type', 'id=reg-password', 'bob123', 'Enter Password', [
        ['id=reg-password', 'id'],
        ['name=password', 'name']
      ]),
      cmd('type', 'id=reg-confirmPassword', 'bob123', 'Confirm Password', [
        ['id=reg-confirmPassword', 'id'],
        ['name=confirmPassword', 'name']
      ]),
      cmd('click', 'id=reg-btn-next', '', 'Click Next Step', [
        ['id=reg-btn-next', 'id'],
        ['css=#reg-btn-next', 'css:finder']
      ]),
      cmd('waitForElementVisible', 'id=reg-fullName', '6000', 'Wait for Personal Details step', [
        ['id=reg-fullName', 'id'],
        ['name=fullName', 'name']
      ]),
      cmd('type', 'id=reg-fullName', 'Bob Volunteer', 'Enter Full Name', [
        ['id=reg-fullName', 'id'],
        ['name=fullName', 'name']
      ]),
      cmd('type', 'id=reg-phone', '9164335467', 'Enter Phone', [
        ['id=reg-phone', 'id'],
        ['name=phone', 'name']
      ]),
      cmd('type', 'id=reg-city', 'Bengaluru', 'Enter City', [
        ['id=reg-city', 'id'],
        ['name=city', 'name']
      ]),
      cmd('click', 'id=reg-btn-next', '', 'Click Next Step', [
        ['id=reg-btn-next', 'id'],
        ['css=#reg-btn-next', 'css:finder']
      ]),
      cmd('pause', '600', '', 'Experience step reached'),
      cmd('open', '/login', '', 'Go to Login page'),
      cmd('waitForElementVisible', 'id=login-email', '8000', 'Wait for Login Email input', [
        ['id=login-email', 'id'],
        ['name=email', 'name']
      ]),
      cmd('type', 'id=login-email', 'bob@gmail.com', 'Enter Bob Email', [
        ['id=login-email', 'id'],
        ['name=email', 'name']
      ]),
      cmd('type', 'id=login-password', 'bob123', 'Enter Bob Password', [
        ['id=login-password', 'id'],
        ['name=password', 'name']
      ]),
      cmd('click', 'id=login-submit', '', 'Click Sign In', [
        ['id=login-submit', 'id'],
        ['css=#login-submit', 'css:finder']
      ]),
      cmd('waitForElementVisible', 'id=vol-nav-profile', '15000', 'Wait for Volunteer Dashboard', [
        ['id=vol-nav-profile', 'id'],
        ['css=#vol-nav-profile', 'css:finder']
      ]),
      cmd('assertElementPresent', 'id=vol-nav-profile', '', 'Confirmed Volunteer Dashboard loaded'),
      cmd('click', 'id=vol-logout-btn', '', 'Click Volunteer Logout', [
        ['id=vol-logout-btn', 'id'],
        ['css=#vol-logout-btn', 'css:finder']
      ]),
      cmd('waitForElementVisible', 'id=login-email', '10000', 'Confirmed logged out')
    ]
  },
  {
    id: 'c99e4f21-729f-4ee7-910a-e3746654e801',
    name: '01_Admin_Login_And_Overview',
    commands: [
      cmd('open', '/login', '', 'Open Login Page', [['/login', 'linkText']]),
      cmd('setWindowSize', '1366x768', '', 'Set Desktop Screen Size'),
      cmd('waitForElementVisible', 'id=login-email', '10000', 'Wait for Email input', [
        ['id=login-email', 'id'],
        ['name=email', 'name'],
        ['css=#login-email', 'css:finder']
      ]),
      cmd('type', 'id=login-email', 'admin@crewlink.com', 'Enter Admin Email', [
        ['id=login-email', 'id'],
        ['name=email', 'name'],
        ['css=#login-email', 'css:finder']
      ]),
      cmd('type', 'id=login-password', 'admin123', 'Enter Admin Password', [
        ['id=login-password', 'id'],
        ['name=password', 'name'],
        ['css=#login-password', 'css:finder']
      ]),
      cmd('click', 'id=login-submit', '', 'Click Sign In Button', [
        ['id=login-submit', 'id'],
        ['css=#login-submit', 'css:finder'],
        ['xpath=//button[@id="login-submit"]', 'xpath:attributes']
      ]),
      cmd('waitForElementVisible', 'id=nav-overview', '15000', 'Wait for Admin Dashboard navigation', [
        ['id=nav-overview', 'id'],
        ['css=#nav-overview', 'css:finder']
      ]),
      cmd('assertElementPresent', 'id=nav-overview', '', 'Verify Overview Tab present'),
      cmd('assertElementPresent', 'id=nav-events', '', 'Verify Events Tab present'),
      cmd('assertElementPresent', 'id=nav-volunteers', '', 'Verify Volunteers Tab present'),
      cmd('assertElementPresent', 'id=nav-tasks', '', 'Verify Tasks Tab present'),
      cmd('assertElementPresent', 'id=nav-certificates', '', 'Verify Certificates Tab present'),
      cmd('assertElementPresent', 'id=btn-logout', '', 'Verify Logout button present')
    ]
  },
  {
    id: 'c99e4f21-729f-4ee7-910a-e3746654e802',
    name: '02_Admin_Navigation_Views',
    commands: [
      cmd('waitForElementVisible', 'id=nav-events', '5000', 'Wait for Events tab'),
      cmd('click', 'id=nav-events', '', 'Navigate to Events View', [
        ['id=nav-events', 'id'],
        ['css=#nav-events', 'css:finder']
      ]),
      cmd('waitForElementVisible', 'id=btn-create-event', '5000', 'Verify Events view loaded', [
        ['id=btn-create-event', 'id'],
        ['css=#btn-create-event', 'css:finder']
      ]),
      cmd('assertElementPresent', 'id=btn-create-event', '', 'Create Event button is visible'),
      cmd('click', 'id=nav-volunteers', '', 'Navigate to Volunteers View', [
        ['id=nav-volunteers', 'id'],
        ['css=#nav-volunteers', 'css:finder']
      ]),
      cmd('pause', '800', '', 'Allow volunteers view to render'),
      cmd('click', 'id=nav-tasks', '', 'Navigate to Tasks & Attendance View', [
        ['id=nav-tasks', 'id'],
        ['css=#nav-tasks', 'css:finder']
      ]),
      cmd('waitForElementVisible', 'id=btn-assign-task', '5000', 'Verify Assign Task button is visible', [
        ['id=btn-assign-task', 'id'],
        ['css=#btn-assign-task', 'css:finder']
      ]),
      cmd('click', 'id=nav-certificates', '', 'Navigate to Certificates View', [
        ['id=nav-certificates', 'id'],
        ['css=#nav-certificates', 'css:finder']
      ]),
      cmd('pause', '800', '', 'Allow certificates view to render'),
      cmd('click', 'id=nav-overview', '', 'Return to Overview', [
        ['id=nav-overview', 'id'],
        ['css=#nav-overview', 'css:finder']
      ]),
      cmd('pause', '800', '', 'Overview rendered cleanly')
    ]
  },
  {
    id: 'c99e4f21-729f-4ee7-910a-e3746654e803',
    name: '03_Admin_Create_Event_Modal',
    commands: [
      cmd('click', 'id=nav-events', '', 'Switch to Events View', [
        ['id=nav-events', 'id'],
        ['css=#nav-events', 'css:finder']
      ]),
      cmd('waitForElementVisible', 'id=btn-create-event', '5000', 'Wait for Create Event button'),
      cmd('click', 'id=btn-create-event', '', 'Open Create Event Modal', [
        ['id=btn-create-event', 'id'],
        ['css=#btn-create-event', 'css:finder']
      ]),
      cmd('waitForElementVisible', 'id=event-title', '5000', 'Wait for Event Title input', [
        ['id=event-title', 'id'],
        ['css=#event-title', 'css:finder']
      ]),
      cmd('type', 'id=event-title', 'Tech Spark Fest 2026', 'Enter Title'),
      cmd('type', 'id=event-location', 'Bengaluru Convention Hall', 'Enter Location'),
      cmd('type', 'id=event-description', 'Annual youth hackathon and cultural technology exhibition.', 'Enter Description'),
      cmd('type', 'id=event-rules', 'Follow event conduct guidelines.', 'Enter Rules'),
      cmd('type', 'id=event-date', '2026-11-20T10:00', 'Enter Date'),
      cmd('type', 'id=event-capacity', '75', 'Enter Capacity'),
      cmd('type', 'id=event-price', '0', 'Enter Price'),
      cmd('assertElementPresent', 'id=btn-submit-event', '', 'Verify Submit button present'),
      cmd('assertElementPresent', 'id=btn-cancel-event', '', 'Verify Cancel button present'),
      cmd('click', 'id=btn-cancel-event', '', 'Close modal via Cancel', [
        ['id=btn-cancel-event', 'id'],
        ['css=#btn-cancel-event', 'css:finder']
      ]),
      cmd('pause', '500', '', 'Modal closed cleanly')
    ]
  },
  {
    id: 'c99e4f21-729f-4ee7-910a-e3746654e804',
    name: '04_Admin_Tasks_And_UPI_Payment_Modal',
    commands: [
      cmd('click', 'id=nav-tasks', '', 'Switch to Tasks & Attendance View', [
        ['id=nav-tasks', 'id'],
        ['css=#nav-tasks', 'css:finder']
      ]),
      cmd('waitForElementVisible', 'css=[data-testid="btn-pay-upi"]', '8000', 'Wait for Pay via UPI button', [
        ['css=[data-testid="btn-pay-upi"]', 'css:finder'],
        ['xpath=//button[@data-testid="btn-pay-upi"]', 'xpath:attributes']
      ]),
      cmd('click', 'css=[data-testid="btn-pay-upi"]', '', 'Open UPI Payment Modal', [
        ['css=[data-testid="btn-pay-upi"]', 'css:finder'],
        ['xpath=//button[@data-testid="btn-pay-upi"]', 'xpath:attributes']
      ]),
      cmd('waitForElementVisible', 'id=tab-upi-apps', '5000', 'Wait for UPI modal', [
        ['id=tab-upi-apps', 'id'],
        ['css=#tab-upi-apps', 'css:finder']
      ]),
      cmd('assertElementPresent', 'id=tab-upi-apps', '', 'UPI Apps tab present'),
      cmd('assertElementPresent', 'id=tab-upi-qr', '', 'UPI QR Code tab present'),
      cmd('assertElementPresent', 'id=btn-gpay', '', 'Google Pay 1-tap option present'),
      cmd('assertElementPresent', 'id=btn-phonepe', '', 'PhonePe 1-tap option present'),
      cmd('assertElementPresent', 'id=btn-other-upi', '', 'Other UPI Apps option present'),
      cmd('click', 'id=tab-upi-qr', '', 'Switch to QR Tab', [
        ['id=tab-upi-qr', 'id'],
        ['css=#tab-upi-qr', 'css:finder']
      ]),
      cmd('pause', '500', '', 'View QR code'),
      cmd('click', 'id=tab-upi-apps', '', 'Switch back to Apps Tab', [
        ['id=tab-upi-apps', 'id'],
        ['css=#tab-upi-apps', 'css:finder']
      ]),
      cmd('waitForElementVisible', 'id=btn-auto-utr', '3000', 'Wait for Auto UTR button', [
        ['id=btn-auto-utr', 'id'],
        ['css=#btn-auto-utr', 'css:finder']
      ]),
      cmd('click', 'id=btn-auto-utr', '', 'Click Auto-Generate Ref', [
        ['id=btn-auto-utr', 'id'],
        ['css=#btn-auto-utr', 'css:finder']
      ]),
      cmd('assertElementPresent', 'id=input-utr', '', 'Verify UTR input populated'),
      cmd('assertElementPresent', 'id=btn-confirm-payment', '', 'Verify Confirm Payment button present'),
      cmd('assertElementPresent', 'id=btn-cancel-payment', '', 'Verify Cancel Payment button present'),
      cmd('click', 'id=btn-cancel-payment', '', 'Close UPI Payment Modal', [
        ['id=btn-cancel-payment', 'id'],
        ['css=#btn-cancel-payment', 'css:finder']
      ]),
      cmd('pause', '600', '', 'Modal closed cleanly')
    ]
  },
  {
    id: 'c99e4f21-729f-4ee7-910a-e3746654e805',
    name: '05_Admin_Logout',
    commands: [
      cmd('waitForElementVisible', 'id=btn-logout', '5000', 'Wait for Admin Logout button', [
        ['id=btn-logout', 'id'],
        ['css=#btn-logout', 'css:finder']
      ]),
      cmd('click', 'id=btn-logout', '', 'Click Logout', [
        ['id=btn-logout', 'id'],
        ['css=#btn-logout', 'css:finder']
      ]),
      cmd('waitForElementVisible', 'id=login-email', '10000', 'Verify returned to Login Screen', [
        ['id=login-email', 'id'],
        ['css=#login-email', 'css:finder']
      ]),
      cmd('assertElementPresent', 'id=login-email', '', 'Login Email input is visible'),
      cmd('assertElementPresent', 'id=login-submit', '', 'Login Submit button is visible')
    ]
  },
  {
    id: 'c99e4f21-729f-4ee7-910a-e3746654e806',
    name: '06_Volunteer_Login_And_Profile_UPI',
    commands: [
      cmd('waitForElementVisible', 'id=login-email', '5000', 'Wait for Login Email input', [
        ['id=login-email', 'id'],
        ['css=#login-email', 'css:finder']
      ]),
      cmd('type', 'id=login-email', 'ani@gmail.com', 'Enter Volunteer Email', [
        ['id=login-email', 'id'],
        ['css=#login-email', 'css:finder']
      ]),
      cmd('type', 'id=login-password', 'ani123', 'Enter Volunteer Password', [
        ['id=login-password', 'id'],
        ['css=#login-password', 'css:finder']
      ]),
      cmd('click', 'id=login-submit', '', 'Click Sign In Button', [
        ['id=login-submit', 'id'],
        ['css=#login-submit', 'css:finder']
      ]),
      cmd('waitForElementVisible', 'id=vol-nav-profile', '15000', 'Wait for Volunteer Profile Nav', [
        ['id=vol-nav-profile', 'id'],
        ['css=#vol-nav-profile', 'css:finder']
      ]),
      cmd('assertElementPresent', 'id=vol-nav-events', '', 'Events tab present'),
      cmd('assertElementPresent', 'id=vol-nav-tasks', '', 'Tasks tab present'),
      cmd('assertElementPresent', 'id=vol-nav-profile', '', 'Profile tab present'),
      cmd('click', 'id=vol-nav-profile', '', 'Open Volunteer Profile', [
        ['id=vol-nav-profile', 'id'],
        ['css=#vol-nav-profile', 'css:finder']
      ]),
      cmd('waitForElementVisible', 'id=vol-input-upiId', '6000', 'Wait for UPI ID input', [
        ['id=vol-input-upiId', 'id'],
        ['css=#vol-input-upiId', 'css:finder']
      ]),
      cmd('type', 'id=vol-input-upiId', '9876543210@upi', 'Enter Volunteer UPI ID', [
        ['id=vol-input-upiId', 'id'],
        ['css=#vol-input-upiId', 'css:finder']
      ]),
      cmd('click', 'id=vol-save-profile-btn', '', 'Click Save Profile', [
        ['id=vol-save-profile-btn', 'id'],
        ['css=#vol-save-profile-btn', 'css:finder']
      ]),
      cmd('pause', '1000', '', 'Profile updated successfully')
    ]
  },
  {
    id: 'c99e4f21-729f-4ee7-910a-e3746654e807',
    name: '07_Volunteer_Navigation_And_Logout',
    commands: [
      cmd('click', 'id=vol-nav-events', '', 'Navigate to Volunteer Events', [
        ['id=vol-nav-events', 'id'],
        ['css=#vol-nav-events', 'css:finder']
      ]),
      cmd('pause', '500', '', 'View events'),
      cmd('click', 'id=vol-nav-tasks', '', 'Navigate to Volunteer Tasks', [
        ['id=vol-nav-tasks', 'id'],
        ['css=#vol-nav-tasks', 'css:finder']
      ]),
      cmd('pause', '500', '', 'View tasks'),
      cmd('click', 'id=vol-nav-attendance', '', 'Navigate to Volunteer Attendance', [
        ['id=vol-nav-attendance', 'id'],
        ['css=#vol-nav-attendance', 'css:finder']
      ]),
      cmd('pause', '500', '', 'View attendance'),
      cmd('click', 'id=vol-nav-certificates', '', 'Navigate to Volunteer Certificates', [
        ['id=vol-nav-certificates', 'id'],
        ['css=#vol-nav-certificates', 'css:finder']
      ]),
      cmd('pause', '500', '', 'View certificates'),
      cmd('waitForElementVisible', 'id=vol-logout-btn', '5000', 'Wait for Volunteer Logout button', [
        ['id=vol-logout-btn', 'id'],
        ['css=#vol-logout-btn', 'css:finder']
      ]),
      cmd('click', 'id=vol-logout-btn', '', 'Click Volunteer Logout', [
        ['id=vol-logout-btn', 'id'],
        ['css=#vol-logout-btn', 'css:finder']
      ]),
      cmd('waitForElementVisible', 'id=login-email', '10000', 'Returned to Login Screen', [
        ['id=login-email', 'id'],
        ['css=#login-email', 'css:finder']
      ]),
      cmd('assertElementPresent', 'id=login-email', '', 'Login input confirmed')
    ]
  }
];

const sideProject = {
  id: '37a7f451-3cf1-456f-871d-a4115fa016b1',
  version: '2.0',
  name: 'CrewLink Selenium IDE Tests',
  url: 'http://localhost:5000',
  tests: tests,
  suites: [
    {
      id: '4c0fef8b-9d41-4770-bc4b-bf50eeec19f0',
      name: 'CrewLink Full Test Suite',
      persistSession: false,
      parallel: false,
      timeout: 300,
      tests: tests.map(t => t.id)
    }
  ],
  urls: [
    'http://localhost:5000',
    'http://localhost:5000/',
    'http://localhost:5173',
    'http://localhost:5173/'
  ],
  plugins: []
};

const outputPath = path.join(__dirname, 'CrewLink_Selenium_IDE_Tests.side');
fs.writeFileSync(outputPath, JSON.stringify(sideProject, null, 2), 'utf8');
console.log(`✅ Generated Selenium IDE project file: ${outputPath}`);
