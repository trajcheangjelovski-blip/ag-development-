const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('Page loaded. Title:', await page.title());

  // Debug: log all button texts on the page to find the tab bar
  const allButtons = await page.evaluate(() => {
    return [...document.querySelectorAll('button')].map(b => b.innerText.trim()).filter(t => t.length > 0);
  });
  console.log('All buttons on page:', JSON.stringify(allButtons));

  // Find the pricing section / tab bar
  const tabSelectors = [
    'button:has-text("Build a Website")',
    '[role="tab"]:has-text("Build a Website")',
    'a:has-text("Build a Website")',
  ];

  let pricingTab = null;
  for (const sel of tabSelectors) {
    try {
      pricingTab = await page.$(sel);
      if (pricingTab) { console.log('Found pricing tab with selector:', sel); break; }
    } catch (e) {}
  }

  if (!pricingTab) {
    console.log('Could not find "Build a Website" tab. Dumping visible text...');
    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 3000));
    console.log(bodyText);
    await browser.close();
    process.exit(1);
  }

  // Get tab bounding box for scroll position
  const tabBox = await pricingTab.boundingBox();
  console.log('Tab bounding box:', JSON.stringify(tabBox));

  // Scroll the tab into view
  await pricingTab.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  // Scroll down a bit so the cards are visible (tab bar + cards)
  await page.evaluate(() => { window.scrollBy(0, 100); });
  await page.waitForTimeout(400);

  // Screenshot 1: default "Build a Website" tab
  await page.screenshot({ path: 'C:\\Users\\MCASH\\AppData\\Local\\Temp\\tab-build.png', fullPage: false });
  console.log('Saved tab-build.png');

  // Dump visible section content
  const buildContent = await page.evaluate(() => {
    // Walk all sections and find the one with pricing tabs
    const candidates = [...document.querySelectorAll('section, div')].filter(el => {
      const t = el.innerText || '';
      return t.includes('Build a Website') && t.includes('L1 IT Support');
    });
    if (candidates.length) {
      // Pick the smallest (most specific) matching element
      candidates.sort((a, b) => (a.innerText || '').length - (b.innerText || '').length);
      return candidates[0].innerText.substring(0, 2000);
    }
    return 'Pricing section not found via text match';
  });
  console.log('Build a Website section content:\n', buildContent);

  // Click "L1 IT Support" tab
  const itTabEl = await page.$('button:has-text("L1 IT Support"), [role="tab"]:has-text("L1 IT Support"), a:has-text("L1 IT Support")');
  if (!itTabEl) {
    console.log('ERROR: Could not find "L1 IT Support" tab');
  } else {
    await itTabEl.click();
    await page.waitForTimeout(300);
    // Re-scroll to make sure tab bar is still in view
    await itTabEl.scrollIntoViewIfNeeded();
    await page.evaluate(() => { window.scrollBy(0, 100); });
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'C:\\Users\\MCASH\\AppData\\Local\\Temp\\tab-it.png', fullPage: false });
    console.log('Saved tab-it.png');
    const itContent = await page.evaluate(() => {
      const candidates = [...document.querySelectorAll('section, div')].filter(el => {
        const t = el.innerText || '';
        return t.includes('Build a Website') && t.includes('L1 IT Support');
      });
      if (candidates.length) {
        candidates.sort((a, b) => (a.innerText || '').length - (b.innerText || '').length);
        return candidates[0].innerText.substring(0, 2000);
      }
      return 'Pricing section not found';
    });
    console.log('L1 IT Support section content:\n', itContent);
  }

  // Click "Design & Social Media" tab
  const designTabEl = await page.$('button:has-text("Design & Social Media"), [role="tab"]:has-text("Design & Social Media"), a:has-text("Design & Social Media")');
  if (!designTabEl) {
    console.log('ERROR: Could not find "Design & Social Media" tab');
  } else {
    await designTabEl.click();
    await page.waitForTimeout(300);
    await designTabEl.scrollIntoViewIfNeeded();
    await page.evaluate(() => { window.scrollBy(0, 100); });
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'C:\\Users\\MCASH\\AppData\\Local\\Temp\\tab-design.png', fullPage: false });
    console.log('Saved tab-design.png');
    const designContent = await page.evaluate(() => {
      const candidates = [...document.querySelectorAll('section, div')].filter(el => {
        const t = el.innerText || '';
        return t.includes('Build a Website') && t.includes('Design');
      });
      if (candidates.length) {
        candidates.sort((a, b) => (a.innerText || '').length - (b.innerText || '').length);
        return candidates[0].innerText.substring(0, 2000);
      }
      return 'Pricing section not found';
    });
    console.log('Design & Social Media section content:\n', designContent);
  }

  await browser.close();
  console.log('Done.');
})();
