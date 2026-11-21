/** The shared todo shape returned by the API. */
export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  /** A `YYYY-MM-DD` date, or `null` when the task has no due date. */
  dueDate: string | null;
  createdAt: string;
}

/** The fields `POST /api/todos` accepts. */
export interface CreateTodoInput {
  title: string;
  dueDate?: string | null;
}

/** The fields `PATCH /api/todos/:id` accepts. */
export interface UpdateTodoInput {
  title?: string;
  completed?: boolean;
  dueDate?: string | null;
}

/** Reads an error message out of a failed API response. */
async function errorFrom(response: Response): Promise<Error> {
  const body = (await response.json().catch(() => null)) as { error?: unknown } | null;
  const message =
    typeof body?.error === 'string' ? body.error : `Request failed with HTTP ${response.status}`;
  return new Error(message);
}

/** Returns every todo the API knows about. */
export async function listTodos(): Promise<Todo[]> {
  const response = await fetch('/api/todos');
  if (!response.ok) throw await errorFrom(response);
  return (await response.json()) as Todo[];
}

/** Creates a todo and returns it. */
export async function createTodo(input: CreateTodoInput): Promise<Todo> {
  const response = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw await errorFrom(response);
  return (await response.json()) as Todo;
}

/** Updates a todo and returns it. */
export async function updateTodo(id: string, input: UpdateTodoInput): Promise<Todo> {
  const response = await fetch(`/api/todos/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw await errorFrom(response);
  return (await response.json()) as Todo;
}

/** Deletes a todo. */
export async function deleteTodo(id: string): Promise<void> {
  const response = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
  if (!response.ok) throw await errorFrom(response);
}
