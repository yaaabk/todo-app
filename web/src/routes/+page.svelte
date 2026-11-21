<script lang="ts">
  import { onMount } from 'svelte';
  import TodoForm from '../lib/TodoForm.svelte';
  import { createTodo, listTodos, type Todo } from '../lib/todos';

  type Status = 'loading' | 'ready' | 'error';

  let todos = $state<Todo[]>([]);
  let status = $state<Status>('loading');
  let errorMessage = $state('');

  function messageFrom(error: unknown): string {
    if (error instanceof Error && error.message !== '') return error.message;
    return 'Something went wrong. Please try again.';
  }

  async function loadTodos() {
    status = 'loading';
    errorMessage = '';
    try {
      todos = await listTodos();
      status = 'ready';
    } catch (error) {
      errorMessage = messageFrom(error);
      status = 'error';
    }
  }

  async function handleAdd(text: string): Promise<boolean> {
    try {
      const todo = await createTodo(text);
      todos = [...todos, todo];
      return true;
    } catch (error) {
      errorMessage = messageFrom(error);
      return false;
    }
  }

  onMount(loadTodos);
</script>

<div class="min-h-dvh bg-white text-ink">
  <header class="bg-base-lightest">
    <div class="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2 sm:px-6">
      <span aria-hidden="true" class="text-lg leading-none">🇺🇸</span>
      <p class="text-sm font-semibold">An official website of the United States government</p>
    </div>
  </header>

  <main class="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
    <h1 data-testid="app-title" class="text-3xl font-bold tracking-tight sm:text-4xl">Todo list</h1>
    <p class="mt-2 text-base text-ink">
      Keep track of the tasks you need to finish. The list is shared while the app is running.
    </p>

    {#if status === 'loading'}
      <p
        data-testid="todos-loading"
        role="status"
        class="mt-6 rounded-sm border border-base-light bg-base-lightest px-4 py-3 text-base"
      >
        Loading your todos…
      </p>
    {:else if status === 'error'}
      <div
        data-testid="todos-error"
        role="alert"
        class="mt-6 rounded-sm border-l-4 border-error bg-base-lightest px-4 py-3"
      >
        <p class="text-base font-semibold text-error">We could not load your todos.</p>
        <p class="mt-1 text-base text-ink">{errorMessage}</p>
        <button
          type="button"
          class="mt-3 rounded-sm border border-primary px-4 py-2 text-base font-semibold text-primary hover:bg-white"
          onclick={loadTodos}
        >
          Try again
        </button>
      </div>
    {:else}
      <section aria-label="Add a todo" class="mt-8">
        <TodoForm onAdd={handleAdd} />
      </section>

      {#if errorMessage !== ''}
        <p
          data-testid="todos-add-error"
          role="alert"
          class="mt-3 text-base font-semibold text-error"
        >
          {errorMessage}
        </p>
      {/if}

      <section aria-label="Todos" class="mt-6">
        {#if todos.length === 0}
          <p
            data-testid="todos-empty"
            class="rounded-sm border border-base-light bg-base-lightest px-4 py-3 text-base"
          >
            No tasks yet. Add one above to get started.
          </p>
        {:else}
          <ul
            data-testid="todos-list"
            class="divide-y divide-base-light overflow-hidden rounded-sm border border-base-light"
          >
            {#each todos as todo (todo.id)}
              <li class="bg-white px-4 py-3 text-base">{todo.text}</li>
            {/each}
          </ul>
        {/if}
      </section>
    {/if}
  </main>
</div>
