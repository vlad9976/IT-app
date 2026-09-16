/**
 * Sync StandardAppsInstaller_Template.ps1 into src/data/scripts.json
 */
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, 'StandardAppsInstaller_Template.ps1');
const scriptsPath = path.join(__dirname, '..', 'src', 'data', 'scripts.json');

const template = fs.readFileSync(templatePath, 'utf8').replace(/\r\n/g, '\n');
const scripts = JSON.parse(fs.readFileSync(scriptsPath, 'utf8'));

if (!scripts.local_machine || Array.isArray(scripts.local_machine)) {
  throw new Error('local_machine category is missing or not sectioned');
}

const script = {
  id: 'standard-apps-installer',
  name: 'Install Standard Apps',
  description: 'Download and silently install Google Chrome, Adobe Acrobat Reader 64-bit, and/or WinRAR from official vendors. No WinGet. Requires Administrator. Signature-checked.',
  type: 'powershell',
  inputs: [
    {
      variable: 'InstallChrome',
      label: 'Google Chrome',
      type: 'checkbox',
      placeholder: '',
      defaultValue: 'true',
      description: 'Google Chrome Enterprise 64-bit MSI'
    },
    {
      variable: 'InstallAdobe',
      label: 'Adobe Acrobat Reader',
      type: 'checkbox',
      placeholder: '',
      defaultValue: 'true',
      description: 'Adobe Acrobat Reader DC 64-bit (latest)'
    },
    {
      variable: 'InstallWinRAR',
      label: 'WinRAR',
      type: 'checkbox',
      placeholder: '',
      defaultValue: 'true',
      description: 'WinRAR x64 latest stable from rarlab.com'
    }
  ],
  template
};

if (!scripts.local_machine.Software) {
  scripts.local_machine.Software = [];
}

const list = scripts.local_machine.Software;
const existing = list.findIndex(s => s.id === 'standard-apps-installer');
if (existing >= 0) {
  list[existing] = script;
} else {
  list.push(script);
}

fs.writeFileSync(scriptsPath, JSON.stringify(scripts, null, 2), 'utf8');
console.log('Synced StandardAppsInstaller_Template.ps1 -> scripts.json (local_machine / Software)');
