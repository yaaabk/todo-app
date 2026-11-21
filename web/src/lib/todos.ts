/** One row of the todo list, as returned by `GET /api/todos`. */
export interface Todo {
  id: string;
  text: string;
  /** Unix time in milliseconds. */
  createdAt: number;
}

/** Reads the whole list from `GET /api/todos`. */
export async function listTodos(): Promise<Todo[]> {
  const response = await fetch('/api/todos');

  if (!response.ok) {
    throw new Error(`Could not load the todo list (HTTP ${response.status})`);
  }

  const body = (await response.json()) as { todos?: Todo[] };
  return body.todos ?? [];
}

/** Adds one todo through `POST /api/todos` and returns the created row. */
export async function createTodo(text: string): Promise<Todo> {
  const response = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Could not add the todo (HTTP ${response.status})`);
  }

  const body = (await response.json()) as { todo: Todo };
  return body.todo;
}
