<script lang="ts">
  import { onMount } from 'svelte';
  import BoxerIcon from '#lib/BoxerIcon.svelte';
  import { formatDueDate, isOverdue } from '#lib/format';
  import { loadBoxerPhotos } from '#lib/boxer';
  import { createTodo, deleteTodo, listTodos, updateTodo, type Todo } from '#lib/todos';

  let todos = $state<Todo[]>([]);
  let title = $state('');
  let dueDate = $state('');
  let error = $state('');
  let loading = $state(true);
  let saving = $state(false);
  let boxerUrl = $state('/boxer-fallback.jpg');
  let boxerImages = $state<string[]>([]);

  onMount(async () => {
    void loadBoxerPhoto();
    try {
      todos = await listTodos();
    } catch {
      error = 'Could not load the tasks.';
    } finally {
      loading = false;
    }
  });

  /** Loads a fresh set of boxer photos, keeping the bundled one when the API fails. */
  async function loadBoxerPhoto() {
    try {
      const photos = await loadBoxerPhotos();
      boxerUrl = photos.url;
      boxerImages = photos.images;
    } catch {
      // Keep the bundled photo.
    }
  }

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
      void loadBoxerPhoto();
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
  <div class="boxer-background" data-testid="boxer-background" aria-hidden="true">
    <div class="boxer-paw-pattern"></div>
    {#each boxerImages.slice(0, 2) as image (image)}
      <img class="boxer-background-photo" data-testid="boxer-background-photo" src={image} alt="" />
    {/each}
  </div>

  <img class="h-48 w-full rounded object-cover" data-testid="boxer-photo" src={boxerUrl} alt="" />

  {#if boxerImages.length > 1}
    <ul class="flex flex-wrap gap-2" data-testid="boxer-pack">
      {#each boxerImages.slice(1) as image (image)}
        <li data-testid="boxer-pack-item">
          <img class="h-24 w-24 rounded object-cover" src={image} alt="" />
        </li>
      {/each}
    </ul>
  {/if}

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
      class="inline-flex items-center gap-1.5 rounded bg-neutral-900 px-4 py-2 font-medium text-white disabled:opacity-50"
      data-testid="todo-submit"
      type="submit"
      disabled={saving}
    >
      <BoxerIcon name="paw" class="h-4 w-4" />
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
          class="flex items-center gap-3 rounded border px-3 py-2 {todoClass(todo)}"
          data-testid="todo-item"
        >
          <button
            class="inline-flex items-center gap-1.5 rounded border border-neutral-300 px-2 py-1 text-sm"
            data-testid="todo-done"
            type="button"
            onclick={() => toggleTodo(todo)}
          >
            <BoxerIcon name="check" class="h-4 w-4" />
            {todo.completed ? 'Undo' : 'Done'}
          </button>
          <span
            class={todo.completed ? 'flex-1 text-neutral-400 line-through' : 'flex-1'}
            data-testid="todo-title-text"
          >
            {todo.title}
          </span>
          {#if todo.dueDate}
            <span class="text-sm {dueDateClass(todo)}" data-testid="todo-due-label">
              {formatDueDate(todo.dueDate, todo.completed)}
            </span>
          {/if}
          <button
            class="inline-flex items-center gap-1.5 rounded border border-neutral-300 px-2 py-1 text-sm"
            data-testid="todo-remove"
            type="button"
            onclick={() => removeTodo(todo)}
          >
            <BoxerIcon name="bone" class="h-4 w-4" />
            Remove
          </button>
        </li>
      {/each}
    {/if}
  </ul>
</main>
