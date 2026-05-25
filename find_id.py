import urllib.request
import re

req = urllib.request.Request(
    'https://html.duckduckgo.com/html/?q=site:unsplash.com+"handshake"+real+estate',
    headers={'User-Agent': 'Mozilla/5.0'}
)
html = urllib.request.urlopen(req).read().decode('utf-8')
matches = re.findall(r'unsplash\.com/photos/([a-zA-Z0-9_-]+)', html)

# print out distinct matches
seen = set()
for m in matches:
    if m not in seen:
        print(m)
        seen.add(m)
