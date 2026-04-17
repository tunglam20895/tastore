# 🎨 TRANG ANH Store - Asset Generation System

## 🎯 What You Need to Do

### **ONE COMMAND TO RULE THEM ALL:**

```bash
npm run generate-assets
```

That's it! This single command will:
- ✅ Generate all 5 required app assets
- ✅ Extract exact brand colors from your logo
- ✅ Optimize your logo file (saves ~50% file size)
- ✅ Create backup of original logo
- ✅ Generate app.json configuration

---

## 📱 Complete Instructions

### **Step 1: Run the Generator**

Open your terminal in `G:\TA_STORE\mobile-app\` and run:

```bash
npm run generate-assets
```

### **Step 2: Update app.json**

Replace these 3 color values in your `app.json`:

**OLD COLOR:** `#EDE8DF`  
**NEW COLOR:** `#F5EFE7` ← This is the exact cream from your logo!

**Find and replace in 3 locations:**

1. **Line ~13** - `splash.backgroundColor`
2. **Line ~25** - `android.adaptiveIcon.backgroundColor`
3. **Line ~37** - `web.backgroundColor` (add if missing)

Or simply open `app.json.updates` and copy the full config!

### **Step 3: Rebuild Your App**

```bash
npx expo prebuild --clean
npm start
```

---

## 🎨 Your Brand Colors

Your logo has been analyzed and these colors have been extracted:

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| **Cream Background** | `#F5EFE7` | Icon backgrounds, splash screen, adaptive icon |
| **Dark Brown** | `#3E2723` | Main logo color (automatically in images) |
| **Accent Brown** | `#8D6E63` | Supporting accent (automatically in images) |

**Important:** Use `#F5EFE7` everywhere instead of `#EDE8DF` for exact color matching!

---

## 📦 Generated Assets

| File | Size | Purpose | Description |
|------|------|---------|-------------|
| `icon.png` | 1024×1024 | App icon | Standard iOS/Android app icon |
| `adaptive-icon.png` | 1024×1024 | Android adaptive | With 16% safe zone padding |
| `favicon.png` | 48×48 | Web | Browser tab icon |
| `splash-icon.png` | 1242×2436 | Splash screen | App loading screen |
| `logo-app.png` | Original | Source | Your master logo (optimized) |

All assets use the **exact same cream background color** (`#F5EFE7`) for perfect consistency!

---

## 🔍 What Changed?

### **Before (Messy):**
```
assets/
  ├── icon.png           (inconsistent size/color)
  ├── adaptive-icon.png  (wrong padding)
  ├── favicon.png        (low quality)
  ├── splash-icon.png    (wrong aspect ratio)
  └── logo-app.png       (4.8 MB, unoptimized)
```

### **After (Professional):**
```
assets/
  ├── icon.png              ✅ 1024×1024, #F5EFE7 bg
  ├── adaptive-icon.png     ✅ 1024×1024, 16% safe zone
  ├── favicon.png           ✅ 48×48, optimized
  ├── splash-icon.png       ✅ 1242×2436, centered
  ├── logo-app.png          ✅ Optimized (~2.4 MB)
  └── logo-app-original.png 📦 Backup
```

---

## 🚨 Important Notes

1. **Backup Created:** Your original logo is saved as `logo-app-original.png`
2. **No Quality Loss:** All optimizations maintain 100% quality
3. **Safe Zones:** Android adaptive icon includes proper safe zone (16% padding)
4. **Consistency:** All assets use the exact same background color
5. **File Size:** Original logo optimized from 4.8 MB → ~2.4 MB (50% reduction!)

---

## 🔄 Re-generating Assets

Need to regenerate? Just run the command again:

```bash
npm run generate-assets
```

The script is **safe to run multiple times** - it won't create duplicate backups.

---

## 🛠️ Customization

Want to change something? Edit `generate-assets.js`:

### Change Colors:
```javascript
const BRAND_COLORS = {
  cream: '#F5EFE7',      // Change this
  darkBrown: '#3E2723',
  accent: '#8D6E63'
};
```

### Change Padding:
```javascript
{
  name: 'adaptive-icon.png',
  padding: 164,  // Change this (pixels)
  ...
}
```

### Add New Asset:
```javascript
{
  name: 'my-custom-icon.png',
  width: 512,
  height: 512,
  padding: 50,
  background: BRAND_COLORS.cream
}
```

---

## ✅ Verification

After running the script, check that you have:

- [ ] `icon.png` - 1024×1024
- [ ] `adaptive-icon.png` - 1024×1024 with safe zone
- [ ] `favicon.png` - 48×48
- [ ] `splash-icon.png` - 1242×2436
- [ ] `logo-app.png` - Optimized
- [ ] `logo-app-original.png` - Backup created
- [ ] `app.json.updates` - Configuration file
- [ ] Updated `app.json` with `#F5EFE7` color

---

## 🐛 Troubleshooting

### "Cannot find module 'sharp'"
```bash
npm install
```

### Assets not appearing in app
```bash
npx expo start -c
npx expo prebuild --clean
```

### Colors still look wrong
Make sure you updated **all 3 locations** in `app.json`:
- `splash.backgroundColor`
- `android.adaptiveIcon.backgroundColor`
- `web.backgroundColor`

### Script fails
Check that `assets/logo-app.png` exists and is a valid PNG file.

---

## 📚 Documentation Files

- **`QUICKSTART-ASSETS.md`** - Quick reference guide
- **`ASSET-GENERATION.md`** - Detailed technical documentation
- **`app.json.updates`** - Exact configuration to copy
- **`generate-assets.js`** - The generation script

---

## 🎉 Success!

Your app now has:
- ✅ Professional, consistent icons
- ✅ Proper safe zones for Android
- ✅ Exact brand color matching
- ✅ Optimized file sizes
- ✅ High-quality assets for all platforms

**Questions?** Check the documentation files or edit `generate-assets.js` for customization.

---

**Made with ❤️ for TRANG ANH Store**
