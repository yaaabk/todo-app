<script lang="ts">
  import type { Todo } from './todos';

  interface TodoItemProps {
    todo: Todo;
    /** Removes the todo. Resolves to `true` when it was removed. */
    onRemove: (id: string) => Promise<boolean>;
  }

  let { todo, onRemove }: TodoItemProps = $props();

  let removing = $state(false);

  async function handleRemove() {
    if (removing) return;

    removing = true;
    try {
      await onRemove(todo.id);
    } finally {
      removing = false;
    }
  }
</script>

<li
  data-testid="todo-item"
  class="flex flex-col gap-2 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
>
  <span class="text-base text-ink">{todo.text}</span>
  <button
    type="button"
    class="self-start rounded-sm border border-primary px-4 py-2 text-base font-semibold text-primary hover:bg-base-lightest disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
    disabled={removing}
    onclick={handleRemove}
  >
    {removing ? 'Removing…' : 'Remove'}
  </button>
</li>
