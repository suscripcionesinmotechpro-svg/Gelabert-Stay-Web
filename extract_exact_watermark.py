import sys
from PIL import Image

def extract_watermark(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for r, g, b, a in data:
        # The brightness of the pixel determines its alpha (opacity)
        # We use the maximum color channel as the alpha to ensure no color clipping
        alpha = max(r, g, b)
        
        if alpha == 0:
            new_data.append((0, 0, 0, 0))
        else:
            # Reconstruct the original color without the black background's darkening effect
            # Since Output = Color * (Alpha/255), Color = Output * 255 / Alpha
            r_new = min(255, int((r * 255) / alpha))
            g_new = min(255, int((g * 255) / alpha))
            b_new = min(255, int((b * 255) / alpha))
            new_data.append((r_new, g_new, b_new, alpha))
            
    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Perfectly extracted watermark saved to {output_path}")

if __name__ == '__main__':
    input_file = r"C:\Users\lenovo\.gemini\antigravity\brain\6b2e4363-accc-414c-b75d-696f85cd4d12\media__1776943195548.png"
    output_file = r"C:\Users\lenovo\Desktop\Gelabert Homes\04_Desarrollo_y_Sistemas\WEB\frontend\public\watermark_exact_hd.png"
    extract_watermark(input_file, output_file)
