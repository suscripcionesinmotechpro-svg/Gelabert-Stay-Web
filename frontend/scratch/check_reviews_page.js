const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('[BROWSER LOG]', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('[BROWSER ERROR]', err.message));

  try {
    console.log('Navigating to https://gelaberthomes.es/reseñas...');
    await page.goto('https://gelaberthomes.es/reseñas', { waitUntil: 'networkidle' });
    console.log('Waiting 8 seconds to ensure reviews load or timeout...');
    await page.waitForTimeout(8000);

    // Get the rendered review authors
    const authors = await page.locator('h4').evaluateAll(nodes => nodes.map(n => n.innerText));
    console.log('Rendered authors (from h4 tags):', authors);

    // Get fallback badge or rating text
    const text = await page.locator('body').innerText();
    console.log('Does page contain Carlos Rodríguez?', text.includes('Carlos Rodríguez'));
    console.log('Does page contain Pepa Mora?', text.includes('Pepa Mora'));
    console.log('Does page contain Adela López?', text.includes('Adela López'));

  } catch (err) {
    console.error('Error during run:', err);
  } finally {
    await browser.close();
  }
}

run();
