const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://gelaberthomes.es/propiedades');
  console.log('Navigated to page.');
  
  // Wait 6 seconds
  await page.waitForTimeout(6000);
  
  const bodyText = await page.locator('body').innerText();
  console.log('Body length:', bodyText.length);
  console.log('Contains "Cargando":', bodyText.includes('Cargando'));
  console.log('Contains "Ciudad Jardín":', bodyText.includes('Ciudad Jardín'));
  
  await browser.close();
}

run().catch(console.error);
