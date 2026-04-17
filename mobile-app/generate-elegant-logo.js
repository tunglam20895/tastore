const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, 'assets');

// Monogram SVG: Chữ T và A lồng vào nhau nghệ thuật + Khung viền sang trọng
const getSvg = (bgFill, isAdaptive = false, isFavicon = false) => {
  if (isFavicon) {
    return `<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w0.org/2000/svg">
      <rect width="256" height="256" fill="${bgFill}" rx="50" ry="50"/>
      <rect x="16" y="16" width="224" height="224" fill="none" stroke="#C8A991" stroke-width="4" rx="40" ry="40"/>
      <g transform="translate(128, 140)" text-anchor="middle" font-family="Georgia, serif">
        <text x="-20" y="40" font-size="160" fill="#1A0A04">T</text>
        <text x="15" y="60" font-size="180" fill="#A8705F" opacity="0.9">A</text>
      </g>
    </svg>`;
  }

  // Tỉ lệ scale cho Adaptive Icon (cần nằm gọn trong vòng tròn 66% ở giữa)
  const groupScale = isAdaptive ? 0.7 : 1;
  const translateY = isAdaptive ? 150 : 0;

  return `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w0.org/2000/svg">
      ${bgFill !== 'transparent' ? `<rect width="1024" height="1024" fill="${bgFill}" />` : ''}
      
      <g transform="translate(512, 512) scale(${groupScale}) translate(-512, -512) translate(0, ${translateY})">
        <!-- Khung viền kép thanh lịch -->
        ${!isAdaptive ? `
          <rect x="48" y="48" width="928" height="928" fill="none" stroke="#C8A991" stroke-width="6" rx="180" ry="180" opacity="0.6"/>
          <rect x="68" y="68" width="888" height="888" fill="none" stroke="#C8A991" stroke-width="2" rx="160" ry="160" opacity="0.3"/>
        ` : ''}

        <!-- Chữ T và A lồng nhau mang hơi hướng thời trang -->
        <g transform="translate(512, 420)" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif">
          <!-- Bóng đổ nhẹ cho chữ T -->
          <text x="-60" y="165" font-size="480" fill="#000000" opacity="0.05" letter-spacing="-15">T</text>
          <text x="-60" y="160" font-size="480" fill="#1A0A04" letter-spacing="-15">T</text>
          
          <!-- Chữ A cách điệu chèn lên -->
          <text x="60" y="245" font-size="540" fill="#000000" opacity="0.05" letter-spacing="-15">A</text>
          <text x="60" y="240" font-size="540" fill="#A8705F" opacity="0.95" letter-spacing="-15">A</text>
        </g>
        
        <!-- Đường line phân cách mỏng -->
        <line x1="340" y1="730" x2="684" y2="730" stroke="#C8A991" stroke-width="3" stroke-linecap="round"/>
        <circle cx="512" cy="730" r="6" fill="#1A0A04"/>

        <!-- Tên Thương Hiệu -->
        <text x="512" y="820" font-family="Arial, Helvetica, sans-serif" font-size="56" fill="#1A0A04" font-weight="bold" letter-spacing="14" text-anchor="middle">TRANG ANH</text>
        <text x="512" y="880" font-family="Arial, Helvetica, sans-serif" font-size="34" fill="#7A5A4E" font-weight="normal" letter-spacing="20" text-anchor="middle">STORE</text>
      </g>
    </svg>`;
};

async function generate() {
  console.log('✨ Đang vẽ lại bộ Logo sang trọng cho TRANG ANH STORE...\n');

  try {
    // 1. Icon mặc định (iOS/Android cũ)
    await sharp(Buffer.from(getSvg('#EDE8DF', false, false)))
      .png()
      .toFile(path.join(ASSETS_DIR, 'icon.png'));
    console.log('✅ Đã tạo: icon.png (1024x1024 - Cream bg)');

    // 2. Adaptive Icon (Android mới - Nền trong suốt)
    await sharp(Buffer.from(getSvg('transparent', true, false)))
      .png()
      .toFile(path.join(ASSETS_DIR, 'adaptive-icon.png'));
    console.log('✅ Đã tạo: adaptive-icon.png (1024x1024 - Transparent, scaled for adaptive padding)');

    // 3. Splash Screen (Màn hình khởi động)
    await sharp(Buffer.from(getSvg('transparent', false, false)))
      .png()
      .toFile(path.join(ASSETS_DIR, 'splash-icon.png'));
    console.log('✅ Đã tạo: splash-icon.png (1024x1024 - Transparent bg)');

    // 4. Favicon cho bản Web
    await sharp(Buffer.from(getSvg('#EDE8DF', false, true)))
      .resize(256, 256)
      .png()
      .toFile(path.join(ASSETS_DIR, 'favicon.png'));
    console.log('✅ Đã tạo: favicon.png (256x256 - Chữ TA mini)');

    console.log('\n🎉 Hoàn tất! Bức tranh đã vẽ xong. Hãy chạy lại App để chiêm ngưỡng Logo mới nhé!');
  } catch (error) {
    console.error('❌ Lỗi khi tạo logo:', error);
  }
}

generate();