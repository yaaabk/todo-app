import { afterEach, describe, expect, test } from 'bun:test';
import { app } from './app';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('todo-app API', () => {
  test('reports health', async () => {
    const response = await app.request('/health');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  test('greets the project by name', async () => {
    const response = await app.request('/api/hello');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: 'Hello from todo-app' });
  });

  test('creates a todo, lists it and reads it back', async () => {
    const created = await app.request('/api/todos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Write the plan', dueDate: '2026-12-01' }),
    });

    expect(created.status).toBe(201);
    const todo = (await created.json()) as {
      id: string;
      title: string;
      completed: boolean;
      dueDate: string | null;
      createdAt: string;
    };
    expect(todo.id).toBeTruthy();
    expect(todo.title).toBe('Write the plan');
    expect(todo.completed).toBe(false);
    expect(todo.dueDate).toBe('2026-12-01');
    expect(todo.createdAt).toBeTruthy();

    const listed = await app.request('/api/todos');

    expect(listed.status).toBe(200);
    const todos = (await listed.json()) as (typeof todo)[];
    expect(todos.find((candidate) => candidate.id === todo.id)).toEqual(todo);
  });

  test('creates a todo without a due date', async () => {
    const response = await app.request('/api/todos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'No date needed' }),
    });

    expect(response.status).toBe(201);
    expect(((await response.json()) as { dueDate: string | null }).dueDate).toBeNull();
  });

  test('rejects an empty title', async () => {
    const response = await app.request('/api/todos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '   ' }),
    });

    expect(response.status).toBe(400);
    expect(typeof ((await response.json()) as { error: string }).error).toBe('string');
  });

  test('rejects a title longer than 200 characters', async () => {
    const response = await app.request('/api/todos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'x'.repeat(201) }),
    });

    expect(response.status).toBe(400);
    expect(typeof ((await response.json()) as { error: string }).error).toBe('string');
  });

  test('rejects a due date that is not a real YYYY-MM-DD date', async () => {
    const response = await app.request('/api/todos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Bad date', dueDate: '2026-02-30' }),
    });

    expect(response.status).toBe(400);
    expect(typeof ((await response.json()) as { error: string }).error).toBe('string');
  });

  test('updates a todo and deletes it, answering 404 for an unknown id', async () => {
    const created = await app.request('/api/todos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Ship the feature' }),
    });

    expect(created.status).toBe(201);
    const todo = (await created.json()) as { id: string };

    const patched = await app.request(`/api/todos/${todo.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ completed: true, title: 'Ship the feature, done' }),
    });

    expect(patched.status).toBe(200);
    const updated = (await patched.json()) as { id: string; title: string; completed: boolean };
    expect(updated.id).toBe(todo.id);
    expect(updated.title).toBe('Ship the feature, done');
    expect(updated.completed).toBe(true);

    const removed = await app.request(`/api/todos/${todo.id}`, { method: 'DELETE' });

    expect(removed.status).toBe(204);

    const listed = (await (await app.request('/api/todos')).json()) as { id: string }[];
    expect(listed.find((candidate) => candidate.id === todo.id)).toBeUndefined();
  });

  test('answers 404 when updating an unknown id', async () => {
    const response = await app.request('/api/todos/does-not-exist', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Todo not found' });
  });

  test('answers 404 when deleting an unknown id', async () => {
    const response = await app.request('/api/todos/does-not-exist', { method: 'DELETE' });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Todo not found' });
  });

  test('rejects a bad dueDate on create', async () => {
    const response = await app.request('/api/todos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Bad date', dueDate: '2026-02-31' }),
    });

    expect(response.status).toBe(400);
    expect(typeof ((await response.json()) as { error: string }).error).toBe('string');
  });

  test('rejects a bad dueDate on update', async () => {
    const created = await app.request('/api/todos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Keep the date' }),
    });
    const todo = (await created.json()) as { id: string; dueDate: string | null };

    const response = await app.request(`/api/todos/${todo.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ dueDate: '2026-02-31' }),
    });

    expect(response.status).toBe(400);
    expect(typeof ((await response.json()) as { error: string }).error).toBe('string');

    const listed = await app.request('/api/todos');
    const todos = (await listed.json()) as (typeof todo)[];
    expect(todos.find((candidate) => candidate.id === todo.id)?.dueDate).toBeNull();
  });

  test('answers an unknown API route with a JSON 404, not the SPA shell', async () => {
    const response = await app.request('/api/does-not-exist');

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Not found' });
  });

  test('returns the three boxer photos the dog.ceo API answers with', async () => {
    globalThis.fetch = (async (input: string) => {
      expect(input).toBe('https://dog.ceo/api/breed/boxer/images/random/3');
      return Response.json({
        status: 'success',
        message: [
          'https://images.dog.ceo/breeds/boxer/n02108089_1560.jpg',
          'https://images.dog.ceo/breeds/boxer/n02108089_1561.jpg',
          'https://images.dog.ceo/breeds/boxer/n02108089_1562.jpg',
        ],
      });
    }) as unknown as typeof fetch;

    const response = await app.request('/api/boxer');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      url: 'https://images.dog.ceo/breeds/boxer/n02108089_1560.jpg',
      images: [
        'https://images.dog.ceo/breeds/boxer/n02108089_1560.jpg',
        'https://images.dog.ceo/breeds/boxer/n02108089_1561.jpg',
        'https://images.dog.ceo/breeds/boxer/n02108089_1562.jpg',
      ],
    });
  });

  test('drops entries that are not non-empty strings from the boxer photo reply', async () => {
    globalThis.fetch = (async () =>
      Response.json({
        status: 'success',
        message: ['https://images.dog.ceo/breeds/boxer/valid.jpg', '', null],
      })) as unknown as typeof fetch;

    const response = await app.request('/api/boxer');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      url: 'https://images.dog.ceo/breeds/boxer/valid.jpg',
      images: ['https://images.dog.ceo/breeds/boxer/valid.jpg'],
    });
  });

  test('falls back to the bundled boxer photo when dog.ceo fails', async () => {
    globalThis.fetch = (async () => {
      throw new Error('dog.ceo is unreachable');
    }) as unknown as typeof fetch;

    const response = await app.request('/api/boxer');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      url: '/boxer-fallback.jpg',
      images: ['/boxer-fallback.jpg'],
    });
  });
});
