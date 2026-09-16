/**
 * Sync DomainMigrationSmartBackup_Template.ps1 into src/data/scripts.json
 */
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, 'DomainMigrationSmartBackup_Template.ps1');
const scriptsPath = path.join(__dirname, '..', 'src', 'data', 'scripts.json');

const template = fs.readFileSync(templatePath, 'utf8');
const scripts = JSON.parse(fs.readFileSync(scriptsPath, 'utf8'));

const dm = scripts.domain_migration?.find(s => s.id === 'domain-migration-smart-backup');
if (!dm) throw new Error('domain-migration-smart-backup not found');

dm.template = template.replace(/\r\n/g, '\r\n');
fs.writeFileSync(scriptsPath, JSON.stringify(scripts, null, 2), 'utf8');
console.log('Synced DomainMigrationSmartBackup_Template.ps1 -> scripts.json');
