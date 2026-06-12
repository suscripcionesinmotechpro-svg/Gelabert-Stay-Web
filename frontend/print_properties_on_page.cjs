const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('[BROWSER LOG]', msg.text()));
  page.on('pageerror', err => console.error('[BROWSER ERROR]', err.message));

  try {
    console.log('Navigating to properties page...');
    await page.goto('https://gelaberthomes.es/propiedades', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(6000);

    const cards = await page.locator('div.group').evaluateAll(nodes => 
      nodes.map(node => node.innerText)
    );
    
    console.log(`Found ${cards.length} property cards:`);
    cards.forEach((text, idx) => {
      if (text.toLowerCase().includes('habitac') || text.toLowerCase().includes('carranque') || text.toLowerCase().includes('ciudad')) {
        console.log(`Card #${idx + 1} (FULL TEXT):\n${text}\n-------------------------`);
      }
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

run().catch(console.error);
