import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  page.on('console', (msg) => console.log(`[${msg.type()}] ${msg.text()}`));
  page.on('response', (resp) => {
    if (resp.status() >= 400) {
      console.log(`[HTTP ${resp.status()}] ${resp.url()}`);
    }
  });
  page.on('pageerror', (err) => console.log('[PAGE_ERROR]', err.message, err.stack?.split('\n').slice(0, 3).join('\n')));

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);

  const content = await page.content();
  console.log('\n=== BODY INNER HTML (first 2000 chars) ===');
  const match = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (match) console.log(match[1].substring(0, 2000));

  await browser.close();
}

main().catch((err) => { console.error('FATAL:', err); process.exit(1); });
