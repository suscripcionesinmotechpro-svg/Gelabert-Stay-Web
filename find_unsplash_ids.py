import urllib.request
import re

query = 'handing+keys+real+estate+site%3Aunsplash.com%2Fphotos%2F'
url = f'https://html.duckduckgo.com/html/?q={query}'
req = urllib.request.Request(
    url,
    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
)

try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    # Find all Unsplash photo URLs
    urls = re.findall(r'unsplash\.com/photos/[a-zA-Z0-9_-]+', html)
    print("Found Unsplash URLs:")
    for u in sorted(list(set(urls))):
        print(u)
except Exception as e:
    print("Error:", e)
