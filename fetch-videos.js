const https = require('https');

https.get('https://coverr.co/s/real-estate', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Coverr usually has video URLs in the page source
    const regex = /https:\/\/[\w\-\.]+\.coverr\.co\/[^\/]+\/.*?.mp4/gi;
    let match;
    const urls = [];
    while ((match = regex.exec(data)) !== null) {
      if(!urls.includes(match[0])) urls.push(match[0]);
    }
    console.log("Coverr URLs:", urls.slice(0, 5));
  });
}).on('error', console.error);

https.get('https://mixkit.co/free-stock-video/real-estate/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const regex = /https:\/\/assets\.mixkit\.co\/videos\/preview\/[^\"\'\s]+\.mp4/gi;
    let match;
    const urls = [];
    while ((match = regex.exec(data)) !== null) {
      if(!urls.includes(match[0])) urls.push(match[0]);
    }
    console.log("Mixkit URLs:", urls.slice(0, 5));
  });
}).on('error', console.error);
