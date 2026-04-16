const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, 'components/admin/CreateOrderModal.tsx'), 'utf8');

// Check if file has broken unicode escapes
if (content.includes('\\u00')) {
  console.log('File has broken unicode escapes, fixing...');
  // The file is already broken, we need to rewrite it
}

// Just verify the file
console.log('First 200 chars:', content.substring(0, 200));
console.log('Contains \\u00:', content.includes('\\u00'));
