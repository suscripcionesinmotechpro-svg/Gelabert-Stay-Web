

async function check(url) {
  console.log(`\nFetching ${url}...`);
  const res = await fetch(url, { headers: { 'pragma': 'no-cache', 'cache-control': 'no-cache' } });
  console.log('Status:', res.status);
  console.log('Headers:');
  for (const [key, value] of res.headers.entries()) {
    console.log(`  ${key}: ${value}`);
  }
  const text = await res.text();
  console.log('HTML length:', text.length);
  // Search for "Consultar" or "consultar" in HTML
  console.log('Contains "Consultar":', text.toLowerCase().includes('consultar'));
}

async function run() {
  await check('https://gelaberthomes.es/propiedades');
  await check('https://gelaberthomes.es/propiedades/GEL-127');
}

run().catch(console.error);
