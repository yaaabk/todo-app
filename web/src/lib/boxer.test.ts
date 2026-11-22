import { describe, expect, it } from 'vitest';
import { normaliseBoxerReply } from './boxer';

describe('normaliseBoxerReply', () => {
  it('keeps every image from a reply and uses the first as the hero photo', () => {
    expect(
      normaliseBoxerReply({
        url: 'https://images.dog.ceo/breeds/boxer/one.jpg',
        images: [
          'https://images.dog.ceo/breeds/boxer/one.jpg',
          'https://images.dog.ceo/breeds/boxer/two.jpg',
          'https://images.dog.ceo/breeds/boxer/three.jpg',
        ],
      }),
    ).toEqual({
      url: 'https://images.dog.ceo/breeds/boxer/one.jpg',
      images: [
        'https://images.dog.ceo/breeds/boxer/one.jpg',
        'https://images.dog.ceo/breeds/boxer/two.jpg',
        'https://images.dog.ceo/breeds/boxer/three.jpg',
      ],
    });
  });

  it('turns a reply without images into a single-photo list from url', () => {
    expect(normaliseBoxerReply({ url: 'https://images.dog.ceo/breeds/boxer/one.jpg' })).toEqual({
      url: 'https://images.dog.ceo/breeds/boxer/one.jpg',
      images: ['https://images.dog.ceo/breeds/boxer/one.jpg'],
    });
  });

  it('falls back to the bundled photo for an empty image list and no url', () => {
    expect(normaliseBoxerReply({ images: [] })).toEqual({
      url: '/boxer-fallback.jpg',
      images: ['/boxer-fallback.jpg'],
    });
  });

  it('drops entries that are not non-empty strings', () => {
    expect(
      normaliseBoxerReply({
        url: 'https://images.dog.ceo/breeds/boxer/one.jpg',
        images: ['https://images.dog.ceo/breeds/boxer/one.jpg', '', null, 42],
      }),
    ).toEqual({
      url: 'https://images.dog.ceo/breeds/boxer/one.jpg',
      images: ['https://images.dog.ceo/breeds/boxer/one.jpg'],
    });
  });
});
