/**
 * The todo-app in-memory store.
 *
 * Todos live in a module-level array for the life of the process. The store
 * owns id creation, field validation and the "not found" result so the routes
 * in `app.ts` stay thin.
 */

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string | null;
  createdAt: string;
}

/** The result of a store call: a value, or the message to answer with. */
export type TodoResult<T> = { ok: true; value: T } | { ok: false; error: string };

/** What `createTodo` accepts; both fields are optional in the raw input. */
export interface CreateTodoInput {
  title?: unknown;
  dueDate?: unknown;
}

/** What `updateTodo` accepts; every field is optional. */
export interface TodoPatch {
  title?: unknown;
  completed?: unknown;
  dueDate?: unknown;
}

/** The longest a title may be. */
const MAX_TITLE_LENGTH = 200;

/** The error message the store returns for an unknown id. */
export const TODO_NOT_FOUND = 'Todo not found';

const todos: Todo[] = [];
let nextId = 1;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** True for a string that is a real calendar date in `YYYY-MM-DD` form. */
function isDueDate(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** Validates a title, returning the trimmed title or an error message. */
function parseTitle(value: unknown): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof value !== 'string' || value.trim() === '') {
    return { ok: false, error: 'Title is required' };
  }
  const title = value.trim();
  if (title.length > MAX_TITLE_LENGTH) {
    return { ok: false, error: `Title must be ${MAX_TITLE_LENGTH} characters or fewer` };
  }
  return { ok: true, value: title };
}

/** Validates a due date, mapping `undefined` and `null` to `null`. */
function parseDueDate(
  value: unknown,
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (value === undefined || value === null) return { ok: true, value: null };
  if (!isDueDate(value)) {
    return { ok: false, error: 'dueDate must be a real date in YYYY-MM-DD form' };
  }
  return { ok: true, value };
}

/** Returns every todo, in the order it was created. */
export function listTodos(): Todo[] {
  return [...todos];
}

/** Validates `input` and appends the new todo. */
export function createTodo(input: CreateTodoInput): TodoResult<Todo> {
  const title = parseTitle(input?.title);
  if (!title.ok) return title;

  const dueDate = parseDueDate(input?.dueDate);
  if (!dueDate.ok) return dueDate;

  const todo: Todo = {
    id: String(nextId++),
    title: title.value,
    completed: false,
    dueDate: dueDate.value,
    createdAt: new Date().toISOString(),
  };
  todos.push(todo);
  return { ok: true, value: todo };
}

/** Validates `patch` and applies it to the todo with `id`. */
export function updateTodo(id: string, patch: TodoPatch): TodoResult<Todo> {
  const todo = todos.find((candidate) => candidate.id === id);
  if (todo === undefined) return { ok: false, error: TODO_NOT_FOUND };

  if (patch?.title !== undefined) {
    const title = parseTitle(patch.title);
    if (!title.ok) return title;
    todo.title = title.value;
  }

  if (patch?.completed !== undefined) {
    if (typeof patch.completed !== 'boolean') {
      return { ok: false, error: 'completed must be a boolean' };
    }
    todo.completed = patch.completed;
  }

  if (patch?.dueDate !== undefined) {
    const dueDate = parseDueDate(patch.dueDate);
    if (!dueDate.ok) return dueDate;
    todo.dueDate = dueDate.value;
  }

  return { ok: true, value: todo };
}

/** Removes the todo with `id`, or reports that it was not found. */
export function deleteTodo(id: string): TodoResult<Todo> {
  const index = todos.findIndex((candidate) => candidate.id === id);
  if (index === -1) return { ok: false, error: TODO_NOT_FOUND };

  const [deleted] = todos.splice(index, 1);
  return { ok: true, value: deleted };
}
