// Check available packages
const packages = ['jimp', 'svg2png', 'svg-to-png', '@napi-rs/image'];
packages.forEach(p => {
  try { require(p); console.log(`✅ ${p} available`); } 
  catch(e) { console.log(`❌ ${p} not found`); }
});
