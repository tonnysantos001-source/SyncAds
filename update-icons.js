const https = require('https');
const fs = require('fs');

const icons = {
  'visa': 'https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg',
  'mastercard': 'https://upload.wikimedia.org/wikipedia/commons/b/b7/MasterCard_Logo.svg',
  'elo': 'https://upload.wikimedia.org/wikipedia/commons/8/88/Elo_logo.svg',
  'amex': 'https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg',
  'discover': 'https://upload.wikimedia.org/wikipedia/commons/5/57/Discover_Card_logo.svg',
  'diners': 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Diners_Club_Logo3.svg',
  'pix': 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo%E2%80%94pix_powered_by_Banco_Central_%28Brazil%2C_2020%29.svg'
};

for (const [name, url] of Object.entries(icons)) {
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      fs.writeFileSync(`public/icones-pay/card-${name}.svg`, data);
      console.log(`Downloaded ${name}`);
    });
  }).on('error', err => console.log('Error: ', err.message));
}
