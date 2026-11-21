import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';

/** Longest todo text the API accepts, counted after trimming. */
const MAX_TEXT_LENGTH = 200;

export interface Todo {
  id: string;
  text: string;
  /** Unix time in milliseconds. */
  createdAt: number;
}

/** The list lives in memory for the life of the process. */
const todos: Todo[] = [];

export function listTodos(): Todo[] {
  return todos;
}

export function addTodo(text: string): Todo {
  const todo: Todo = { id: randomUUID(), text, createdAt: Date.now() };
  todos.push(todo);
  return todo;
}

export const todosRouter = new Hono();

todosRouter.get('/', (c) => c.json({ todos: listTodos() }));

todosRouter.post('/', async (c) => {
  const body = (await c.req.json().catch(() => null)) as { text?: unknown } | null;
  const text = typeof body?.text === 'string' ? body.text.trim() : '';

  if (text === '') {
    return c.json({ error: 'Todo text is required' }, 400);
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return c.json({ error: `Todo text must be at most ${MAX_TEXT_LENGTH} characters` }, 400);
  }

  return c.json({ todo: addTodo(text) }, 201);
});
