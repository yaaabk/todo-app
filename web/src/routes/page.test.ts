import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, expect, it, vi } from 'vitest';
import type { Todo } from '#lib/todos';
import Page from './+page.svelte';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** Stubs `fetch` with a handler that receives the request URL and init. */
function stubFetch(handler: (url: string, init?: RequestInit) => Response) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => handler(String(input), init)),
  );
}

/** Builds a JSON response. */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function todo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: '1',
    title: 'Water the plants',
    completed: false,
    dueDate: null,
    createdAt: '2026-11-21T10:00:00.000Z',
    ...overrides,
  };
}

it('shows the app title and the tasks the API returns', async () => {
  stubFetch((url) => {
    if (url === '/api/todos') return jsonResponse([todo()]);
    throw new Error(`unexpected request to ${url}`);
  });

  render(Page);

  expect(screen.getByTestId('app-title')).toHaveTextContent('todo-app');
  await waitFor(() => {
    expect(screen.getByTestId('todo-item')).toHaveTextContent('Water the plants');
  });
});

it('adds a task through the form and shows it', async () => {
  stubFetch((url, init) => {
    if (url === '/api/todos' && init?.method === 'POST') {
      const input = JSON.parse(String(init.body)) as { title: string; dueDate: string | null };
      return jsonResponse(todo({ id: '2', title: input.title, dueDate: input.dueDate }), 201);
    }
    if (url === '/api/todos') return jsonResponse([]);
    throw new Error(`unexpected request to ${url}`);
  });

  render(Page);

  await waitFor(() => {
    expect(screen.getByTestId('todo-empty')).toBeInTheDocument();
  });

  fireEvent.input(screen.getByTestId('todo-title'), { target: { value: 'Buy milk' } });
  fireEvent.input(screen.getByTestId('todo-due-date'), { target: { value: '2099-12-01' } });
  fireEvent.submit(screen.getByTestId('todo-title').closest('form') as HTMLFormElement);

  await waitFor(() => {
    expect(screen.getByTestId('todo-item')).toHaveTextContent('Buy milk');
  });
  expect(screen.getByTestId('todo-item')).toHaveTextContent('1 Dec');
  expect(screen.getByTestId('todo-title')).toHaveValue('');
});

it('shows the Overdue label for a past due date that is not complete', async () => {
  stubFetch((url) => {
    if (url === '/api/todos') {
      return jsonResponse([todo({ id: '9', title: 'Pay the bill', dueDate: '2020-01-02' })]);
    }
    throw new Error(`unexpected request to ${url}`);
  });

  render(Page);

  await waitFor(() => {
    expect(screen.getByTestId('todo-item')).toHaveTextContent('Overdue');
  });
  expect(screen.getByTestId('todo-item')).toHaveTextContent('Pay the bill');
});

it('shows the date, not Overdue, for a completed task with a past due date', async () => {
  stubFetch((url) => {
    if (url === '/api/todos') {
      return jsonResponse([
        todo({ id: '10', title: 'Paid the bill', completed: true, dueDate: '2020-01-02' }),
      ]);
    }
    throw new Error(`unexpected request to ${url}`);
  });

  render(Page);

  await waitFor(() => {
    expect(screen.getByTestId('todo-due-label')).toHaveTextContent('2 Jan');
  });
  expect(screen.getByTestId('todo-item')).not.toHaveTextContent('Overdue');
});

it('shows the error the API returns for an invalid task', async () => {
  stubFetch((url, init) => {
    if (url === '/api/todos' && init?.method === 'POST') {
      return jsonResponse({ error: 'Title is required' }, 400);
    }
    if (url === '/api/todos') return jsonResponse([]);
    throw new Error(`unexpected request to ${url}`);
  });

  render(Page);

  await waitFor(() => {
    expect(screen.getByTestId('todo-empty')).toBeInTheDocument();
  });

  fireEvent.input(screen.getByTestId('todo-title'), { target: { value: '   ' } });
  fireEvent.submit(screen.getByTestId('todo-title').closest('form') as HTMLFormElement);

  await waitFor(() => {
    expect(screen.getByTestId('todo-error')).toHaveTextContent('Title is required');
  });
});
