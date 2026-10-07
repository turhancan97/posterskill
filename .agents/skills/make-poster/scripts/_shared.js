// Shared helpers: open a poster page at its exact physical size (1 mm = 96/25.4 px).
const path = require('path');
const { chromium } = require('playwright');
const PX_PER_MM = 96 / 25.4;

async function openPoster(file, { media = 'screen', orientation } = {}) {
  const url = 'file://' + path.resolve(file) + (orientation ? '?orientation=' + orientation : '');
  const browser = await chromium.launch();
  // Probe the page size first (window.POSTER_DIMS is set by the template; fall back to A0 landscape).
  let page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
  await page.goto(url, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(1500);
  const dims = (await page.evaluate(() => window.POSTER_DIMS)) || { widthMm: 1189, heightMm: 841 };
  await page.close();
  page = await browser.newPage({ viewport: { width: Math.round(dims.widthMm * PX_PER_MM), height: Math.round(dims.heightMm * PX_PER_MM) } });
  if (media === 'print') await page.emulateMedia({ media: 'print' });
  await page.goto(url, { waitUntil: 'load', timeout: 90000 });
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForTimeout(2500);
  return { browser, page, dims };
}

async function brokenImages(page) {
  return page.evaluate(() => [...document.images].filter(i => i.style.display !== 'none' && (!i.complete || i.naturalWidth === 0)).map(i => i.getAttribute('src')));
}

module.exports = { openPoster, brokenImages, PX_PER_MM };
