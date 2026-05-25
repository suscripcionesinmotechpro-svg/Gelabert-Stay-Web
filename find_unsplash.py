import urllib.request
import re

req = urllib.request.Request(
    'https://unsplash.com/s/photos/handshake-real-estate',
    headers={'User-Agent': 'Mozilla/5.0'}
)
html = urllib.request.urlopen(req).read().decode('utf-8')
matches = re.findall(r'\"id\":\"([a-zA-Z0-9_-]{11})\"', html)

# Print unique IDs
for m in list(set(matches))[:10]:
    print(m)
