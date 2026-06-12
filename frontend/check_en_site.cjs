const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('[BROWSER LOG]', msg.text()));
  page.on('pageerror', err => console.error('[BROWSER ERROR]', err.message));

  try {
    console.log('Navigating to English catalog...');
    await page.goto('https://gelaberthomes.es/en/propiedades', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(6000);

    const buttons = await page.locator('button').evaluateAll(nodes => 
      nodes.map(n => ({ text: n.innerText, class: n.className }))
    );
    console.log('Check/Consultar buttons in English page:', buttons.filter(b => b.text.toLowerCase().includes('check') || b.text.toLowerCase().includes('consult')));

    console.log('\nNavigating to English details page for Ciudad Jardín (GEL-127)...');
    await page.goto('https://gelaberthomes.es/en/propiedades/GEL-127', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(6000);

    const hasRoomSection = await page.locator('text="Room Distribution"').count() > 0;
    console.log(`Has English "Room Distribution" section? ${hasRoomSection}`);

    if (hasRoomSection) {
      const roomCards = await page.locator('h4:has-text("Room")').evaluateAll(nodes => 
        nodes.map(node => {
          let parent = node.closest('.flex-col');
          return parent ? parent.innerText : node.innerText;
        })
      );
      roomCards.forEach((text, idx) => {
        console.log(`Room #${idx + 1}:\n${text}\n-------------------------`);
      });
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

run().catch(console.error);
