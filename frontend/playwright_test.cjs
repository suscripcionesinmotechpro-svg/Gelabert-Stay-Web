const { chromium } = require('playwright');
const path = require('path');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Listen for console messages
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

  console.log('--- TESTING CATALOG PAGE ---');
  await page.goto('https://gelaberthomes.es/propiedades', { waitUntil: 'domcontentloaded' });
  console.log('Page loaded in browser.');

  // Wait for properties list to load
  console.log('Waiting for room rental property card to appear...');
  try {
    await page.waitForSelector('text="Alquiler por habitaciones"', { timeout: 15000 });
    console.log('Found room rental property card!');
  } catch (err) {
    console.log('Room rental card not found on page.', err.message);
  }

  // Find the Consultar button on the card containing "Alquiler por habitaciones" and "Ciudad Jardín"
  console.log('Locating Consultar button...');
  const cardLocator = page.locator('div.group:has-text("Alquiler por habitaciones")').first();
  if (await cardLocator.count() > 0) {
    console.log('Found Ciudad Jardín card element!');
    
    // Check if the button is visible
    const button = cardLocator.locator('button:has-text("Consultar")');
    console.log('Consultar button count:', await button.count());
    
    if (await button.count() > 0) {
      console.log('Clicking the Consultar button...');
      
      // Before click screenshot
      await cardLocator.screenshot({ path: path.join(__dirname, 'card_before_click.png') });
      console.log('Saved card_before_click.png');
      
      await button.click();
      console.log('Clicked Consultar!');
      
      await page.waitForTimeout(2000);
      
      // After click screenshot
      await cardLocator.screenshot({ path: path.join(__dirname, 'card_after_click.png') });
      console.log('Saved card_after_click.png');
      
      // Check if popover text is visible
      const popoverLocator = cardLocator.locator('text="Estado de Habitaciones"');
      console.log('Popover "Estado de Habitaciones" visible?', await popoverLocator.isVisible());
      
      if (await popoverLocator.isVisible()) {
        const popoverText = await cardLocator.locator('div:has-text("Estado de Habitaciones")').first().innerText();
        console.log('Popover content:\n', popoverText);
      }
    } else {
      console.log('Consultar button not found inside room rental card.');
    }
  } else {
    console.log('Could not find room rental card container.');
  }

  console.log('\n--- TESTING PROPERTY DETAILS PAGE ---');
  await page.goto('https://gelaberthomes.es/propiedades/GEL-127', { waitUntil: 'domcontentloaded' });
  console.log('Details page loaded in browser.');

  try {
    await page.waitForSelector('text="Distribución por Habitaciones"', { timeout: 15000 });
    console.log('Found "Distribución por Habitaciones"!');
  } catch (err) {
    console.log('Room distribution section not found or timed out.', err.message);
  }

  // Take screenshot of room list section
  const sectionLocator = page.locator('div:has-text("Distribución por Habitaciones")').first();
  if (await sectionLocator.count() > 0) {
    await sectionLocator.screenshot({ path: path.join(__dirname, 'room_distribution.png') });
    console.log('Saved room_distribution.png');
  }

  // Get room cards content on the detail page
  const roomCards = await page.locator('h4:has-text("Habitación")').evaluateAll(nodes => 
    nodes.map(node => {
      let parent = node.closest('.flex-col');
      return parent ? parent.innerText : node.innerText;
    })
  );
  console.log('\n--- ROOM CARDS CONTENT IN DETAIL PAGE ---');
  roomCards.forEach((text, idx) => {
    console.log(`Room #${idx + 1}:\n${text}\n-------------------------`);
  });

  await browser.close();
}

run().catch(console.error);
