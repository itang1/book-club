import { describe, expect, it } from 'vitest';
import {
  cacheDimensions,
  getAvatarDimensions,
  getCachedDimensions,
  getCoverDimensions,
  preloadCoverImage,
  COVER_DIMENSIONS,
  AVATAR_DIMENSIONS,
} from './imageCache';

describe('imageCache', () => {
  it('returns consistent fixed dimensions for all cover variants', () => {
    expect(getCoverDimensions('card')).toEqual(COVER_DIMENSIONS.card);
    expect(getCoverDimensions('detail')).toEqual(COVER_DIMENSIONS.detail);
    expect(getCoverDimensions('mini')).toEqual(COVER_DIMENSIONS.mini);
    expect(getCoverDimensions('card').aspectRatio).toBeCloseTo(2 / 3);
  });

  it('returns consistent fixed dimensions for all avatar variants', () => {
    expect(getAvatarDimensions('small')).toEqual(AVATAR_DIMENSIONS.small);
    expect(getAvatarDimensions('medium')).toEqual(AVATAR_DIMENSIONS.medium);
    expect(getAvatarDimensions('large')).toEqual(AVATAR_DIMENSIONS.large);
  });

  it('stores and retrieves cached image dimensions', () => {
    cacheDimensions('https://example.com/cover.jpg', 300, 450);
    expect(getCachedDimensions('https://example.com/cover.jpg')).toEqual({
      width: 300,
      height: 450,
    });
    expect(getCachedDimensions('https://example.com/unknown.jpg')).toBeUndefined();
  });

  it('handles preload gracefully in node/test environment', () => {
    expect(() => preloadCoverImage('https://example.com/test.jpg')).not.toThrow();
  });
});
