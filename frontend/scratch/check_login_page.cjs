const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('Navigating to https://gelaberthomes.es/admin/login...');
    await page.goto('https://gelaberthomes.es/admin/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    const rootHtml = await page.locator('body').innerHTML();
    console.log('Body HTML snippet (first 3000 chars):');
    console.log(rootHtml.slice(0, 3000));

  } catch (err) {
    console.error('Error during run:', err);
  } finally {
    await browser.close();
  }
}

run();
