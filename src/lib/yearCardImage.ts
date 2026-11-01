import { palettes } from '../theme';
import type { YearCard } from './yearCard';

/**
 * The year in review as one picture, sized for stories (1080 × 1920) and
 * fine in a group chat. Drawn on a canvas, so it's web only; the app is a
 * web app first.
 */

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1920;

const SERIF = '"Libre Caslon Text", Georgia, "Times New Roman", serif';
const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/** Break text into lines no wider than maxWidth, ending in … past maxLines. */
function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !line) {
      line = next;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) {
    lines.push(line);
  }
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    while (last && ctx.measureText(`${last}…`).width > maxWidth) {
      last = last.slice(0, -1);
    }
    kept[maxLines - 1] = `${last.trimEnd()}…`;
    return kept;
  }
  return lines;
}

function rule(ctx: CanvasRenderingContext2D, y: number, x0 = 96, x1 = CARD_WIDTH - 96) {
  ctx.strokeStyle = palettes.light.brass;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.stroke();
}

export function drawYearCard(ctx: CanvasRenderingContext2D, card: YearCard) {
  const W = CARD_WIDTH;
  const left = 96;
  const inner = W - left * 2;

  ctx.fillStyle = palettes.light.letterhead;
  ctx.fillRect(0, 0, W, CARD_HEIGHT);
  // A brass frame, like the letterhead's rule.
  ctx.strokeStyle = palettes.light.brass;
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, W - 80, CARD_HEIGHT - 80);

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'center';
  ctx.fillStyle = palettes.light.brass;
  ctx.font = `400 34px ${SERIF}`;
  ctx.letterSpacing = '8px';
  ctx.fillText('THE TRAVELING BOOKS', W / 2, 190);
  ctx.letterSpacing = '0px';

  ctx.fillStyle = palettes.light.onMasthead;
  ctx.font = `400 200px ${SERIF}`;
  ctx.fillText(String(card.year), W / 2, 420);
  ctx.font = `italic 400 64px ${SERIF}`;
  ctx.fillText('in books', W / 2, 510);
  rule(ctx, 580, W / 2 - 120, W / 2 + 120);

  // The four figures, two by two.
  const cellW = inner / 2;
  card.figures.forEach((figure, index) => {
    const x = left + cellW * (index % 2) + cellW / 2;
    const y = 760 + Math.floor(index / 2) * 230;
    ctx.fillStyle = palettes.light.onMasthead;
    ctx.font = `700 120px ${SERIF}`;
    ctx.fillText(String(figure.value), x, y);
    ctx.fillStyle = palettes.light.brass;
    ctx.font = `400 32px ${SERIF}`;
    ctx.letterSpacing = '6px';
    ctx.fillText(figure.label.toUpperCase(), x, y + 56);
    ctx.letterSpacing = '0px';
  });

  let y = 1110;
  ctx.textAlign = 'left';
  for (const highlight of card.highlights) {
    rule(ctx, y);
    y += 56;
    ctx.fillStyle = palettes.light.brass;
    ctx.font = `400 30px ${SERIF}`;
    ctx.letterSpacing = '6px';
    ctx.fillText(highlight.kicker.toUpperCase(), left, y);
    ctx.letterSpacing = '0px';
    ctx.fillStyle = palettes.light.onMasthead;
    ctx.font = `italic 400 58px ${SERIF}`;
    for (const line of wrap(ctx, highlight.title, inner, 2)) {
      y += 66;
      ctx.fillText(line, left, y);
    }
    ctx.font = `400 34px ${SANS}`;
    ctx.fillStyle = palettes.light.onMasthead;
    y += 50;
    ctx.fillText(highlight.detail, left, y);
    y += 40;
  }

  if (card.places.length > 0 && y < 1600) {
    rule(ctx, y);
    y += 56;
    ctx.fillStyle = palettes.light.brass;
    ctx.font = `400 30px ${SERIF}`;
    ctx.letterSpacing = '6px';
    ctx.fillText('READ IN', left, y);
    ctx.letterSpacing = '0px';
    ctx.fillStyle = palettes.light.onMasthead;
    ctx.font = `400 38px ${SANS}`;
    const text =
      card.places.join(' · ') + (card.morePlaces > 0 ? ` and ${card.morePlaces} more` : '');
    // One line when both highlights are there, two when there's room.
    for (const line of wrap(ctx, text, inner, y < 1450 ? 2 : 1)) {
      y += 50;
      ctx.fillText(line, left, y);
    }
  }

  ctx.textAlign = 'center';
  if (card.mine) {
    ctx.fillStyle = palettes.light.onMasthead;
    ctx.font = `italic 400 44px ${SERIF}`;
    ctx.fillText(card.mine, W / 2, 1735);
  }
  ctx.fillStyle = palettes.light.brass;
  ctx.font = `400 30px ${SERIF}`;
  ctx.fillText('Read it. Write in it. Pass it on.', W / 2, 1810);
}

export type ShareResult = 'shared' | 'downloaded' | 'cancelled' | 'unsupported';

/**
 * Draw the card and hand it to the phone's share sheet, or download it where
 * there's no share sheet for files (most desktop browsers).
 */
export async function shareYearCard(card: YearCard): Promise<ShareResult> {
  if (typeof document === 'undefined') {
    return 'unsupported';
  }

  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return 'unsupported';
  }

  // The canvas only uses a webfont once it's loaded.
  await Promise.all(
    ['400 40px', 'italic 400 40px', '700 40px'].map((font) =>
      document.fonts.load(`${font} "Libre Caslon Text"`).catch(() => []),
    ),
  );
  drawYearCard(ctx, card);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) {
    return 'unsupported';
  }
  const name = `traveling-books-${card.year}.png`;
  const file = new File([blob], name, { type: 'image/png' });

  if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `${card.year} in books` });
      return 'shared';
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') {
        return 'cancelled';
      }
      // Fall through to a download if sharing itself failed.
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'downloaded';
}
