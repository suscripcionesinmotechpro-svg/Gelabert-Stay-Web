const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('[BROWSER LOG]', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('[BROWSER ERROR]', err.message));

  try {
    console.log('Navigating to http://localhost:3000/admin/login...');
    await page.goto('http://localhost:3000/admin/login');
    console.log('Waiting 10 seconds...');
    await page.waitForTimeout(10000);

    const html = await page.content();
    console.log('--- HTML CONTENT ---');
    console.log(html);

  } catch (err) {
    console.error('Error during run:', err);
  } finally {
    await browser.close();
  }
}

run();
