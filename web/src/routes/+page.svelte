<script lang="ts">
  import { onMount } from 'svelte';
  import { createTodo, deleteTodo, listTodos, updateTodo, type Todo } from '#lib/todos';

  let todos = $state<Todo[]>([]);
  let title = $state('');
  let dueDate = $state('');
  let error = $state('');
  let loading = $state(true);
  let saving = $state(false);

  onMount(async () => {
    try {
      todos = await listTodos();
    } catch {
      error = 'Could not load the tasks.';
    } finally {
      loading = false;
    }
  });

  async function addTodo(event: SubmitEvent) {
    event.preventDefault();
    if (saving) return;

    error = '';
    saving = true;
    try {
      const todo = await createTodo({ title, dueDate: dueDate === '' ? null : dueDate });
      todos = [...todos, todo];
      title = '';
      dueDate = '';
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Could not add the task.';
    } finally {
      saving = false;
    }
  }

  async function toggleTodo(todo: Todo) {
    error = '';
    const updated = await updateTodo(todo.id, { completed: !todo.completed }).catch(
      (cause: unknown) => {
        error = cause instanceof Error ? cause.message : 'Could not update the task.';
        return null;
      },
    );
    if (updated === null) return;
    todos = todos.map((candidate) => (candidate.id === updated.id ? updated : candidate));
  }

  async function removeTodo(todo: Todo) {
    error = '';
    try {
      await deleteTodo(todo.id);
      todos = todos.filter((candidate) => candidate.id !== todo.id);
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Could not remove the task.';
    }
  }
</script>

<main class="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 p-8">
  <h1 data-testid="app-title" class="text-4xl font-bold tracking-tight">todo-app</h1>

  <form class="flex flex-col gap-3 sm:flex-row sm:items-end" onsubmit={addTodo}>
    <label class="flex flex-1 flex-col gap-1 text-sm font-medium">
      Task
      <input
        class="rounded border border-neutral-300 px-3 py-2 text-base font-normal"
        data-testid="todo-title"
        bind:value={title}
        placeholder="What needs doing?"
        maxlength={200}
        required
      />
    </label>
    <label class="flex flex-col gap-1 text-sm font-medium">
      Due date
      <input
        class="rounded border border-neutral-300 px-3 py-2 text-base font-normal"
        data-testid="todo-due-date"
        type="date"
        bind:value={dueDate}
      />
    </label>
    <button
      class="rounded bg-neutral-900 px-4 py-2 font-medium text-white disabled:opacity-50"
      data-testid="todo-submit"
      type="submit"
      disabled={saving}
    >
      Add task
    </button>
  </form>

  {#if error}
    <p class="text-sm text-red-600" data-testid="todo-error" role="alert">{error}</p>
  {/if}

  <ul class="flex flex-col gap-2" data-testid="todo-list">
    {#if loading}
      <li class="text-neutral-500">Loading tasks…</li>
    {:else if todos.length === 0}
      <li class="text-neutral-500" data-testid="todo-empty">No tasks yet.</li>
    {:else}
      {#each todos as todo (todo.id)}
        <li
          class="flex items-center gap-3 rounded border border-neutral-200 px-3 py-2"
          data-testid="todo-item"
        >
          <button
            class="rounded border border-neutral-300 px-2 py-1 text-sm"
            data-testid="todo-done"
            type="button"
            onclick={() => toggleTodo(todo)}
          >
            {todo.completed ? 'Undo' : 'Done'}
          </button>
          <span
            class={todo.completed ? 'flex-1 text-neutral-400 line-through' : 'flex-1'}
            data-testid="todo-title-text"
          >
            {todo.title}
          </span>
          {#if todo.dueDate}
            <span class="text-sm text-neutral-500">{todo.dueDate}</span>
          {/if}
          <button
            class="rounded border border-neutral-300 px-2 py-1 text-sm"
            data-testid="todo-remove"
            type="button"
            onclick={() => removeTodo(todo)}
          >
            Remove
          </button>
        </li>
      {/each}
    {/if}
  </ul>
</main>
