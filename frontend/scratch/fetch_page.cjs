const http = require('https');

http.get('https://gelaberthomes.es', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log("Status Code:", res.statusCode);
    console.log("HTML length:", data.length);
    console.log("Has UpdatePrompt:", data.includes('UpdatePrompt'));
    const htmlMatch = data.match(/<html[^>]*class(?:Name)?="([^"]*)"/i);
    console.log("HTML tag class:", htmlMatch ? htmlMatch[0] : "Not found");
  });
}).on('error', (err) => {
  console.error("Error:", err.message);
});
