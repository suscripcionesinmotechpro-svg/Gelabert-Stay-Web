const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('[BROWSER LOG]', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('[BROWSER ERROR]', err.message));

  try {
    console.log('Navigating directly to https://gelaberthomes.es/resenas...');
    const response = await page.goto('https://gelaberthomes.es/resenas', { waitUntil: 'domcontentloaded' });
    
    console.log('Final URL:', page.url());
    console.log('Response Status:', response.status());
    
    console.log('Waiting 8 seconds...');
    await page.waitForTimeout(8000);

    const bodyText = await page.locator('body').innerText();
    console.log('Body Text length:', bodyText.length);
    console.log('Body Text:');
    console.log(bodyText.slice(0, 1500));

  } catch (err) {
    console.error('Error during run:', err);
  } finally {
    await browser.close();
  }
}

run();
