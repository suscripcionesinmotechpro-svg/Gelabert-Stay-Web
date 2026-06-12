const { chromium } = require('playwright');
const path = require('path');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Set viewport to desktop size
  await page.setViewportSize({ width: 1280, height: 800 });

  try {
    // 1. Capture catalog page
    console.log('Navigating to catalog...');
    await page.goto('https://gelaberthomes.es/propiedades', { waitUntil: 'networkidle' });
    
    // Accept cookies if dialog is present
    try {
      const cookieButton = page.locator('button:has-text("Aceptar todas"), button:has-text("ACEPTAR"), button:has-text("Only necessary")').first();
      if (await cookieButton.count() > 0) {
        await cookieButton.click();
        console.log('Accepted cookies');
        await page.waitForTimeout(1000);
      }
    } catch (e) {}

    // Scroll down to Carranque/Ciudad Jardín cards
    console.log('Taking catalog screenshot...');
    const card = page.locator('div.group:has-text("Cerradura individual")').first();
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    
    const screenshotPath1 = path.join('C:\\Users\\lenovo\\.gemini\\antigravity\\brain\\df8a4ddc-ac3a-4e9e-86bf-4b5ddf2e240b', 'catalog_room_rental_card.png');
    await card.screenshot({ path: screenshotPath1 });
    console.log('Saved:', screenshotPath1);

    // 2. Capture detail page rooms
    console.log('Navigating to details page...');
    await page.goto('https://gelaberthomes.es/propiedades/GEL-127', { waitUntil: 'networkidle' });
    
    console.log('Taking detail page rooms screenshot...');
    const section = page.locator('div:has-text("Distribución por Habitaciones")').first();
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    const screenshotPath2 = path.join('C:\\Users\\lenovo\\.gemini\\antigravity\\brain\\df8a4ddc-ac3a-4e9e-86bf-4b5ddf2e240b', 'detail_rooms_jardin.png');
    await section.screenshot({ path: screenshotPath2 });
    console.log('Saved:', screenshotPath2);

  } catch (err) {
    console.error('Error during screenshot capture:', err);
  } finally {
    await browser.close();
  }
}

run().catch(console.error);
