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

  test('answers an unknown API route with a JSON 404, not the SPA shell', async () => {
    const response = await app.request('/api/does-not-exist');

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Not found' });
  });

  test('returns the boxer photo the dog.ceo API answers with', async () => {
    globalThis.fetch = (async (input: string) => {
      expect(input).toBe('https://dog.ceo/api/breed/boxer/images/random');
      return Response.json({
        status: 'success',
        message: 'https://images.dog.ceo/breeds/boxer/n02108089_1560.jpg',
      });
    }) as unknown as typeof fetch;

    const response = await app.request('/api/boxer');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      url: 'https://images.dog.ceo/breeds/boxer/n02108089_1560.jpg',
    });
  });

  test('falls back to the bundled boxer photo when dog.ceo fails', async () => {
    globalThis.fetch = (async () => {
      throw new Error('dog.ceo is unreachable');
    }) as unknown as typeof fetch;

    const response = await app.request('/api/boxer');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ url: '/boxer-fallback.jpg' });
  });
});
