const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

  console.log('Navigating to properties catalog...');
  await page.goto('http://localhost:3000/propiedades', { waitUntil: 'networkidle' });

  // Let's print out what properties are visible
  const cardTitles = await page.locator('h3').allTextContents();
  console.log('Visible property titles on catalog page:', cardTitles);

  console.log('Navigating to Ciudad Jardin property detail page...');
  await page.goto('http://localhost:3000/propiedades/5405d27f-19d9-449f-9f78-2fa1deda8fb7', { waitUntil: 'networkidle' });

  console.log('Page title:', await page.title());

  console.log('Waiting for room distribution section...');
  try {
    await page.waitForSelector('text="Distribución por Habitaciones"', { timeout: 10000 });
    console.log('Found "Distribución por Habitaciones"!');
  } catch (err) {
    console.log('Room distribution section not found or timed out.', err.message);
  }

  // Get room cards content
  const roomCards = await page.locator('.flex-grow').evaluateAll(nodes => 
    nodes.map(node => {
      const h4 = node.querySelector('h4');
      if (!h4) return null;
      return node.innerText;
    }).filter(Boolean)
  );
  console.log('\n--- ROOM CARDS CONTENT ---');
  roomCards.forEach((text, idx) => {
    console.log(`Room #${idx + 1}:\n${text}\n-------------------------`);
  });

  // Check catalog page card popup / Consultar button
  console.log('\nNavigating back to properties catalog...');
  await page.goto('http://localhost:3000/propiedades', { waitUntil: 'networkidle' });

  const checkButtons = await page.locator('button:has-text("Consultar")');
  const count = await checkButtons.count();
  console.log(`Found ${count} "Consultar" button(s).`);

  if (count > 0) {
    console.log('Clicking the first "Consultar" button...');
    const firstButton = checkButtons.first();
    await firstButton.click();
    console.log('Clicked "Consultar"!');

    await page.waitForTimeout(1000);

    const popoverVisible = await page.locator('text="Estado de Habitaciones"').isVisible();
    console.log('Popover visible after click?', popoverVisible);

    if (popoverVisible) {
      const popoverText = await page.locator('div:has-text("Estado de Habitaciones")').first().innerText();
      console.log('Popover content:\n', popoverText);
    }
  }

  await browser.close();
}

run().catch(console.error);
