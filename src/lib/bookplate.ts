import makeQr from 'qrcode-generator';

/**
 * A bookplate for inside the cover: whose copy it is, the title, the motto,
 * and a QR code to the book's page, so whoever is holding the copy can see
 * where it's been and who's waiting. Printed from the browser.
 */

export type Bookplate = { title: string; author: string; owner: string; link: string };

const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char,
  );

/** The QR code as an SVG that scales to its box. */
export function qrSvg(text: string): string {
  const qr = makeQr(0, 'M');
  qr.addData(text);
  qr.make();
  return qr.createSvgTag({ margin: 0, scalable: true });
}

const INK = '#1f3b2c';
const BRASS = '#b4925a';

/** The whole printable page: two copies of the plate, to cut out. */
export function bookplateHtml(plate: Bookplate): string {
  const title = escapeHtml(plate.title);
  const author = escapeHtml(plate.author);
  const owner = escapeHtml(plate.owner);
  const one = `
    <section class="plate">
      <p class="kicker">The Traveling Books</p>
      <p class="exlibris">This copy belongs to</p>
      <p class="owner">${owner}</p>
      <hr />
      <p class="title">${title}</p>
      <p class="author">${author}</p>
      <div class="qr">${qrSvg(plate.link)}</div>
      <p class="scan">Scan to see where it's been, and who's next.</p>
      <p class="motto">Read it. Write in it. Pass it on.</p>
    </section>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Bookplate: ${title}</title>
<style>
  @page { size: letter; margin: 0.5in; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: "Libre Caslon Text", Georgia, "Times New Roman", serif; color: ${INK}; }
  .sheet { display: flex; flex-wrap: wrap; gap: 0.4in; justify-content: center; padding: 0.25in 0; }
  .plate {
    width: 3in; height: 4in; padding: 0.22in 0.25in;
    border: 2px solid ${INK}; outline: 1px solid ${BRASS}; outline-offset: -6px;
    display: flex; flex-direction: column; align-items: center; text-align: center;
    break-inside: avoid;
  }
  p { margin: 0; }
  .kicker { font-size: 8pt; letter-spacing: 0.22em; text-transform: uppercase; color: ${BRASS}; }
  .exlibris { margin-top: 0.12in; font-size: 8.5pt; font-style: italic; }
  .owner { font-size: 15pt; font-weight: 700; line-height: 1.15; }
  hr { width: 0.8in; border: 0; border-top: 1px solid ${BRASS}; margin: 0.08in auto; }
  .title { font-size: 11pt; font-style: italic; line-height: 1.2; max-height: 2.6em; overflow: hidden; }
  .author { font-size: 8.5pt; margin-top: 0.02in; }
  .qr { width: 1.5in; height: 1.5in; margin: 0.16in auto 0.08in; }
  .qr svg { width: 100%; height: 100%; }
  .qr svg path, .qr svg rect[fill="black"] { fill: ${INK}; }
  .scan { font-size: 7pt; }
  .motto { margin-top: auto; font-size: 8pt; letter-spacing: 0.04em; color: ${BRASS}; }
  .hint { text-align: center; font: 10pt system-ui, sans-serif; color: #575046; margin: 0.2in; }
  @media print { .hint { display: none; } }
</style>
</head>
<body>
  <p class="hint">Print on sticker paper or card, cut along the border, and paste inside the front cover.</p>
  <div class="sheet">${one}${one}</div>
  <script>window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 300); });</script>
</body>
</html>`;
}

/** Open the plate in a new tab, ready to print. Web only. */
export function printBookplate(plate: Bookplate): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const html = bookplateHtml(plate);
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const opened = window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return opened !== null;
}
