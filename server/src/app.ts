import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/bun';
import { createTodo, listTodos, updateTodo } from './todos';

/** Absolute path to the SvelteKit build, independent of the working directory. */
const webRoot = join(import.meta.dir, '..', '..', 'web', 'build');
const indexPath = join(webRoot, 'index.html');

/**
 * The todo-app API.
 *
 * JSON endpoints live under `/api/*`; everything else is served from the
 * SvelteKit build in `web/build`.
 */
export const app = new Hono();

app.use('/api/*', cors());

app.get('/health', (c) => c.json({ status: 'ok' }));

app.get('/api/hello', (c) => c.json({ message: 'Hello from todo-app' }));

app.get('/api/todos', (c) => c.json(listTodos()));

app.post('/api/todos', async (c) => {
  const input = await c.req.json().catch(() => null);
  const result = createTodo(input ?? {});
  if (!result.ok) {
    return c.json({ error: result.error }, 400);
  }
  return c.json(result.value, 201);
});

/** The bundled dog photo shipped with the app, used when `dog.ceo` is unreachable. */
const BOXER_FALLBACK_URL = '/boxer-fallback.jpg';

/** The longest the `dog.ceo` call may take before falling back. */
const DOG_CEO_TIMEOUT_MS = 2_000;

/** The `dog.ceo` random-photo response, or the fallback when it cannot answer. */
app.get('/api/boxer', async (c) => {
  try {
    const response = await fetch('https://dog.ceo/api/breed/boxer/images/random', {
      signal: AbortSignal.timeout(DOG_CEO_TIMEOUT_MS),
    });
    if (response.ok) {
      const body = (await response.json()) as { status?: unknown; message?: unknown };
      if (body.status === 'success' && typeof body.message === 'string' && body.message !== '') {
        return c.json({ url: body.message });
      }
    }
  } catch {
    // Fall through to the bundled photo.
  }
  return c.json({ url: BOXER_FALLBACK_URL });
});

app.patch('/api/todos/:id', async (c) => {
  const input = await c.req.json().catch(() => null);
  const result = updateTodo(c.req.param('id'), input ?? {});
  if (!result.ok) {
    if (result.error === 'Todo not found') {
      return c.json({ error: result.error }, 404);
    }
    return c.json({ error: result.error }, 400);
  }
  return c.json(result.value, 200);
});

// Serve the built SvelteKit single-page app, falling back to `index.html` so
// client-side routes resolve. Unknown API routes must stay JSON 404s: without
// the guard, the fallback would answer them with `index.html` and a 200.
app.use('*', serveStatic({ root: webRoot }));
app.get('*', async (c) => {
  const path = c.req.path;
  if (path === '/api' || path.startsWith('/api/')) {
    return c.json({ error: 'Not found' }, 404);
  }
  return c.html(await readFile(indexPath, 'utf8'));
});
