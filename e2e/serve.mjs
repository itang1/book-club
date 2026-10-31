// A small static server for the exported app, with the same fallback GitHub
// Pages gives it (unknown paths serve index.html), for the end-to-end tests.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const [root = 'e2e-dist', port = '4173'] = process.argv.slice(2);
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
};

createServer(async (request, response) => {
  const path = normalize(decodeURIComponent(new URL(request.url, 'http://x').pathname));
  const file = join(root, path.endsWith('/') ? `${path}index.html` : path);
  try {
    const body = await readFile(file);
    response.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(200, { 'content-type': 'text/html' });
    response.end(await readFile(join(root, 'index.html')));
  }
}).listen(Number(port), () => console.log(`Serving ${root} on http://localhost:${port}`));
