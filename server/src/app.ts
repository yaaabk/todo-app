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
