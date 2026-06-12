const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('[BROWSER LOG]', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('[BROWSER ERROR]', err.message));

  try {
    console.log('Navigating to http://localhost:3000/admin/login...');
    const response = await page.goto('http://localhost:3000/admin/login', { waitUntil: 'domcontentloaded' });
    console.log('Response Status:', response.status());
    console.log('Current URL:', page.url());
    console.log('Page Title:', await page.title());
    
    console.log('Waiting 5 seconds...');
    await page.waitForTimeout(5000);

    const bodyText = await page.locator('body').innerText();
    console.log('Body Text length:', bodyText.length);
    console.log('Body Text:');
    console.log(bodyText.slice(0, 1000));

    console.log('Taking screenshot...');
    await page.screenshot({ path: 'c:/Users/lenovo/Desktop/Gelabert Homes/04_Desarrollo_y_Sistemas/WEB/frontend/scratch/local_login_screenshot.png' });
    console.log('Screenshot saved to scratch/local_login_screenshot.png');

  } catch (err) {
    console.error('Error during run:', err);
  } finally {
    await browser.close();
  }
}

run();
