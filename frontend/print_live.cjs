const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://gelaberthomes.es/propiedades');
  await page.waitForTimeout(6000);
  
  const bodyHtml = await page.locator('body').innerHTML();
  console.log('Body HTML:\n', bodyHtml);
  
  await browser.close();
}

run().catch(console.error);
