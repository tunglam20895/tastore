const fs = require('fs');
const path = require('path');

const svg1024 = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w0.org/2000/svg">
  <rect width="1024" height="1024" fill="#EDE8DF"/>
  <rect x="48" y="48" width="928" height="928" fill="none" stroke="#C8A991" stroke-width="6" rx="180" ry="180" opacity="0.6"/>
  <rect x="68" y="68" width="888" height="888" fill="none" stroke="#C8A991" stroke-width="2" rx="160" ry="160" opacity="0.3"/>
  <g transform="translate(512, 420)" text-anchor="middle" font-family="Georgia, serif">
    <text x="-60" y="165" font-size="480" fill="#000000" opacity="0.05" letter-spacing="-15">T</text>
    <text x="-60" y="160" font-size="480" fill="#1A0A04" letter-spacing="-15">T</text>
    <text x="60" y="245" font-size="540" fill="#000000" opacity="0.05" letter-spacing="-15">A</text>
    <text x="60" y="240" font-size="540" fill="#A8705F" opacity="0.95" letter-spacing="-15">A</text>
  </g>
  <line x1="340" y1="730" x2="684" y2="730" stroke="#C8A991" stroke-width="3" stroke-linecap="round"/>
  <circle cx="512" cy="730" r="6" fill="#1A0A04"/>
  <text x="512" y="820" font-family="Arial, sans-serif" font-size="56" fill="#1A0A04" font-weight="bold" letter-spacing="14" text-anchor="middle">TRANG ANH</text>
  <text x="512" y="880" font-family="Arial, sans-serif" font-size="34" fill="#7A5A4E" letter-spacing="20" text-anchor="middle">STORE</text>
</svg>`;

const svgAdaptive = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w0.org/2000/svg">
  <g transform="translate(512, 600) scale(0.7) translate(-512, -420)">
    <g transform="translate(512, 420)" text-anchor="middle" font-family="Georgia, serif">
      <text x="-60" y="165" font-size="480" fill="#000000" opacity="0.05" letter-spacing="-15">T</text>
      <text x="-60" y="160" font-size="480" fill="#1A0A04" letter-spacing="-15">T</text>
      <text x="60" y="245" font-size="540" fill="#000000" opacity="0.05" letter-spacing="-15">A</text>
      <text x="60" y="240" font-size="540" fill="#A8705F" opacity="0.95" letter-spacing="-15">A</text>
    </g>
    <line x1="340" y1="730" x2="684" y2="730" stroke="#C8A991" stroke-width="3" stroke-linecap="round"/>
    <circle cx="512" cy="730" r="6" fill="#1A0A04"/>
    <text x="512" y="820" font-family="Arial, sans-serif" font-size="56" fill="#1A0A04" font-weight="bold" letter-spacing="14" text-anchor="middle">TRANG ANH</text>
    <text x="512" y="880" font-family="Arial, sans-serif" font-size="34" fill="#7A5A4E" letter-spacing="20" text-anchor="middle">STORE</text>
  </g>
</svg>`;

fs.writeFileSync(path.join(__dirname, 'assets', 'icon.svg'), svg1024);
fs.writeFileSync(path.join(__dirname, 'assets', 'adaptive-icon.svg'), svgAdaptive);
fs.writeFileSync(path.join(__dirname, 'assets', 'splash-icon.svg'), svgAdaptive);
fs.writeFileSync(path.join(__dirname, 'assets', 'favicon.svg'), svg1024);
console.log('✅ Đã tạo các file đồ họa vector SVG tuyệt đẹp thành công!');