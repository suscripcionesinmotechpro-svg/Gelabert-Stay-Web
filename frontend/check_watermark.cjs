const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Navigating to GEL-138...');
  await page.goto('https://gelaberthomes.es/propiedades/GEL-138', { waitUntil: 'networkidle' });

  // Wait for 2 seconds
  await page.waitForTimeout(2000);

  // Check if watermark text is present
  const watermarks = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('span'));
    return elements
      .filter(el => el.innerText && (el.innerText.includes('ALQUILADA') || el.innerText.includes('RESERVADA')))
      .map(el => ({
        text: el.innerText,
        classes: el.className,
        parentClasses: el.parentElement ? el.parentElement.className : null,
        grandparentClasses: el.parentElement && el.parentElement.parentElement ? el.parentElement.parentElement.className : null
      }));
  });

  console.log('Watermarks in DOM:', JSON.stringify(watermarks, null, 2));

  await browser.close();
}

run().catch(console.error);
