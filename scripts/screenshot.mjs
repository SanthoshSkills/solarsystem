import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:5173';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);

  await page.screenshot({ path: 'screenshot-playwright.png', fullPage: false });

  console.log('=== CONSOLE ERRORS ===');
  if (errors.length === 0) {
    console.log('(none)');
  } else {
    for (const e of errors) console.log('  ERROR:', e);
  }

  const panel = await page.$('#future-lab-root');
  if (panel) {
    const box = await panel.boundingBox();
    console.log(`\n=== future-lab-root ===`);
    console.log(`  Found: true`);
    console.log(`  Position: x=${box.x}, y=${box.y}, w=${box.width}, h=${box.height}`);
    console.log(`  Visible: ${box.width > 0 && box.height > 0}`);
  } else {
    console.log(`\n=== future-lab-root: NOT FOUND in DOM ===`);
  }

  const cosmicNav = await page.$('[style*="Cosmic Navigator"]');
  console.log(`\nCosmic Navigator text found: ${!!cosmicNav}`);

  const html = await page.content();
  const hasFutureLabDiv = html.includes('future-lab-root');
  const hasReactScript = html.includes('/src/main.jsx');
  console.log(`\nHTML check:`);
  console.log(`  #future-lab-root div: ${hasFutureLabDiv}`);
  console.log(`  /src/main.jsx script: ${hasReactScript}`);

  await browser.close();
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
