const sharp = require('sharp');
const path = require('path');

// Colors
const CREAM = '#EDE8DF';
const ESPRESSO = '#1A0A04';
const BLUSH = '#C8A991';

const assetsDir = path.join(__dirname, 'assets');

// ===== 1. App Icon (1024x1024) =====
const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#F5F0E8"/>
      <stop offset="100%" stop-color="#EDE8DF"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="160" fill="url(#bg)"/>
  <text x="512" y="560" font-family="Arial Black, Impact, sans-serif" font-size="480" font-weight="900" fill="#1A0A04" text-anchor="middle" letter-spacing="-20">TA</text>
  <line x1="260" y1="640" x2="764" y2="640" stroke="#C8A991" stroke-width="4"/>
  <text x="512" y="720" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="700" fill="#1A0A04" text-anchor="middle" letter-spacing="24" opacity="0.5">STORE</text>
</svg>`;

// ===== 2. Splash Icon (512x512) =====
const splashSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#EDE8DF"/>
  <text x="256" y="280" font-family="Arial Black, Impact, sans-serif" font-size="220" font-weight="900" fill="#1A0A04" text-anchor="middle" letter-spacing="-10">TA</text>
  <line x1="140" y1="315" x2="372" y2="315" stroke="#C8A991" stroke-width="2"/>
  <text x="256" y="355" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" fill="#1A0A04" text-anchor="middle" letter-spacing="14" opacity="0.5">TRANG ANH STORE</text>
</svg>`;

// ===== 3. Adaptive Icon Foreground (108x108) =====
const adaptiveFgSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="108" height="108">
  <text x="54" y="62" font-family="Arial Black, Impact, sans-serif" font-size="52" font-weight="900" fill="#1A0A04" text-anchor="middle" letter-spacing="-2">TA</text>
  <line x1="24" y1="72" x2="84" y2="72" stroke="#C8A991" stroke-width="0.5"/>
  <text x="54" y="86" font-family="Arial, Helvetica, sans-serif" font-size="5" font-weight="700" fill="#1A0A04" text-anchor="middle" letter-spacing="2" opacity="0.5">STORE</text>
</svg>`;

// ===== 4. Favicon =====
const faviconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <rect width="32" height="32" rx="4" fill="#EDE8DF"/>
  <text x="16" y="22" font-family="Arial Black, Impact, sans-serif" font-size="18" font-weight="900" fill="#1A0A04" text-anchor="middle">TA</text>
</svg>`;

async function convertSvg(svg, filename, width, height) {
  try {
    await sharp(Buffer.from(svg))
      .resize(width, height)
      .png()
      .toFile(path.join(assetsDir, filename));
    console.log(`✅ ${filename} (${width}x${height})`);
  } catch (e) {
    console.error(`❌ ${filename}: ${e.message}`);
  }
}

async function main() {
  console.log('🎨 Generating app icons...\n');
  await convertSvg(iconSvg, 'icon.png', 1024, 1024);
  await convertSvg(splashSvg, 'splash-icon.png', 512, 512);
  await convertSvg(adaptiveFgSvg, 'adaptive-icon.png', 108, 108);
  await convertSvg(faviconSvg, 'favicon.png', 32, 32);
  console.log('\n✨ All icons generated!');
}

main();
