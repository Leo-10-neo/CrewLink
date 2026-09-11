import requests
import re
import urllib.parse
import os

categories = {
    'Religious festivals': 'religious festival decoration india',
    'Cultural festivals': 'cultural festival decoration india',
    'Processions': 'procession rath yatra decoration',
    'Traditional celebrations': 'traditional indian celebration decor',
    'Spiritual gatherings': 'spiritual gathering satsang decoration'
}

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}

for cat, query in categories.items():
    print(f'Fetching {cat}...')
    url = f'https://www.google.com/search?q={urllib.parse.quote(query)}&tbm=isch'
    res = requests.get(url, headers=headers)
    
    # Google images often stores direct image urls in the raw HTML script tags
    urls = re.findall(r'"(https?://[^"]+\.jpg)"', res.text)
    urls = [u for u in urls if 'google' not in u and 'gstatic' not in u]
    urls = list(set(urls))
    
    count = 1
    prefix = cat.lower().replace(' ', '-')
    for img_url in urls:
        if count > 4:
            break
        try:
            img_res = requests.get(img_url, headers=headers, timeout=5)
            if img_res.status_code == 200:
                filepath = f'public/images/{prefix}-{count}.jpg'
                with open(filepath, 'wb') as f:
                    f.write(img_res.content)
                print(f'Downloaded {filepath}')
                count += 1
        except Exception:
            pass
