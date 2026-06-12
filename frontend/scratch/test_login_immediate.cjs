const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('[BROWSER LOG]', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('[BROWSER ERROR]', err.message));

  try {
    console.log('Navigating...');
    page.goto('http://localhost:3000/admin/login').catch(() => {});
    
    for (let i = 1; i <= 5; i++) {
      await new Promise(r => setTimeout(r, 1000));
      console.log(`--- After ${i} second(s) ---`);
      const html = await page.content();
      console.log('HTML length:', html.length);
      const bodyText = await page.locator('body').innerText().catch(() => 'Timeout getting text');
      console.log('Body Text length:', bodyText.length);
      console.log('Body text snippet:', bodyText.slice(0, 100));
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

run();
