import urllib.request
import re

def get_unsplash_title(photo_id):
    url = f'https://unsplash.com/photos/{photo_id}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        html = urllib.request.urlopen(req).read().decode('utf-8')
        title = re.search(r'<title[^>]*>(.*?)</title>', html, re.I)
        if title:
            return title.group(1)
        return "No title found"
    except Exception as e:
        return f"Error: {e}"

# Test a few IDs
print("e02f11c3d0e2:", get_unsplash_title("e02f11c3d0e2"))
print("9e0e4c89eb11:", get_unsplash_title("9e0e4c89eb11"))
print("15d82a90b9b1:", get_unsplash_title("15d82a90b9b1"))
print("ce09059eeffa:", get_unsplash_title("ce09059eeffa"))
