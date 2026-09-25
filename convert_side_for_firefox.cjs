const fs = require('fs');
const path = require('path');

function makeSafeScript(target, value) {
  const safeTarget = (target || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const safeVal = (value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `if(window.__type){window.__type("${safeTarget}","${safeVal}");}else{var sel="${safeTarget}";var val="${safeVal}";var el;if(sel.startsWith("id="))el=document.getElementById(sel.substring(3));else if(sel.startsWith("css="))el=document.querySelector(sel.substring(4));else if(sel.startsWith("name="))el=document.querySelector('[name="'+sel.substring(5)+'"]');else if(sel.startsWith("//")||sel.startsWith("xpath=")){var xp=sel.replace(/^xpath=/,"");el=document.evaluate(xp,document,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue;}else{el=document.querySelector(sel)||document.getElementById(sel);}if(el){var proto=(el instanceof HTMLTextAreaElement)?window.HTMLTextAreaElement.prototype:window.HTMLInputElement.prototype;var s=Object.getOwnPropertyDescriptor(proto,"value")?.set;if(s){s.call(el,val);}else{el.value=val;}el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));el.dispatchEvent(new Event("blur",{bubbles:true}));}}`;
}

function createPariTest() {
  return {
    "id": "pari-test-001",
    "name": "new volunteer login (pari)",
    "commands": [
      {
        "id": "pari-cmd-001",
        "comment": "Open CrewLink Home Page",
        "command": "open",
        "target": "/",
        "targets": [["/", "id"]],
        "value": ""
      },
      {
        "id": "pari-cmd-002",
        "comment": "Set Browser Size",
        "command": "setWindowSize",
        "target": "1228x783",
        "targets": [["1228x783", "id"]],
        "value": ""
      },
      {
        "id": "pari-cmd-003",
        "comment": "Clear previous session if any",
        "command": "executeScript",
        "target": "localStorage.clear(); sessionStorage.clear();",
        "targets": [],
        "value": ""
      },
      {
        "id": "pari-cmd-004",
        "comment": "Clean up test user pari if already exists",
        "command": "executeAsyncScript",
        "target": "var done = arguments[arguments.length - 1]; fetch('/api/test/cleanup', {method:'POST'}).then(function(r){return r.json()}).then(function(d){done('ok:'+d.deletedCount)}).catch(function(e){done('err')});",
        "targets": [],
        "value": ""
      },
      {
        "id": "pari-cmd-005",
        "comment": "Click Become a Volunteer",
        "command": "click",
        "target": "id=home-btn-volunteer",
        "targets": [["id=home-btn-volunteer", "id"]],
        "value": ""
      },
      {
        "id": "pari-cmd-006",
        "comment": "Wait for Registration Form",
        "command": "waitForElementVisible",
        "target": "id=reg-username",
        "targets": [["id=reg-username", "id"]],
        "value": "10000"
      },
      {
        "id": "pari-cmd-007",
        "comment": "Click Username",
        "command": "click",
        "target": "id=reg-username",
        "targets": [["id=reg-username", "id"]],
        "value": ""
      },
      {
        "id": "pari-cmd-008",
        "comment": "Enter Username pari",
        "command": "executeScript",
        "target": makeSafeScript("id=reg-username", "pari"),
        "targets": [["id=reg-username", "id"]],
        "value": ""
      },
      {
        "id": "pari-cmd-009",
        "comment": "Enter Email pari@gmail.com",
        "command": "executeScript",
        "target": makeSafeScript("id=reg-email", "pari@gmail.com"),
        "targets": [["id=reg-email", "id"]],
        "value": ""
      },
      {
        "id": "pari-cmd-010",
        "comment": "Enter Password pari123",
        "command": "executeScript",
        "target": makeSafeScript("id=reg-password", "pari123"),
        "targets": [["id=reg-password", "id"]],
        "value": ""
      },
      {
        "id": "pari-cmd-011",
        "comment": "Enter Confirm Password pari123",
        "command": "executeScript",
        "target": makeSafeScript("id=reg-confirmPassword", "pari123"),
        "targets": [["id=reg-confirmPassword", "id"]],
        "value": ""
      },
      {
        "id": "pari-cmd-012",
        "comment": "Click Next Step",
        "command": "click",
        "target": "id=reg-btn-next",
        "targets": [["id=reg-btn-next", "id"]],
        "value": ""
      },
      {
        "id": "pari-cmd-013",
        "comment": "Wait for Full Name field",
        "command": "waitForElementVisible",
        "target": "id=reg-fullName",
        "targets": [["id=reg-fullName", "id"]],
        "value": "8000"
      },
      {
        "id": "pari-cmd-014",
        "comment": "Enter Full Name pari N",
        "command": "executeScript",
        "target": makeSafeScript("id=reg-fullName", "pari N"),
        "targets": [["id=reg-fullName", "id"]],
        "value": ""
      },
      {
        "id": "pari-cmd-015",
        "comment": "Enter Phone",
        "command": "executeScript",
        "target": makeSafeScript("id=reg-phone", "9087654321"),
        "targets": [["id=reg-phone", "id"]],
        "value": ""
      },
      {
        "id": "pari-cmd-016",
        "comment": "Enter City Mandya",
        "command": "executeScript",
        "target": makeSafeScript("id=reg-city", "Mandya"),
        "targets": [["id=reg-city", "id"]],
        "value": ""
      },
      {
        "id": "pari-cmd-017",
        "comment": "Click Next to Step 3",
        "command": "click",
        "target": "id=reg-btn-next",
        "targets": [["id=reg-btn-next", "id"]],
        "value": ""
      },
      {
        "id": "pari-cmd-018",
        "comment": "Wait for Complete Registration button",
        "command": "waitForElementVisible",
        "target": "id=reg-btn-submit",
        "targets": [["id=reg-btn-submit", "id"]],
        "value": "8000"
      },
      {
        "id": "pari-cmd-019",
        "comment": "Submit Registration",
        "command": "click",
        "target": "id=reg-btn-submit",
        "targets": [["id=reg-btn-submit", "id"]],
        "value": ""
      },
      {
        "id": "pari-cmd-020",
        "comment": "Wait for Proceed to Login button",
        "command": "waitForElementVisible",
        "target": "linkText=Proceed to Login",
        "targets": [["linkText=Proceed to Login", "linkText"]],
        "value": "10000"
      },
      {
        "id": "pari-cmd-021",
        "comment": "Click Proceed to Login",
        "command": "click",
        "target": "linkText=Proceed to Login",
        "targets": [["linkText=Proceed to Login", "linkText"]],
        "value": ""
      },
      {
        "id": "pari-cmd-022",
        "comment": "Wait for Login page email field",
        "command": "waitForElementVisible",
        "target": "id=login-email",
        "targets": [["id=login-email", "id"]],
        "value": "8000"
      },
      {
        "id": "pari-cmd-023",
        "comment": "Enter Login Email",
        "command": "executeScript",
        "target": makeSafeScript("id=login-email", "pari@gmail.com"),
        "targets": [["id=login-email", "id"]],
        "value": ""
      },
      {
        "id": "pari-cmd-024",
        "comment": "Enter Login Password",
        "command": "executeScript",
        "target": makeSafeScript("id=login-password", "pari123"),
        "targets": [["id=login-password", "id"]],
        "value": ""
      },
      {
        "id": "pari-cmd-025",
        "comment": "Click Sign In",
        "command": "click",
        "target": "id=login-submit",
        "targets": [["id=login-submit", "id"]],
        "value": ""
      },
      {
        "id": "pari-cmd-026",
        "comment": "Wait for Volunteer Dashboard to load",
        "command": "waitForElementVisible",
        "target": "id=vol-nav-profile",
        "targets": [["id=vol-nav-profile", "id"]],
        "value": "15000"
      },
      {
        "id": "pari-cmd-027",
        "comment": "Verify Volunteer Profile visible",
        "command": "assertElementPresent",
        "target": "id=vol-nav-profile",
        "targets": [["id=vol-nav-profile", "id"]],
        "value": ""
      },
      {
        "id": "pari-cmd-028",
        "comment": "Click Logout",
        "command": "click",
        "target": "id=vol-logout-btn",
        "targets": [["id=vol-logout-btn", "id"]],
        "value": ""
      },
      {
        "id": "pari-cmd-029",
        "comment": "Wait for return to Login page",
        "command": "waitForElementVisible",
        "target": "id=login-email",
        "targets": [["id=login-email", "id"]],
        "value": "10000"
      }
    ]
  };
}

function processFile(filePath, newProjectName) {
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let convertedCount = 0;

  if (newProjectName) {
    content.name = newProjectName;
  }

  content.tests.forEach(test => {
    test.commands.forEach(cmd => {
      if (cmd.command === 'type') {
        const target = cmd.target;
        const value = cmd.value || '';
        cmd.command = 'executeScript';
        cmd.comment = `Set ${target} = "${value}"`;
        cmd.target = makeSafeScript(target, value);
        cmd.value = '';
        convertedCount++;
      }
    });
  });

  // Ensure pari test is also present
  const hasPariTest = content.tests.some(t => t.name.includes('pari'));
  if (!hasPariTest) {
    content.tests.unshift(createPariTest());
  }

  // Update suite tests if present
  if (content.suites && content.suites[0]) {
    content.suites[0].tests = content.tests.map(t => t.id);
  }

  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`Processed ${filePath}: converted ${convertedCount} type commands, total tests: ${content.tests.length}`);
  return content;
}

// 1. Process project root CrewLink_Selenium_IDE_Tests.side
const rootSide = path.join(__dirname, 'CrewLink_Selenium_IDE_Tests.side');
const content = processFile(rootSide, 'CrewLink Selenium IDE Tests');

// 2. Write to OneDrive Desktop CrewLink_Selenium_IDE_Tests.side
const desktopSide = 'C:\\Users\\Nihal Wesly G\\OneDrive\\Desktop\\CrewLink_Selenium_IDE_Tests.side';
fs.writeFileSync(desktopSide, JSON.stringify(content, null, 2), 'utf8');
console.log(`Saved updated suite to: ${desktopSide}`);

// 3. Write crewlink01.side to both project root and Desktop
const rootCrewlink01 = path.join(__dirname, 'crewlink01.side');
const desktopCrewlink01 = 'C:\\Users\\Nihal Wesly G\\OneDrive\\Desktop\\crewlink01.side';

const crewlink01Content = JSON.parse(JSON.stringify(content));
crewlink01Content.name = 'crewlink01';

fs.writeFileSync(rootCrewlink01, JSON.stringify(crewlink01Content, null, 2), 'utf8');
fs.writeFileSync(desktopCrewlink01, JSON.stringify(crewlink01Content, null, 2), 'utf8');
console.log(`Created crewlink01.side at:\n  - ${rootCrewlink01}\n  - ${desktopCrewlink01}`);
