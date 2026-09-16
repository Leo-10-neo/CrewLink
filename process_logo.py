from PIL import Image, ImageOps, ImageDraw
import numpy as np
import os

src_path = r'C:\Users\Nihal Wesly G\.gemini\antigravity-ide\brain\e30e72ef-6909-47b0-8f25-26045af27729\.user_uploaded\media_1789124876338.jpg'
orig_img = Image.open(src_path).convert('RGB')
w, h = orig_img.size

# 1. First, create square crop centered on the logo for App Icon
# Logo bounding box roughly in center
crop_box = (int(w*0.05), int(h*0.05), int(w*0.95), int(h*0.95))
# For a square app icon, we want a square aspect ratio with the logo nicely centered and padded
logo_w, logo_h = w, h
max_dim = max(w, h)
square_bg_color = orig_img.getpixel((10, 10))

# Create a 1024x1024 high-res master icon
master_icon = Image.new('RGB', (max_dim, max_dim), square_bg_color)
paste_x = (max_dim - w) // 2
paste_y = (max_dim - h) // 2
master_icon.paste(orig_img, (paste_x, paste_y))
master_icon = master_icon.resize((1024, 1024), Image.Resampling.LANCZOS)
master_icon.save('crewlink_512.png')

# 2. Transparent background version for Web Navbar & UI
# The background is approximately (230, 224, 252) to (236, 230, 254)
arr = np.array(orig_img, dtype=float)
bg_color = np.array([232.0, 226.0, 252.0])

# Compute color difference from background
diff = np.sqrt(np.sum((arr - bg_color) ** 2, axis=-1))

# Thresholds: Below low_th is fully transparent, above high_th is fully opaque, in-between is smooth alpha
low_th = 15.0
high_th = 35.0
alpha = np.clip((diff - low_th) / (high_th - low_th), 0.0, 1.0) * 255.0

rgba_arr = np.zeros((h, w, 4), dtype=np.uint8)
rgba_arr[:, :, :3] = np.array(orig_img, dtype=np.uint8)
rgba_arr[:, :, 3] = alpha.astype(np.uint8)

transparent_img = Image.fromarray(rgba_arr, 'RGBA')

# Crop to non-transparent bounding box with slight margin
bbox = transparent_img.getbbox()
if bbox:
    pad = 10
    cropped_bbox = (max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(w, bbox[2] + pad), min(h, bbox[3] + pad))
    transparent_logo = transparent_img.crop(cropped_bbox)
else:
    transparent_logo = transparent_img

transparent_logo.save('public/crewlink_logo_transparent.png')
print('Transparent logo created:', transparent_logo.size)

# Also save to public/favicon.png and public/crewlink-3d-logo.png
transparent_logo.save('public/crewlink-3d-logo.png')
transparent_logo.save('public/crewlink_logo.png')
fav = transparent_logo.copy()
fav.thumbnail((64, 64), Image.Resampling.LANCZOS)
fav.save('public/favicon.ico', format='ICO')
fav.save('public/favicon.png')

print('Web assets updated successfully!')
