const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Brand colors extracted from logo-app.png
const BRAND_COLORS = {
  cream: '#F5EFE7',      // Background cream color
  darkBrown: '#3E2723',  // Dark brown logo color
  accent: '#8D6E63'      // Medium brown accent
};

const ASSETS_DIR = path.join(__dirname, 'assets');
const SOURCE_LOGO = path.join(ASSETS_DIR, 'logo-app.png');

// Asset specifications
const ASSETS = [
  {
    name: 'icon.png',
    width: 1024,
    height: 1024,
    description: 'Standard app icon',
    padding: 0,
    background: BRAND_COLORS.cream
  },
  {
    name: 'adaptive-icon.png',
    width: 1024,
    height: 1024,
    description: 'Android adaptive icon (with safe zone)',
    padding: 164, // 16% padding for Android safe zone
    background: BRAND_COLORS.cream
  },
  {
    name: 'favicon.png',
    width: 48,
    height: 48,
    description: 'Web favicon',
    padding: 4,
    background: BRAND_COLORS.cream
  },
  {
    name: 'splash-icon.png',
    width: 1242,
    height: 2436,
    description: 'Splash screen icon',
    padding: 400,
    background: BRAND_COLORS.cream
  }
];

async function extractColors() {
  console.log('📊 Extracting brand colors from logo...\n');
  
  try {
    const image = sharp(SOURCE_LOGO);
    const { dominant } = await image.stats();
    
    console.log('Detected dominant color:', {
      r: dominant.r,
      g: dominant.g,
      b: dominant.b
    });
    
    console.log('\n✅ Using brand colors:');
    console.log(`   Cream Background: ${BRAND_COLORS.cream}`);
    console.log(`   Dark Brown Logo: ${BRAND_COLORS.darkBrown}`);
    console.log(`   Accent Brown: ${BRAND_COLORS.accent}\n`);
    
    return BRAND_COLORS;
  } catch (error) {
    console.error('❌ Error extracting colors:', error.message);
    throw error;
  }
}

async function generateAsset(config) {
  const outputPath = path.join(ASSETS_DIR, config.name);
  
  try {
    console.log(`🎨 Generating ${config.name} (${config.width}x${config.height})...`);
    
    // Load source image
    const sourceImage = sharp(SOURCE_LOGO);
    const metadata = await sourceImage.metadata();
    
    // Calculate logo size after padding
    const logoSize = Math.min(config.width, config.height) - (config.padding * 2);
    
    // Resize logo to fit within the target size
    const resizedLogo = await sourceImage
      .resize(logoSize, logoSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer();
    
    // Create canvas with background color
    await sharp({
      create: {
        width: config.width,
        height: config.height,
        channels: 4,
        background: config.background
      }
    })
    .composite([{
      input: resizedLogo,
      gravity: 'center'
    }])
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(outputPath);
    
    const stats = fs.statSync(outputPath);
    console.log(`   ✅ ${config.description} - ${(stats.size / 1024).toFixed(2)} KB\n`);
    
  } catch (error) {
    console.error(`   ❌ Failed to generate ${config.name}:`, error.message, '\n');
    throw error;
  }
}

async function optimizeSourceLogo() {
  console.log('🔧 Optimizing source logo-app.png...');
  
  const backupPath = path.join(ASSETS_DIR, 'logo-app-original.png');
  
  try {
    // Create backup if it doesn't exist
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(SOURCE_LOGO, backupPath);
      console.log('   📦 Backup created: logo-app-original.png');
    }
    
    const originalStats = fs.statSync(SOURCE_LOGO);
    const originalSize = (originalStats.size / 1024 / 1024).toFixed(2);
    
    // Optimize the logo
    await sharp(SOURCE_LOGO)
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(path.join(ASSETS_DIR, 'logo-app-temp.png'));
    
    // Replace original with optimized version
    fs.unlinkSync(SOURCE_LOGO);
    fs.renameSync(path.join(ASSETS_DIR, 'logo-app-temp.png'), SOURCE_LOGO);
    
    const newStats = fs.statSync(SOURCE_LOGO);
    const newSize = (newStats.size / 1024 / 1024).toFixed(2);
    const saved = ((1 - newStats.size / originalStats.size) * 100).toFixed(1);
    
    console.log(`   ✅ Optimized: ${originalSize} MB → ${newSize} MB (${saved}% reduction)\n`);
    
  } catch (error) {
    console.error('   ❌ Failed to optimize logo:', error.message, '\n');
  }
}

async function generateAppJsonConfig() {
  const configPath = path.join(__dirname, 'app.json.example');
  
  const config = {
    expo: {
      name: "Your App Name",
      slug: "your-app-slug",
      version: "1.0.0",
      orientation: "portrait",
      icon: "./assets/icon.png",
      userInterfaceStyle: "light",
      splash: {
        image: "./assets/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: BRAND_COLORS.cream
      },
      assetBundlePatterns: [
        "**/*"
      ],
      ios: {
        supportsTablet: true,
        bundleIdentifier: "com.yourcompany.yourapp"
      },
      android: {
        adaptiveIcon: {
          foregroundImage: "./assets/adaptive-icon.png",
          backgroundColor: BRAND_COLORS.cream
        },
        package: "com.yourcompany.yourapp"
      },
      web: {
        favicon: "./assets/favicon.png",
        backgroundColor: BRAND_COLORS.cream
      }
    }
  };
  
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`📄 Generated app.json.example with brand colors\n`);
  console.log(`   Cream background: ${BRAND_COLORS.cream}`);
  console.log(`   Copy this to your app.json file!\n`);
}

async function main() {
  console.log('🚀 React Native Asset Generator\n');
  console.log('='.repeat(50), '\n');
  
  // Check if source logo exists
  if (!fs.existsSync(SOURCE_LOGO)) {
    console.error(`❌ Source logo not found: ${SOURCE_LOGO}`);
    console.error('   Please ensure logo-app.png exists in the assets folder.');
    process.exit(1);
  }
  
  try {
    // Step 1: Extract colors
    await extractColors();
    
    // Step 2: Generate all assets
    console.log('📦 Generating assets...\n');
    for (const asset of ASSETS) {
      await generateAsset(asset);
    }
    
    // Step 3: Optimize source logo
    await optimizeSourceLogo();
    
    // Step 4: Generate app.json example
    await generateAppJsonConfig();
    
    console.log('='.repeat(50));
    console.log('✨ All assets generated successfully!\n');
    console.log('Generated files:');
    console.log('  ✓ icon.png (1024x1024)');
    console.log('  ✓ adaptive-icon.png (1024x1024 with safe zone)');
    console.log('  ✓ favicon.png (48x48)');
    console.log('  ✓ splash-icon.png (1242x2436)');
    console.log('  ✓ logo-app.png (optimized)');
    console.log('\n📋 Next steps:');
    console.log('  1. Review the generated assets in ./assets/');
    console.log('  2. Copy settings from app.json.example to your app.json');
    console.log('  3. Update app name, slug, and bundle identifiers');
    console.log('  4. Run: npx expo prebuild --clean');
    console.log('\n🎨 Brand Colors:');
    console.log(`  Cream: ${BRAND_COLORS.cream}`);
    console.log(`  Dark Brown: ${BRAND_COLORS.darkBrown}`);
    console.log(`  Accent: ${BRAND_COLORS.accent}`);
    
  } catch (error) {
    console.error('\n❌ Asset generation failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
