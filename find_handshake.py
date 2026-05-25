import urllib.request
import re

req = urllib.request.Request(
    'https://html.duckduckgo.com/html/?q=site:images.unsplash.com+"photo"+handshake+keys',
    headers={'User-Agent': 'Mozilla/5.0'}
)
html = urllib.request.urlopen(req).read().decode('utf-8')
matches = re.findall(r'images\.unsplash\.com/photo-([a-zA-Z0-9_-]+)', html)

for m in list(set(matches)):
    print(m)
