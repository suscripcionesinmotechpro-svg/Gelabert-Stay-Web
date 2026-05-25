import urllib.request
import json

url = 'https://unsplash.com/napi/search/photos?query=handing+keys+real+estate&per_page=10'
req = urllib.request.Request(
    url,
    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
)

try:
    response = urllib.request.urlopen(req)
    data = json.loads(response.read().decode('utf-8'))
    print("Results:")
    for result in data.get('results', []):
        print(f"ID: {result['id']}")
        print(f"Description: {result.get('description') or result.get('alt_description')}")
        urls = result.get('urls', {})
        print(f"Raw image URL: {urls.get('raw')}")
        print("-" * 40)
except Exception as e:
    print("Error:", e)
