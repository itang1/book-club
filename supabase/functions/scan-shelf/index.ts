// Reads a photo of a bookshelf and returns the books it can make out.
//
// Runs on Supabase (Deno), called by the app with the signed-in user's token
// (Supabase checks it before this code runs), so only members can spend the
// API quota. The key never reaches the browser.
//
// Secrets, set once with `supabase secrets set` (the deploy workflow does it
// from GitHub secrets):
//   GEMINI_API_KEY, and optionally GEMINI_MODEL (default gemini-2.5-flash)
//
// The model only suggests: the app shows every guess for the person to tick,
// fix or drop before anything is saved.

const KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash';
// Base64 of a photo the app has already shrunk; this just stops abuse.
const MAX_IMAGE_CHARS = 6_000_000;
const MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const PROMPT = `This is a photo of a bookshelf. List every book whose spine or cover you can read.
For each, give the title and the author (if the author isn't visible but you are confident who wrote it, give the author; otherwise leave it empty).
Do not invent books you cannot read. Do not repeat a book. Keep titles as printed, in title case.`;

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  if (!KEY) return reply({ error: 'Shelf scanning isn\'t set up yet.' }, 503);

  let image: string;
  let mimeType: string;
  try {
    ({ image, mimeType } = await request.json());
  } catch {
    return reply({ error: 'Send a JSON body with image and mimeType.' }, 400);
  }
  if (typeof image !== 'string' || !image || image.length > MAX_IMAGE_CHARS) {
    return reply({ error: 'That photo is missing or too large.' }, 400);
  }
  if (!MIME_TYPES.includes(mimeType)) {
    return reply({ error: 'Use a JPEG, PNG or WebP photo.' }, 400);
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: mimeType, data: image } }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              books: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: { title: { type: 'STRING' }, author: { type: 'STRING' } },
                  required: ['title'],
                },
              },
            },
            required: ['books'],
          },
          temperature: 0,
        },
      }),
    },
  );

  if (!response.ok) {
    console.error('Gemini failed', response.status, (await response.text()).slice(0, 300));
    return reply({ error: 'The scanner is busy. Try again in a minute.' }, 502);
  }

  try {
    const result = await response.json();
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{"books":[]}';
    const seen = new Set<string>();
    const books = (JSON.parse(text).books ?? [])
      .map((book: { title?: string; author?: string }) => ({
        title: String(book.title ?? '').trim().slice(0, 200),
        author: String(book.author ?? '').trim().slice(0, 200),
      }))
      .filter((book: { title: string }) => {
        const key = book.title.toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 60);
    return reply({ books });
  } catch {
    return reply({ error: 'Couldn\'t read the scanner\'s answer. Try another photo.' }, 502);
  }
});
