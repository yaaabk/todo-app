/** The boxer photos the page shows: a hero photo plus the images after it. */
export interface BoxerPhotos {
  url: string;
  images: string[];
}

/** The bundled photo shipped with the app, used when the API has no photo. */
export const BOXER_FALLBACK_URL = '/boxer-fallback.jpg';

/** Reads the boxer photos from a `GET /api/boxer` reply. */
export function normaliseBoxerReply(body: unknown): BoxerPhotos {
  const reply =
    body !== null && typeof body === 'object' ? (body as { url?: unknown; images?: unknown }) : {};

  const images = Array.isArray(reply.images)
    ? reply.images.filter((image): image is string => typeof image === 'string' && image !== '')
    : [];

  if (images.length > 0) {
    return { url: images[0], images };
  }

  if (typeof reply.url === 'string' && reply.url !== '') {
    return { url: reply.url, images: [reply.url] };
  }

  return { url: BOXER_FALLBACK_URL, images: [BOXER_FALLBACK_URL] };
}

/** Fetches the boxer photos from the API and normalises the reply. */
export async function loadBoxerPhotos(): Promise<BoxerPhotos> {
  const response = await fetch('/api/boxer');
  if (!response.ok) throw new Error(`Request failed with HTTP ${response.status}`);
  return normaliseBoxerReply(await response.json());
}
