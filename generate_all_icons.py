import os
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

src_path = r'C:\Users\Nihal Wesly G\.gemini\antigravity-ide\brain\e30e72ef-6909-47b0-8f25-26045af27729\.user_uploaded\media_1789124876338.jpg'
orig_img = Image.open(src_path).convert('RGB')
orig_w, orig_h = orig_img.size

# Background color
bg_color = (235, 230, 252)

# --- 1. Master Square Icon with nice padding ---
# Size: 1024x1024
master_size = 1024
master_icon = Image.new('RGB', (master_size, master_size), bg_color)
# Scale orig_img to fit nicely in 1024x1024 with padding
target_w = 900
target_h = int(orig_h * (target_w / orig_w))
scaled_orig = orig_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
px = (master_size - target_w) // 2
py = (master_size - target_h) // 2
master_icon.paste(scaled_orig, (px, py))

# Save root icon assets
master_icon.save('crewlink_512.png')
master_icon.resize((256, 256), Image.Resampling.LANCZOS).save('crewlink_256.png')

# Round icon version
def make_round_icon(img):
    size = img.size
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size[0], size[1]), fill=255)
    res = Image.new('RGBA', size, (0, 0, 0, 0))
    res.paste(img.convert('RGBA'), (0, 0), mask=mask)
    return res

# --- 2. Update Android Mipmap Icons ---
mipmap_sizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192
}

res_base = 'android/app/src/main/res'
for folder, size in mipmap_sizes.items():
    fdir = os.path.join(res_base, folder)
    os.makedirs(fdir, exist_ok=True)
    
    # Square icon
    sq_icon = master_icon.resize((size, size), Image.Resampling.LANCZOS)
    sq_icon.save(os.path.join(fdir, 'ic_launcher.png'))
    sq_icon.save(os.path.join(fdir, 'ic_launcher_foreground.png'))
    
    # Round icon
    rd_icon = make_round_icon(sq_icon)
    rd_icon.save(os.path.join(fdir, 'ic_launcher_round.png'))
    print(f'Generated {folder} ({size}x{size})')

# --- 3. Update Splash Screens ---
# Splash screens have specific dimensions
splash_dims = {
    'drawable': (480, 320),
    'drawable-land-hdpi': (800, 480),
    'drawable-land-mdpi': (480, 320),
    'drawable-land-xhdpi': (1280, 720),
    'drawable-land-xxhdpi': (1600, 960),
    'drawable-land-xxxhdpi': (1920, 1280),
    'drawable-port-hdpi': (480, 800),
    'drawable-port-mdpi': (320, 480),
    'drawable-port-xhdpi': (720, 1280),
    'drawable-port-xxhdpi': (960, 1600),
    'drawable-port-xxxhdpi': (1280, 1920)
}

# Transparent logo for splash
trans_logo = Image.open('public/crewlink_logo_transparent.png')
tl_w, tl_h = trans_logo.size

for folder, (sw, sh) in splash_dims.items():
    fdir = os.path.join(res_base, folder)
    os.makedirs(fdir, exist_ok=True)
    
    splash = Image.new('RGBA', (sw, sh), bg_color + (255,))
    
    # Target logo width ~ 50% of min(sw, sh)
    target_logo_w = int(min(sw, sh) * 0.55)
    target_logo_h = int(tl_h * (target_logo_w / tl_w))
    scaled_logo = trans_logo.resize((target_logo_w, target_logo_h), Image.Resampling.LANCZOS)
    
    l_x = (sw - target_logo_w) // 2
    l_y = (sh - target_logo_h) // 2
    splash.paste(scaled_logo, (l_x, l_y), mask=scaled_logo)
    
    splash.save(os.path.join(fdir, 'splash.png'))
    print(f'Generated splash in {folder} ({sw}x{sh})')

# Update favicon
fav = master_icon.resize((64, 64), Image.Resampling.LANCZOS)
fav.save('public/favicon.ico', format='ICO')
fav.save('public/favicon.png')

print('All app launcher icons and splash screens generated successfully!')
