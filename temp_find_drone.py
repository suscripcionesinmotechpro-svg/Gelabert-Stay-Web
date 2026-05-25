import urllib.request, re
req = urllib.request.Request('https://unsplash.com/s/photos/drone-vertical')
req.add_header('User-Agent', 'Mozilla/5.0')
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    ids = re.findall(r'"id":"([a-zA-Z0-9_-]{10,20})"', html)
    print('Portrait Drone IDs:', list(set(ids))[:10])
except Exception as e:
    print('Error:', e)
