const { chromium } = require('playwright');
const path = require('path');

async function testDomain(domain) {
  console.log(`\n==========================================`);
  console.log(`TESTING DOMAIN: ${domain}`);
  console.log(`==========================================`);
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log(`[${domain} BROWSER LOG]`, msg.text()));
  page.on('pageerror', err => console.error(`[${domain} BROWSER ERROR]`, err.message));

  try {
    console.log(`Navigating to ${domain}/propiedades...`);
    await page.goto(`${domain}/propiedades`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(6000); // Allow some time to load properties
    
    console.log('Page Title:', await page.title());
    
    // Check if there are any buttons with "Consultar"
    const buttons = await page.locator('button').evaluateAll(nodes => 
      nodes.map(n => ({ text: n.innerText, class: n.className }))
    );
    console.log('All buttons on page:', buttons.filter(b => b.text.toLowerCase().includes('consultar') || b.text.toLowerCase().includes('dispon')));

    // Check if there are property cards containing "Ciudad Jardín"
    const cardSelector = 'div.group:has-text("Ciudad Jardín")';
    const cardCount = await page.locator(cardSelector).count();
    console.log(`Cards containing "Ciudad Jardín": ${cardCount}`);
    
    if (cardCount > 0) {
      const cardText = await page.locator(cardSelector).first().innerText();
      console.log('Ciudad Jardín card text snippet:', cardText.slice(0, 300));
      
      const consultButton = page.locator(cardSelector).locator('button:has-text("Consultar")');
      const hasButton = await consultButton.count() > 0;
      console.log(`Has "Consultar" button on Ciudad Jardín card? ${hasButton}`);
    }
    
    console.log(`\nNavigating to ${domain}/propiedades/GEL-127...`);
    await page.goto(`${domain}/propiedades/GEL-127`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(6000);
    
    console.log('Details Page Title:', await page.title());
    
    const hasRoomSection = await page.locator('text="Distribución por Habitaciones"').count() > 0;
    console.log(`Has "Distribución por Habitaciones" section? ${hasRoomSection}`);
    
    if (hasRoomSection) {
      const roomCards = await page.locator('h4:has-text("Habitación")').evaluateAll(nodes => 
        nodes.map(node => {
          let parent = node.closest('.flex-col');
          return parent ? parent.innerText : node.innerText;
        })
      );
      console.log('Rooms found:');
      roomCards.forEach((text, idx) => {
        console.log(`Room #${idx + 1}:\n${text}\n-------------------------`);
      });
    } else {
      console.log('No rooms section found on details page!');
      const bodyText = await page.locator('body').innerText();
      console.log('Body snippet:', bodyText.slice(0, 1000));
    }
  } catch (err) {
    console.error(`Error during testing of ${domain}:`, err);
  } finally {
    await browser.close();
  }
}

async function run() {
  await testDomain('https://gelaberthomes.es');
  await testDomain('https://www.gelaberthomes.com');
}

run().catch(console.error);
