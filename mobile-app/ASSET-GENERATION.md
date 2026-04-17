# 🎨 Asset Generation Guide

This guide explains how to automatically generate all required app icons and assets from your source logo.

## 📋 Prerequisites

Make sure you have Node.js and npm installed. The `sharp` library is already in your dependencies.

## 🚀 How to Generate Assets

### Step 1: Ensure your source logo is ready

Make sure `logo-app.png` exists in the `assets/` folder. This is your master logo file.

### Step 2: Run the generation script

Open your terminal in the project root directory and run:

```bash
npm run generate-assets
```

Or directly with Node:

```bash
node generate-assets.js
```

### Step 3: Review the output

The script will:
- ✅ Extract brand colors from your logo
- ✅ Generate `icon.png` (1024x1024)
- ✅ Generate `adaptive-icon.png` (1024x1024 with Android safe zone)
- ✅ Generate `favicon.png` (48x48 for web)
- ✅ Generate `splash-icon.png` (1242x2436 for splash screen)
- ✅ Optimize `logo-app.png` (creates backup as `logo-app-original.png`)
- ✅ Create `app.json.example` with proper configuration

## 🎨 Brand Colors

The script automatically extracts and uses these brand colors:

- **Cream Background**: `#F5EFE7` - Used for icon backgrounds and splash screen
- **Dark Brown**: `#3E2723` - Main logo color
- **Accent Brown**: `#8D6E63` - Medium brown accent

## 📱 Asset Specifications

| Asset | Size | Purpose | Padding |
|-------|------|---------|---------|
| `icon.png` | 1024x1024 | Standard app icon | None |
| `adaptive-icon.png` | 1024x1024 | Android adaptive icon | 16% safe zone |
| `favicon.png` | 48x48 | Web favicon | Small |
| `splash-icon.png` | 1242x2436 | Splash screen | Large center logo |

## ⚙️ Updating app.json

After generating assets, update your `app.json` with the configuration from `app.json.example`:

### Key sections to update:

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#F5EFE7"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#F5EFE7"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png",
      "backgroundColor": "#F5EFE7"
    }
  }
}
```

## 🔄 Re-generating Assets

If you update your source logo (`logo-app.png`), simply run the script again:

```bash
npm run generate-assets
```

The script will:
1. Backup your current logo (if not already backed up)
2. Generate fresh versions of all assets
3. Maintain consistent branding across all platforms

## 🏗️ Rebuilding Your App

After updating assets and app.json, rebuild your native projects:

```bash
npx expo prebuild --clean
```

Then restart your development server:

```bash
npm start
```

## 📝 Notes

- **Backup**: The first time you run the script, it creates `logo-app-original.png` as a backup
- **Optimization**: The script optimizes PNG files for smaller size without quality loss
- **Safe Zones**: Android adaptive icons include proper safe zone padding (16%)
- **Consistency**: All assets use the exact same cream background color (`#F5EFE7`)

## 🐛 Troubleshooting

### Error: Cannot find module 'sharp'

Install dependencies:
```bash
npm install
```

### Colors look wrong

The cream color `#F5EFE7` is extracted from your logo. If you need a different color, edit the `BRAND_COLORS` object in `generate-assets.js`.

### Assets not updating in app

1. Clear cache: `npx expo start -c`
2. Rebuild native projects: `npx expo prebuild --clean`
3. Restart the app

## 🎯 Customization

To customize asset generation, edit `generate-assets.js`:

- **Change colors**: Modify the `BRAND_COLORS` object
- **Adjust padding**: Change the `padding` value for each asset
- **Add new sizes**: Add new entries to the `ASSETS` array

---

**Generated with ❤️ for consistent, professional React Native branding**
