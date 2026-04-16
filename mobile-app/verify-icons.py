from PIL import Image
import os
assets = ['icon.png', 'splash-icon.png', 'adaptive-icon.png', 'favicon.png']
for f in assets:
    path = os.path.join('assets', f)
    if os.path.exists(path):
        img = Image.open(path)
        print(f'{f}: {img.size}, mode={img.mode}')
    else:
        print(f'{f}: NOT FOUND')
