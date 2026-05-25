import urllib.request
import os

os.makedirs('test_images', exist_ok=True)

images = {
    'current_step8_new': 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=800&auto=format&fit=crop',
    'original_step8': 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?q=80&w=800&auto=format&fit=crop',
    'candidate_keys_1': 'https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?q=80&w=800&auto=format&fit=crop',
    'candidate_handshake_1': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800&auto=format&fit=crop',
    'candidate_handshake_2': 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=800&auto=format&fit=crop'
}

for name, url in images.items():
    try:
        urllib.request.urlretrieve(url, f'test_images/{name}.jpg')
        print(f"Downloaded {name}")
    except Exception as e:
        print(f"Failed to download {name}: {e}")
