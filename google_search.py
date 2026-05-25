import urllib.request
import re

req = urllib.request.Request(
    'https://www.google.com/search?q=site:images.unsplash.com+handshake+real+estate+keys',
    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
)
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    matches = re.findall(r'photo-([a-zA-Z0-9_-]+)', html)
    for m in list(set(matches)):
        print("photo-" + m)
except Exception as e:
    print("Error:", e)
