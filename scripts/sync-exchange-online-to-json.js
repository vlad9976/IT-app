/**
 * Sync Exchange Online scripts into src/data/scripts.json
 */
const fs = require('fs');
const path = require('path');

const scriptsPath = path.join(__dirname, '..', 'src', 'data', 'scripts.json');
const read = (file) => fs.readFileSync(path.join(__dirname, file), 'utf8').replace(/\r\n/g, '\n');

const scripts = JSON.parse(fs.readFileSync(scriptsPath, 'utf8'));

const connect = {
  id: 'exo-connect',
  name: 'Connect to Exchange Online',
  description: 'Install ExchangeOnlineManagement if needed and run Connect-ExchangeOnline.',
  type: 'powershell',
  inputs: [],
  template: read('ExchangeOnlineConnect_Template.ps1')
};

const archive = {
  id: 'exo-archive-quota',
  name: 'Mailbox Archive Quota',
  description: 'Connect to Exchange Online, check the current archive quota, and enable AutoExpandingArchive for a mailbox.',
  type: 'powershell',
  inputs: [
    {
      variable: 'mailbox',
      label: 'Mailbox UPN',
      type: 'text',
      placeholder: 'user@domain.co.il',
      defaultValue: ''
    },
    {
      variable: 'ConnectExchange',
      label: 'Connect to Exchange Online',
      type: 'checkbox',
      placeholder: '',
      defaultValue: 'true',
      description: 'Connect-ExchangeOnline'
    },
    {
      variable: 'CheckQuota',
      label: 'Check current archive quota',
      type: 'checkbox',
      placeholder: '',
      defaultValue: 'true',
      description: 'DisplayName, ArchiveStatus, ArchiveQuota, ArchiveWarningQuota'
    },
    {
      variable: 'EnableAutoExpand',
      label: 'Extend quota (AutoExpandingArchive)',
      type: 'checkbox',
      placeholder: '',
      defaultValue: 'true',
      description: 'Enable-Mailbox -AutoExpandingArchive'
    }
  ],
  template: read('ExchangeArchiveQuota_Template.ps1')
};

if (!Array.isArray(scripts.exchange_online)) {
  scripts.exchange_online = [];
}

const list = scripts.exchange_online;
for (const script of [connect, archive]) {
  const idx = list.findIndex(s => s.id === script.id);
  if (idx >= 0) list[idx] = script;
  else list.push(script);
}

fs.writeFileSync(scriptsPath, JSON.stringify(scripts, null, 2), 'utf8');
console.log('Synced Exchange Online scripts -> scripts.json');
