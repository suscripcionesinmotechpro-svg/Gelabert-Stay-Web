import os
import requests
from PIL import Image, ImageEnhance, ImageFilter

def create_watermark_preview():
    # 1. Download a sample property image
    sample_url = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200"
    sample_path = "sample_property.jpg"
    
    with open(sample_path, 'wb') as f:
        f.write(requests.get(sample_url).content)
        
    img = Image.open(sample_path).convert("RGBA")
    
    # 2. Load the watermark
    watermark_path = r"C:\Users\lenovo\Desktop\Gelabert Stay\WEB\frontend\public\watermark.png"
    watermark = Image.open(watermark_path).convert("RGBA")
    
    # 3. Apply exact logic from watermark.ts
    wm_width = int(img.width * 0.40)
    if wm_width > 800: wm_width = 800
    if wm_width < 200: wm_width = 200
    
    aspect_ratio = watermark.width / watermark.height
    wm_height = int(wm_width / aspect_ratio)
    
    # Resize watermark
    watermark = watermark.resize((wm_width, wm_height), Image.Resampling.LANCZOS)
    
    # Apply 90% opacity
    alpha = watermark.split()[3]
    alpha = ImageEnhance.Brightness(alpha).enhance(0.90)
    watermark.putalpha(alpha)
    
    # We can't easily do a perfect canvas drop-shadow in pure PIL without drawing offset layers
    # So we'll simulate it by creating a black version of the watermark, blurring it, and putting it slightly offset
    shadow = Image.new("RGBA", watermark.size, (0, 0, 0, 0))
    shadow_alpha = watermark.split()[3]
    shadow_alpha = ImageEnhance.Brightness(shadow_alpha).enhance(0.5) # 50% opacity shadow
    
    # Fill shadow with black where alpha is present
    for x in range(shadow.width):
        for y in range(shadow.height):
            if shadow_alpha.getpixel((x, y)) > 0:
                shadow.putpixel((x, y), (0, 0, 0, shadow_alpha.getpixel((x, y))))
                
    # Blur the shadow
    shadow = shadow.filter(ImageFilter.GaussianBlur(8))
    
    # 4. Calculate position (Centered)
    x = int((img.width - wm_width) / 2)
    y = int((img.height - wm_height) / 2)
    
    # 5. Composite
    # Paste shadow offset by 2px
    img.paste(shadow, (x + 2, y + 2), shadow)
    # Paste watermark
    img.paste(watermark, (x, y), watermark)
    
    # Save preview to artifacts with a new name to avoid cache
    output_path = r"C:\Users\lenovo\.gemini\antigravity\brain\12e483c8-47e8-4b54-aa55-02a3fdc69d55\watermark_demo_centered.png"
    img.convert("RGB").save(output_path, "PNG")
    print("Demo created at:", output_path)

if __name__ == '__main__':
    create_watermark_preview()
