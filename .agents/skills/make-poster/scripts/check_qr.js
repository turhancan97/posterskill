#!/usr/bin/env node
// Decode the poster's QR code at several sizes (simulating phones at different distances).
// Usage: node check_qr.js poster/index.html [--selector ".about-qr svg"] [--expect https://example.com/]
const jsQR = require('jsqr');
const { openPoster } = require('./_shared');
const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--')) || 'poster/index.html';
const opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : undefined; };
const selector = opt('selector') || '.about-qr svg, .about-qr img';

(async () => {
  const { browser, page } = await openPoster(file, { media: 'print' });
  const el = await page.$(selector);
  if (!el) { console.error('no QR element found for selector', selector); process.exit(1); }
  const png = (await el.screenshot()).toString('base64');
  let ok = 0, results = [];
  for (const scale of [2, 1, 0.6, 0.35]) {
    const img = await page.evaluate(async ({ png, scale }) => {
      const im = new Image(); im.src = 'data:image/png;base64,' + png; await im.decode();
      const c = document.createElement('canvas'); c.width = Math.round(im.width * scale); c.height = Math.round(im.height * scale);
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
      return { w: c.width, h: c.height, data: Array.from(x.getImageData(0, 0, c.width, c.height).data) };
    }, { png, scale });
    const r = jsQR(Uint8ClampedArray.from(img.data), img.w, img.h);
    results.push(`${img.w}px: ${r ? r.data : 'NO DECODE'}`); if (r && (!opt('expect') || r.data === opt('expect'))) ok++;
  }
  await browser.close();
  results.forEach(l => console.log(l));
  console.log(ok === 4 ? 'QR OK at all sizes' : `QR FAILED at ${4 - ok} size(s) — enlarge it, shrink the centre badge, or raise contrast`);
  process.exit(ok === 4 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
