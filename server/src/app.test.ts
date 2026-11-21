import { describe, expect, test } from 'bun:test';
import { app } from './app';

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

  test('lists an empty todo list at first', async () => {
    const response = await app.request('/api/todos');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ todos: [] });
  });

  test('adds a todo and returns it with a UUID and createdAt', async () => {
    const response = await app.request('/api/todos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: '  write the plan  ' }),
    });

    expect(response.status).toBe(201);
    const body = (await response.json()) as {
      todo: { id: string; text: string; createdAt: number };
    };
    expect(body.todo.text).toBe('write the plan');
    expect(body.todo.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(Number.isFinite(body.todo.createdAt)).toBe(true);

    const list = await app.request('/api/todos');
    expect(((await list.json()) as { todos: unknown[] }).todos).toContainEqual(body.todo);
  });

  test('rejects blank todo text', async () => {
    const response = await app.request('/api/todos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: '   ' }),
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: unknown };
    expect(typeof body.error).toBe('string');
  });

  test('rejects todo text longer than 200 characters', async () => {
    const response = await app.request('/api/todos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'x'.repeat(201) }),
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: unknown };
    expect(typeof body.error).toBe('string');
  });
});
