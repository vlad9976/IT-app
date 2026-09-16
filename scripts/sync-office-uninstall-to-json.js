/**
 * Sync UninstallOffice365_Template.ps1 into src/data/scripts.json
 */
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, 'UninstallOffice365_Template.ps1');
const scriptsPath = path.join(__dirname, '..', 'src', 'data', 'scripts.json');

const template = fs.readFileSync(templatePath, 'utf8').replace(/\r\n/g, '\n');
const scripts = JSON.parse(fs.readFileSync(scriptsPath, 'utf8'));

if (!Array.isArray(scripts.microsoft_office)) {
  throw new Error('microsoft_office category is missing or not an array');
}

const script = {
  id: 'office-uninstall-all',
  name: 'Uninstall Microsoft 365 / Office',
  description: 'Uninstall all detected Microsoft 365 Apps, Office Click-to-Run, MSI Office, Visio, and Project. Optional official Microsoft scrub of every Office version. Requires Administrator. Restart after.',
  type: 'powershell',
  inputs: [
    {
      variable: 'UninstallClickToRun',
      label: 'Microsoft 365 / Click-to-Run',
      type: 'checkbox',
      placeholder: '',
      defaultValue: 'true',
      description: 'Silent uninstall via OfficeClickToRun.exe'
    },
    {
      variable: 'UninstallMsiOffice',
      label: 'MSI Office / Visio / Project',
      type: 'checkbox',
      placeholder: '',
      defaultValue: 'true',
      description: 'Classic msiexec uninstall for MSI-based Office'
    },
    {
      variable: 'RunMicrosoftScrub',
      label: 'Microsoft complete scrub (all versions)',
      type: 'checkbox',
      placeholder: '',
      defaultValue: 'true',
      description: 'Official Get Help OfficeScrubScenario -OfficeVersion All'
    },
    {
      variable: 'RemoveLeftovers',
      label: 'Remove leftover program files',
      type: 'checkbox',
      placeholder: '',
      defaultValue: 'false',
      description: 'Deletes leftover Office folders under Program Files. Does not delete documents or PST files.'
    }
  ],
  template
};

const list = scripts.microsoft_office;
const existing = list.findIndex(s => s.id === 'office-uninstall-all');
if (existing >= 0) {
  list[existing] = script;
} else {
  list.unshift(script);
}

fs.writeFileSync(scriptsPath, JSON.stringify(scripts, null, 2), 'utf8');
console.log('Synced UninstallOffice365_Template.ps1 -> scripts.json (microsoft_office)');
