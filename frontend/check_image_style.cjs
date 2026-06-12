const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Navigating to live property page...');
  await page.goto('https://gelaberthomes.es/propiedades/GEL-127', { waitUntil: 'networkidle' });

  // Get room cards images
  const imagesInfo = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs.map((img, i) => {
      const computedStyle = window.getComputedStyle(img);
      return {
        index: i,
        src: img.src,
        alt: img.alt,
        computedWidth: computedStyle.width,
        computedHeight: computedStyle.height,
        objectFit: computedStyle.objectFit,
        position: computedStyle.position,
        classes: img.className,
        parentClasses: img.parentElement ? img.parentElement.className : null,
        grandparentClasses: img.parentElement && img.parentElement.parentElement ? img.parentElement.parentElement.className : null
      };
    });
  });

  console.log(JSON.stringify(imagesInfo, null, 2));

  await browser.close();
}

run().catch(console.error);
