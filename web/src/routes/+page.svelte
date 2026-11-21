<script lang="ts">
  import { onMount } from 'svelte';
  import { formatDueDate, isOverdue } from '#lib/format';
  import { createTodo, listTodos, type Todo } from '#lib/todos';

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

  /** The border and background classes for a task row. */
  function todoClass(todo: Todo): string {
    if (!todo.completed && isOverdue(todo.dueDate, todo.completed)) {
      return 'border-red-300 bg-red-50';
    }
    return 'border-neutral-200';
  }

  /** The text colour for a task's due date label. */
  function dueDateClass(todo: Todo): string {
    if (!todo.completed && isOverdue(todo.dueDate, todo.completed)) {
      return 'font-medium text-red-600';
    }
    return 'text-neutral-500';
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
          class="flex items-center justify-between gap-3 rounded border px-3 py-2 {todoClass(todo)}"
          data-testid="todo-item"
        >
          <span class={todo.completed ? 'text-neutral-400 line-through' : ''}>{todo.title}</span>
          {#if todo.dueDate}
            <span class="text-sm {dueDateClass(todo)}" data-testid="todo-due-label">
              {formatDueDate(todo.dueDate, todo.completed)}
            </span>
          {/if}
        </li>
      {/each}
    {/if}
  </ul>
</main>
