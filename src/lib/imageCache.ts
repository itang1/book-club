export type CoverSizeVariant = 'card' | 'detail' | 'mini';
export type AvatarSizeVariant = 'small' | 'medium' | 'large';

export type Dimensions = {
  width: number;
  height: number;
  aspectRatio: number;
};

export const COVER_DIMENSIONS: Record<CoverSizeVariant, Dimensions> = {
  mini: { width: 44, height: 66, aspectRatio: 2 / 3 },
  card: { width: 76, height: 114, aspectRatio: 2 / 3 },
  detail: { width: 104, height: 156, aspectRatio: 2 / 3 },
};

export const AVATAR_DIMENSIONS: Record<AvatarSizeVariant, { size: number; borderRadius: number; fontSize: number }> = {
  small: { size: 28, borderRadius: 14, fontSize: 11 },
  medium: { size: 38, borderRadius: 19, fontSize: 14 },
  large: { size: 54, borderRadius: 27, fontSize: 20 },
};

const dimensionCache = new Map<string, { width: number; height: number }>();

export function getCoverDimensions(variant: CoverSizeVariant): Dimensions {
  return COVER_DIMENSIONS[variant];
}

export function getAvatarDimensions(variant: AvatarSizeVariant) {
  return AVATAR_DIMENSIONS[variant];
}

export function cacheDimensions(url: string, width: number, height: number): void {
  dimensionCache.set(url, { width, height });
}

export function getCachedDimensions(url: string): { width: number; height: number } | undefined {
  return dimensionCache.get(url);
}

/** Pre-decode image so list cards do not jitter or shift on initial paint. */
export function preloadCoverImage(url: string): void {
  if (!url || typeof url !== 'string') return;
  if (dimensionCache.has(url)) return;

  if (typeof window !== 'undefined' && typeof window.Image !== 'undefined') {
    const img = new window.Image();
    img.src = url;
    if ('decode' in img) {
      img.decode().then(() => {
        cacheDimensions(url, img.naturalWidth, img.naturalHeight);
      }).catch(() => {});
    }
  }
}
