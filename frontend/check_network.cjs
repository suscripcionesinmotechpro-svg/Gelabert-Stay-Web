const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('[BROWSER LOG]', msg.text()));
  page.on('pageerror', err => console.error('[BROWSER ERROR]', err.message));

  page.on('request', request => {
    // Only log supabase requests to keep output readable
    if (request.url().includes('supabase')) {
      console.log(`>> Request: ${request.method()} ${request.url().slice(0, 100)}`);
      const headers = request.headers();
      const apikey = headers['apikey'];
      const auth = headers['authorization'];
      console.log(`   Headers:`);
      console.log(`     apikey: exists=${!!apikey}, len=${apikey?.length}, prefix=${apikey?.slice(0, 10)}, suffix=${apikey?.slice(-10)}`);
      console.log(`     Authorization: exists=${!!auth}, len=${auth?.length}, prefix=${auth?.slice(0, 15)}, suffix=${auth?.slice(-10)}`);
    }
  });

  page.on('response', response => {
    if (response.url().includes('supabase')) {
      console.log(`<< Response: ${response.status()} ${response.url().slice(0, 100)}`);
      if (response.status() === 401) {
        response.text().then(text => console.log(`   401 Error Body:`, text)).catch(() => {});
      }
    }
  });

  try {
    console.log('Navigating to properties catalog...');
    await page.goto('https://gelaberthomes.es/propiedades', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(6000);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

run().catch(console.error);
