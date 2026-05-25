import urllib.request

req = urllib.request.Request(
    'https://html.duckduckgo.com/html/?q=site:unsplash.com+handshake+real+estate',
    headers={'User-Agent': 'Mozilla/5.0'}
)
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    print("Length:", len(html))
    print(html[:1000])
except Exception as e:
    print("Error:", e)
