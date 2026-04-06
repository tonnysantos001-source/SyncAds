import urllib.request
import os

icons = {
  'visa': 'https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg',
  'mastercard': 'https://upload.wikimedia.org/wikipedia/commons/b/b7/MasterCard_Logo.svg',
  'elo': 'https://upload.wikimedia.org/wikipedia/commons/8/88/Elo_logo.svg',
  'amex': 'https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg',
  'discover': 'https://upload.wikimedia.org/wikipedia/commons/5/57/Discover_Card_logo.svg',
  'diners': 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Diners_Club_Logo3.svg',
  'pix': 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo%E2%80%94pix_powered_by_Banco_Central_%28Brazil%2C_2020%29.svg'
}

req_headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

for name, url in icons.items():
    try:
        req = urllib.request.Request(url, headers=req_headers)
        with urllib.request.urlopen(req) as response:
            with open(f"public/icones-pay/card-{name}.svg", "wb") as out_file:
                out_file.write(response.read())
        print(f"Downloaded {name}")
    except Exception as e:
        print(f"Failed {name}: {e}")
