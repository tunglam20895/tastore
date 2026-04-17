# 🚀 Quick Start: Generate Your App Assets

## Step-by-Step Instructions

### 1. **Install Dependencies** (if needed)
```bash
npm install
```

### 2. **Generate All Assets**
Run this command in your terminal from the project root:

```bash
npm run generate-assets
```

Or:

```bash
node generate-assets.js
```

### 3. **What This Does**
The script will automatically:
- ✅ Extract brand colors from `logo-app.png`
- ✅ Generate `icon.png` (1024x1024)
- ✅ Generate `adaptive-icon.png` (1024x1024 with Android safe zone)
- ✅ Generate `favicon.png` (48x48)
- ✅ Generate `splash-icon.png` (1242x2436)
- ✅ Optimize `logo-app.png` (with backup)
- ✅ Create configuration file

### 4. **Update app.json**

**Option A - Automatic (Recommended):**
The exact colors you need are in `app.json.updates`. Copy these three values:

```json
"splash": {
  "backgroundColor": "#F5EFE7"  // Change from #EDE8DF
},
"android": {
  "adaptiveIcon": {
    "backgroundColor": "#F5EFE7"  // Change from #EDE8DF
  }
},
"web": {
  "backgroundColor": "#F5EFE7"  // Add this if not present
}
```

**Option B - Manual:**
Replace `#EDE8DF` with `#F5EFE7` in your `app.json` file (3 locations).

### 5. **Rebuild Your App**
```bash
npx expo prebuild --clean
npm start
```

## 🎨 Brand Colors Extracted

- **Cream Background**: `#F5EFE7` ← Use this everywhere!
- **Dark Brown Logo**: `#3E2723`
- **Accent Brown**: `#8D6E63`

## 📸 Expected Output

```
🚀 React Native Asset Generator

==================================================

📊 Extracting brand colors from logo...

✅ Using brand colors:
   Cream Background: #F5EFE7
   Dark Brown Logo: #3E2723
   Accent Brown: #8D6E63

📦 Generating assets...

🎨 Generating icon.png (1024x1024)...
   ✅ Standard app icon - 123.45 KB

🎨 Generating adaptive-icon.png (1024x1024)...
   ✅ Android adaptive icon (with safe zone) - 234.56 KB

🎨 Generating favicon.png (48x48)...
   ✅ Web favicon - 12.34 KB

🎨 Generating splash-icon.png (1242x2436)...
   ✅ Splash screen icon - 345.67 KB

🔧 Optimizing source logo-app.png...
   📦 Backup created: logo-app-original.png
   ✅ Optimized: 4.61 MB → 2.31 MB (49.9% reduction)

==================================================
✨ All assets generated successfully!
```

## ✅ Verification Checklist

After running the script, verify:
- [ ] All 5 PNG files generated in `assets/`
- [ ] `logo-app-original.png` backup created
- [ ] `app.json.updates` file created
- [ ] Updated `app.json` with new cream color
- [ ] App rebuilds without errors

## 🔧 Troubleshooting

**Sharp installation issues?**
```bash
npm install sharp --save
```

**Assets not showing in app?**
```bash
npx expo start -c
```

**Need different colors?**
Edit `BRAND_COLORS` in `generate-assets.js`

---

**That's it! Your assets are now consistent and professional! 🎉**
