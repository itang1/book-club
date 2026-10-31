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
  await browser.close();
})();
