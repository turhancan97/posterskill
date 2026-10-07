#!/usr/bin/env node
// Per-card clip/slack report in mm, for BOTH screen and print layouts (they can differ),
// plus graphics share and word count. Usage: node check_layout.js poster/index.html [--orientation portrait]
const { openPoster, brokenImages, PX_PER_MM } = require('./_shared');
const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--')) || 'poster/index.html';
const oi = args.indexOf('--orientation'); const orientation = oi >= 0 ? args[oi + 1] : undefined;

(async () => {
  let worst = 0;
  for (const media of ['screen', 'print']) {
    const { browser, page, dims } = await openPoster(file, { media, orientation });
    const r = await page.evaluate((pxmm) => {
      const cols = [...document.querySelectorAll('.col')].map(c => ({
        id: c.id,
        cards: [...c.querySelectorAll('.card')].map(k => {
          const bottom = k.getBoundingClientRect().bottom;
          const contentBottom = Math.max(...[...k.children].map(ch => ch.getBoundingClientRect().bottom));
          return { id: k.dataset.id, clipMm: +((k.scrollHeight - k.clientHeight) / pxmm).toFixed(1), slackMm: +((bottom - contentBottom) / pxmm).toFixed(1) };
        }),
      }));
      const area = el => { const b = el.getBoundingClientRect(); return b.width * b.height; };
      const content = document.querySelector('.poster');
      const graphics = [...content.querySelectorAll('img, .fig-wrap > svg, .ph, .callouts, .abl-row')].reduce((a, e) => a + area(e), 0);
      const words = content.innerText.replace(/\s+/g, ' ').split(' ').filter(Boolean).length;
      const hook = document.querySelector('.hook'); const hookWords = hook ? hook.innerText.replace(/\s+/g, ' ').split(' ').filter(Boolean).length : 0;
      return { cols, graphicsShare: +(graphics / area(content)).toFixed(3), words, hookWords };
    }, PX_PER_MM);
    console.log(`\n== ${media.toUpperCase()} (${dims.widthMm}×${dims.heightMm} mm, ${dims.orientation || ''})`);
    for (const c of r.cols) for (const k of c.cards) {
      const flag = k.clipMm > 0.5 ? '  <-- CLIPPED' : (k.slackMm > 25 ? '  (lots of empty space)' : '');
      worst = Math.max(worst, k.clipMm);
      console.log(`${c.id.padEnd(5)} ${String(k.id).padEnd(14)} clip ${String(k.clipMm).padStart(6)} mm  slack ${String(k.slackMm).padStart(6)} mm${flag}`);
    }
    console.log(`graphics share ${(r.graphicsShare * 100).toFixed(1)}% (aim >= 50%) · words: content ${r.words}, hook ${r.hookWords}`);
    const broken = await brokenImages(page); if (broken.length) console.log('BROKEN IMAGES:', broken.join(', '));
    await browser.close();
  }
  process.exit(worst > 0.5 ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
