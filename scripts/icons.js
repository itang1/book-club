// Renders the icons from assets/icon.svg and assets/crest.svg with the
// pre-installed Chromium: `node scripts/icons.js`.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const svg = (file) => fs.readFileSync(path.join(root, 'assets', file), 'utf8');

const jobs = [
  // [source, output, width, height, transparent]
  ['icon.svg', 'assets/icon.png', 1024, 1024, false],
  ['icon.svg', 'public/icon.png', 512, 512, false],
  ['crest.svg', 'assets/adaptive-icon.png', 1024, 1024, true, 0.55],
  ['crest.svg', 'assets/favicon.png', 48, 48, true, 0.98],
  ['crest.svg', 'assets/crest.png', 150, 180, true, 1],
  // Served from the site, for the email header.
  ['crest.svg', 'public/crest.png', 120, 144, true, 1],
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const [source, out, width, height, transparent, fill = 1] of jobs) {
    await page.setViewportSize({ width, height });
    const size = `width:${width * fill}px;height:${height * fill}px`;
    await page.setContent(
      `<html><body style="margin:0;display:flex;align-items:center;justify-content:center;width:${width}px;height:${height}px;background:transparent">` +
        svg(source).replace('<svg ', `<svg style="${size}" preserveAspectRatio="xMidYMid meet" `) +
        '</body></html>',
    );
    await page.screenshot({ path: path.join(root, out), omitBackground: transparent });
    console.log(out);
  }
  // The card shown when a link to the app is shared (Open Graph / Twitter).
  const font = (file) =>
    'data:font/woff2;base64,' +
    fs.readFileSync(path.join(root, 'assets/fonts', file)).toString('base64');
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(`<html><head><style>
    @font-face { font-family: Caslon; src: url(${font('libre-caslon-text-latin-400-normal.woff2')}); }
    @font-face { font-family: Caslon; font-style: italic; src: url(${font('libre-caslon-text-latin-400-italic.woff2')}); }
    body { margin: 0; width: 1200px; height: 630px; background: #1f3b2c; color: #f6f1e6;
      font-family: Caslon, Georgia, serif; display: flex; flex-direction: column; align-items: center;
      justify-content: center; box-sizing: border-box; border-bottom: 14px solid #b4925a; }
    svg { width: 150px; height: 180px; }
    h1 { font-weight: 400; font-size: 84px; margin: 22px 0 0; letter-spacing: .5px; }
    .rule { display: flex; align-items: center; gap: 16px; width: 360px; margin-top: 18px; }
    .rule i { flex: 1; height: 2px; background: #b4925a; } .rule b { width: 12px; height: 12px; background: #b4925a; transform: rotate(45deg); }
    .motto { color: #b4925a; letter-spacing: 9px; font-size: 24px; margin-top: 18px; }
    p { font-style: italic; font-size: 34px; opacity: .88; margin: 14px 0 0; }
  </style></head><body>${svg('crest.svg')}<h1>The Traveling Books</h1>
    <div class="rule"><i></i><b></b><i></i></div><div class="motto">LEGE · SCRIBE · TRADE</div>
    <p>Read it, write in it, and pass it on.</p></body></html>`);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(root, 'public/og.png') });
  console.log('public/og.png');

  await browser.close();
})();
