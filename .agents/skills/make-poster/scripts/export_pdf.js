#!/usr/bin/env node
// Export the poster to a one-page vector PDF at its design size, or scaled to another ISO size.
// Usage: node export_pdf.js poster/index.html [--out poster/poster.pdf] [--size A0|A1] [--orientation portrait]
// --size A1 keeps the A0 design and scales it uniformly (same √2 aspect), so text stays vector-sharp.
const fs = require('fs');
const { openPoster, brokenImages } = require('./_shared');
const SIZES = { A0: [1189, 841], A1: [841, 594], A2: [594, 420] };
const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--')) || 'poster/index.html';
const opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : undefined; };

(async () => {
  const { browser, page, dims } = await openPoster(file, { media: 'print', orientation: opt('orientation') });
  const portrait = dims.heightMm > dims.widthMm;
  let [w, h] = [dims.widthMm, dims.heightMm];
  const size = opt('size');
  if (size) { const [L, S] = SIZES[size]; [w, h] = portrait ? [S, L] : [L, S]; }
  const zoom = Math.min(w / dims.widthMm, h / dims.heightMm);
  if (zoom !== 1) await page.addStyleTag({ content: `@page { size: ${w}mm ${h}mm; margin: 0; } html { zoom: ${zoom}; }` });
  const fonts = await page.evaluate(() => [...new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => f.family))]);
  const broken = await brokenImages(page);
  const out = opt('out') || file.replace(/index\.html$/, '') + `poster_${size || 'design'}.pdf`;
  await page.pdf({ path: out, width: `${w}mm`, height: `${h}mm`, printBackground: true, pageRanges: '1' });
  await browser.close();
  const pdf = fs.readFileSync(out, 'latin1');
  const pages = (pdf.match(/\/Type\s*\/Page[^s]/g) || []).length;
  const mb = pdf.match(/\/MediaBox\s*\[\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)/);
  console.log(`wrote ${out}: ${pages} page(s), ${mb ? (mb[1] / 72 * 25.4).toFixed(0) + '×' + (mb[2] / 72 * 25.4).toFixed(0) + ' mm' : '?'}, zoom ${zoom.toFixed(4)}`);
  console.log('fonts loaded:', fonts.join(', ') || 'NONE (check your network: Google Fonts)');
  console.log('broken images:', broken.length ? broken.join(', ') : 'none');
  if (pages !== 1 || broken.length) process.exit(1);
  console.log('Next: rasterize the PDF and LOOK at it (bottom of every column, figure labels). The screen layout is not the print layout.');
})().catch(e => { console.error(e); process.exit(2); });
