import os
from PIL import Image

def remove_black_background(input_path, output_path, tolerance=50):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for item in data:
        # item is (R, G, B, A)
        # If the pixel is close to black (all RGB values below tolerance)
        if item[0] < tolerance and item[1] < tolerance and item[2] < tolerance:
            # Replace with transparent
            new_data.append((0, 0, 0, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_path, "PNG")

if __name__ == '__main__':
    input_file = r"C:\Users\lenovo\Desktop\Gelabert Stay\Logo\WhatsApp Image 2026-03-17 at 16.17.06.jpeg"
    # Save to the artifacts directory for the user to see
    output_file = r"C:\Users\lenovo\.gemini\antigravity\brain\12e483c8-47e8-4b54-aa55-02a3fdc69d55\watermark_prototype.png"
    
    # We use a tolerance of ~40 to remove the black while keeping the golden gradients
    remove_black_background(input_file, output_file, tolerance=40)
    print("Watermark prototype created at", output_file)
