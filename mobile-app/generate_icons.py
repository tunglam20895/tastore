# generate_icons.py - Tạo icon app từ Python/Pillow
import os
from PIL import Image, ImageDraw, ImageFont
import sys

CREAM = (237, 232, 223)
ESPRESSO = (26, 10, 4)
BLUSH = (200, 169, 145)
WHITE_CREAM = (245, 240, 232)

assets_dir = os.path.join(os.path.dirname(__file__), 'assets')

def find_font(size_hint=100):
    """Tìm font Windows có sẵn"""
    candidates = [
        r"C:\Windows\Fonts\arialbd.ttf",   # Arial Bold
        r"C:\Windows\Fonts\arial.ttf",      # Arial
        r"C:\Windows\Fonts\impact.ttf",     # Impact
        r"C:\Windows\Fonts\segoeui.ttf",    # Segoe UI
        r"C:\Windows\Fonts\verdana.ttf",    # Verdana
        r"C:\Windows\Fonts\tahoma.ttf",     # Tahoma
        r"C:\Windows\Fonts\calibri.ttf",    # Calibri
    ]
    for path in candidates:
        if os.path.exists(path):
            return path
    return None

def create_icon(size, filename, is_rounded=True, is_splash=False, is_favicon=False, is_adaptive=False):
    print(f"Tạo {filename} ({size}x{size})...")
    
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    font_path = find_font()
    
    if is_favicon:
        # Favicon: simple rounded rect with TA
        bg = Image.new('RGBA', (size, size), CREAM)
        bg_draw = ImageDraw.Draw(bg)
        radius = 4
        bg_draw.rounded_rectangle([0, 0, size-1, size-1], radius=radius, fill=CREAM)
        
        try:
            font = ImageFont.truetype(font_path, int(size * 0.56))
        except:
            font = ImageFont.load_default()
        
        bbox = bg_draw.textbbox((0, 0), "TA", font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        x = (size - tw) // 2
        y = (size - th) // 2
        bg_draw.text((x, y), "TA", fill=ESPRESSO, font=font)
        bg.convert('RGB').save(os.path.join(assets_dir, filename))
        print(f"  ✅ {filename}")
        return
    
    if is_adaptive:
        # Adaptive icon: transparent background, just the text
        try:
            font = ImageFont.truetype(font_path, int(size * 0.48))
        except:
            font = ImageFont.load_default()
        
        bbox = draw.textbbox((0, 0), "TA", font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        x = (size - tw) // 2
        y = (size - th) // 2
        draw.text((x, y), "TA", fill=ESPRESSO, font=font)
        
        # Small STORE text
        try:
            small_font = ImageFont.truetype(font_path, int(size * 0.046))
        except:
            small_font = ImageFont.load_default()
        
        s_bbox = draw.textbbox((0, 0), "STORE", font=small_font)
        sw = s_bbox[2] - s_bbox[0]
        sx = (size - sw) // 2
        sy = int(size * 0.80)
        draw.text((sx, sy), "STORE", fill=ESPRESSO, font=small_font)
        
        # Line
        line_y = int(size * 0.67)
        draw.line([(int(size*0.22), line_y), (int(size*0.78), line_y)], fill=BLUSH, width=max(1, size//200))
        
        img.save(os.path.join(assets_dir, filename))
        print(f"  ✅ {filename}")
        return
    
    # === Normal icon / splash ===
    # Background with gradient
    bg_img = Image.new('RGBA', (size, size), CREAM)
    bg_draw = ImageDraw.Draw(bg_img)
    
    if is_rounded and size > 200:
        # Create rounded rectangle mask
        mask = Image.new('L', (size, size), 0)
        mask_draw = ImageDraw.Draw(mask)
        radius = size // 6 if size >= 512 else size // 5
        mask_draw.rounded_rectangle([0, 0, size-1, size-1], radius=radius, fill=255)
        
        bg_img = Image.new('RGBA', (size, size), CREAM)
        bg_draw = ImageDraw.Draw(bg_img)
        
        # Subtle gradient overlay
        for y in range(size):
            alpha = int(20 * y / size)
            line_color = (0, 0, 0, alpha)
            bg_draw.line([(0, y), (size, y)], fill=line_color)
        
        bg_img.putalpha(mask)
    
    # Main "TA" text
    ta_size = int(size * 0.47) if not is_splash else int(size * 0.43)
    try:
        font = ImageFont.truetype(font_path, ta_size)
    except:
        font = ImageFont.load_default()
    
    bbox = bg_draw.textbbox((0, 0), "TA", font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = (size - tw) // 2
    y = int(size * 0.42) if not is_splash else int(size * 0.40)
    bg_draw.text((x, y), "TA", fill=ESPRESSO, font=font)
    
    # Decorative line
    line_y = int(size * 0.58)
    line_start_x = int(size * 0.25)
    line_end_x = int(size * 0.75)
    line_width = max(2, size // 250)
    bg_draw.line([(line_start_x, line_y), (line_end_x, line_y)], fill=BLUSH, width=line_width)
    
    # "STORE" subtitle
    store_size = int(size * 0.047) if not is_splash else int(size * 0.035)
    try:
        store_font = ImageFont.truetype(font_path, store_size)
    except:
        store_font = ImageFont.load_default()
    
    subtitle = "STORE" if not is_splash else "TRANG ANH STORE"
    s_bbox = bg_draw.textbbox((0, 0), subtitle, font=store_font)
    sw = s_bbox[2] - s_bbox[0]
    sx = (size - sw) // 2
    sy = int(size * 0.66) if not is_splash else int(size * 0.64)
    bg_draw.text((sx, sy), subtitle, fill=ESPRESSO, font=store_font)
    
    if is_splash:
        # Save as RGB (no alpha for splash)
        bg_img.convert('RGB').save(os.path.join(assets_dir, filename))
    else:
        bg_img.convert('RGB').save(os.path.join(assets_dir, filename))
    
    print(f"  ✅ {filename}")


# Generate all icons
print("\n🎨 Tạo icon app...\n")

# App icon: 1024x1024 (rounded)
create_icon(1024, 'icon.png', is_rounded=True)

# Splash icon: 512x512 (no rounding needed for splash)
create_icon(512, 'splash-icon.png', is_rounded=False, is_splash=True)

# Adaptive icon foreground: 108x108 (transparent)
create_icon(108, 'adaptive-icon.png', is_rounded=False, is_adaptive=True)

# Favicon: 32x32 (rounded)
create_icon(32, 'favicon.png', is_rounded=True, is_favicon=True)

print("\n✨ Tất cả icon đã được tạo!")
print("\nCác file trong assets/:")
for f in ['icon.png', 'splash-icon.png', 'adaptive-icon.png', 'favicon.png']:
    path = os.path.join(assets_dir, f)
    if os.path.exists(path):
        sz = os.path.getsize(path)
        print(f"  ✅ {f} ({sz:,} bytes)")
