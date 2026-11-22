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
    if (url === '/api/boxer')
      return jsonResponse({ url: 'https://images.dog.ceo/breeds/boxer/one.jpg' });
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
    if (url === '/api/boxer')
      return jsonResponse({ url: 'https://images.dog.ceo/breeds/boxer/two.jpg' });
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
    if (url === '/api/boxer')
      return jsonResponse({ url: 'https://images.dog.ceo/breeds/boxer/three.jpg' });
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

it('marks a task done when the done button is clicked', async () => {
  stubFetch((url, init) => {
    if (url === '/api/todos/1' && init?.method === 'PATCH') {
      const input = JSON.parse(String(init.body)) as { completed: boolean };
      return jsonResponse(todo({ completed: input.completed }));
    }
    if (url === '/api/todos') return jsonResponse([todo()]);
    if (url === '/api/boxer')
      return jsonResponse({ url: 'https://images.dog.ceo/breeds/boxer/done.jpg' });
    throw new Error(`unexpected request to ${url}`);
  });

  render(Page);

  await waitFor(() => {
    expect(screen.getByTestId('todo-item')).toHaveTextContent('Water the plants');
  });

  fireEvent.click(screen.getByTestId('todo-done'));

  await waitFor(() => {
    expect(screen.getByTestId('todo-item')).toHaveTextContent('Undo');
  });
  expect(screen.getByTestId('todo-item')).toHaveTextContent('Water the plants');
  expect(screen.getByTestId('todo-title-text').className).toContain('line-through');
});

it('shows the boxer photo the API returns', async () => {
  stubFetch((url) => {
    if (url === '/api/todos') return jsonResponse([]);
    if (url === '/api/boxer') {
      return jsonResponse({ url: 'https://images.dog.ceo/breeds/boxer/photo.jpg' });
    }
    throw new Error(`unexpected request to ${url}`);
  });

  render(Page);

  await waitFor(() => {
    expect(screen.getByTestId('boxer-photo')).toHaveAttribute(
      'src',
      'https://images.dog.ceo/breeds/boxer/photo.jpg',
    );
  });
});

it('shows the remaining boxer photos as a pack under the hero photo', async () => {
  stubFetch((url) => {
    if (url === '/api/todos') return jsonResponse([]);
    if (url === '/api/boxer') {
      return jsonResponse({
        url: 'https://images.dog.ceo/breeds/boxer/hero.jpg',
        images: [
          'https://images.dog.ceo/breeds/boxer/hero.jpg',
          'https://images.dog.ceo/breeds/boxer/pack-one.jpg',
          'https://images.dog.ceo/breeds/boxer/pack-two.jpg',
        ],
      });
    }
    throw new Error(`unexpected request to ${url}`);
  });

  render(Page);

  await waitFor(() => {
    expect(screen.getByTestId('boxer-photo')).toHaveAttribute(
      'src',
      'https://images.dog.ceo/breeds/boxer/hero.jpg',
    );
  });

  expect(screen.getByTestId('boxer-pack')).toBeInTheDocument();
  const packItems = screen.getAllByTestId('boxer-pack-item');
  expect(packItems).toHaveLength(2);
  expect(packItems[0]?.querySelector('img')).toHaveAttribute(
    'src',
    'https://images.dog.ceo/breeds/boxer/pack-one.jpg',
  );
  expect(packItems[1]?.querySelector('img')).toHaveAttribute(
    'src',
    'https://images.dog.ceo/breeds/boxer/pack-two.jpg',
  );
});

it('hides the boxer pack when the reply has no extra photo', async () => {
  stubFetch((url) => {
    if (url === '/api/todos') return jsonResponse([]);
    if (url === '/api/boxer') {
      return jsonResponse({ url: 'https://images.dog.ceo/breeds/boxer/only.jpg' });
    }
    throw new Error(`unexpected request to ${url}`);
  });

  render(Page);

  await waitFor(() => {
    expect(screen.getByTestId('boxer-photo')).toHaveAttribute(
      'src',
      'https://images.dog.ceo/breeds/boxer/only.jpg',
    );
  });

  expect(screen.queryByTestId('boxer-pack')).not.toBeInTheDocument();
});

it('shows the boxer background with the paw pattern and faded background photos', async () => {
  stubFetch((url) => {
    if (url === '/api/todos') return jsonResponse([]);
    if (url === '/api/boxer') {
      return jsonResponse({
        url: 'https://images.dog.ceo/breeds/boxer/hero.jpg',
        images: [
          'https://images.dog.ceo/breeds/boxer/hero.jpg',
          'https://images.dog.ceo/breeds/boxer/bg-one.jpg',
          'https://images.dog.ceo/breeds/boxer/bg-two.jpg',
        ],
      });
    }
    throw new Error(`unexpected request to ${url}`);
  });

  render(Page);

  expect(screen.getByTestId('boxer-background')).toHaveAttribute('aria-hidden', 'true');

  await waitFor(() => {
    const bgPhotos = screen.getAllByTestId('boxer-background-photo');
    expect(bgPhotos).toHaveLength(2);
    expect(bgPhotos[0]).toHaveAttribute('src', 'https://images.dog.ceo/breeds/boxer/hero.jpg');
    expect(bgPhotos[0]).toHaveAttribute('alt', '');
    expect(bgPhotos[1]).toHaveAttribute('src', 'https://images.dog.ceo/breeds/boxer/bg-one.jpg');
    expect(bgPhotos[1]).toHaveAttribute('alt', '');
  });
});

it('shows a single faded photo in the boxer background when only one photo is returned', async () => {
  stubFetch((url) => {
    if (url === '/api/todos') return jsonResponse([]);
    if (url === '/api/boxer') {
      return jsonResponse({ url: 'https://images.dog.ceo/breeds/boxer/solo.jpg' });
    }
    throw new Error(`unexpected request to ${url}`);
  });

  render(Page);

  expect(screen.getByTestId('boxer-background')).toHaveAttribute('aria-hidden', 'true');

  await waitFor(() => {
    expect(screen.getByTestId('boxer-photo')).toHaveAttribute(
      'src',
      'https://images.dog.ceo/breeds/boxer/solo.jpg',
    );
  });

  const bgPhotos = screen.getAllByTestId('boxer-background-photo');
  expect(bgPhotos.length).toBeGreaterThanOrEqual(1);
  expect(bgPhotos.length).toBeLessThanOrEqual(2);
  expect(bgPhotos[0]).toHaveAttribute('src', 'https://images.dog.ceo/breeds/boxer/solo.jpg');
  expect(bgPhotos[0]).toHaveAttribute('alt', '');
});

it('applies the boxer-hero class to the hero photo and the sway class to the background photos', async () => {
  stubFetch((url) => {
    if (url === '/api/todos') return jsonResponse([]);
    if (url === '/api/boxer') {
      return jsonResponse({
        url: 'https://images.dog.ceo/breeds/boxer/hero.jpg',
        images: [
          'https://images.dog.ceo/breeds/boxer/hero.jpg',
          'https://images.dog.ceo/breeds/boxer/bg-one.jpg',
          'https://images.dog.ceo/breeds/boxer/bg-two.jpg',
        ],
      });
    }
    throw new Error(`unexpected request to ${url}`);
  });

  render(Page);

  await waitFor(() => {
    expect(screen.getByTestId('boxer-photo')).toHaveAttribute(
      'src',
      'https://images.dog.ceo/breeds/boxer/hero.jpg',
    );
  });

  expect(screen.getByTestId('boxer-photo')).toHaveClass('boxer-hero');

  const bgPhotos = screen.getAllByTestId('boxer-background-photo');
  expect(bgPhotos.length).toBeGreaterThanOrEqual(1);
  for (const bgPhoto of bgPhotos) {
    expect(bgPhoto).toHaveClass('boxer-sway');
    expect(bgPhoto.className).toContain('sway');
  }
});

it('puts a boxer icon beside each button label', async () => {
  stubFetch((url) => {
    if (url === '/api/todos') return jsonResponse([todo()]);
    if (url === '/api/boxer')
      return jsonResponse({ url: 'https://images.dog.ceo/breeds/boxer/icons.jpg' });
    throw new Error(`unexpected request to ${url}`);
  });

  render(Page);

  await waitFor(() => {
    expect(screen.getByTestId('todo-item')).toHaveTextContent('Water the plants');
  });

  expect(screen.getAllByTestId('boxer-icon').length).toBeGreaterThanOrEqual(3);
  expect(screen.getByTestId('todo-submit')).toHaveTextContent('Add task');
  expect(screen.getByTestId('todo-done')).toHaveTextContent('Done');
  expect(screen.getByTestId('todo-remove')).toHaveTextContent('Remove');
});
