import requests

url = "https://aumqjpqngmhpbwytpets.supabase.co/functions/v1/google-reviews"
headers = {"Content-Type": "application/json"}

try:
    response = requests.post(url, headers=headers)
    print(f"Status Code: {response.status_code}")
    print("Response Body:")
    print(response.text)
except Exception as e:
    print(f"Error: {e}")
