try {
  JSON.parse(require('fs').readFileSync('app.json', 'utf8'));
  console.log('OK - app.json hop le!');
} catch (e) {
  console.error('LOI:', e.message);
}
