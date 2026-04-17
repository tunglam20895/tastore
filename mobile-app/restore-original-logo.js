const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, 'assets');
const BACKUP = path.join(ASSETS_DIR, 'logo-app-original.png');
const CURRENT = path.join(ASSETS_DIR, 'logo-app.png');

if (!fs.existsSync(BACKUP)) {
  console.log('❌ No backup found. Nothing to restore.');
  console.log('   Backup file: logo-app-original.png');
  process.exit(1);
}

console.log('🔄 Restoring original logo...');
fs.copyFileSync(BACKUP, CURRENT);
console.log('✅ Original logo restored!');
console.log('   logo-app.png has been restored from backup');
