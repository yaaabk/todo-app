<script lang="ts">
  interface TodoFormProps {
    /** Adds the trimmed text. Resolves to `true` when the todo was saved. */
    onAdd: (text: string) => Promise<boolean>;
  }

  let { onAdd }: TodoFormProps = $props();

  let text = $state('');
  let adding = $state(false);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();

    const value = text.trim();
    if (value === '' || adding) return;

    adding = true;
    try {
      const added = await onAdd(value);
      if (added) text = '';
    } finally {
      adding = false;
    }
  }
</script>

<form class="flex flex-col gap-3 sm:flex-row sm:items-end" onsubmit={handleSubmit}>
  <div class="flex-1">
    <label for="new-todo" class="mb-1 block text-sm font-semibold text-ink">New task</label>
    <input
      id="new-todo"
      name="todo"
      type="text"
      maxlength={200}
      autocomplete="off"
      placeholder="e.g. Renew my passport"
      class="w-full rounded-sm border border-base-light bg-white px-3 py-2 text-base text-ink placeholder:text-neutral-500"
      bind:value={text}
    />
  </div>
  <button
    type="submit"
    class="rounded-sm bg-primary px-5 py-2 text-base font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
    disabled={adding}
  >
    {adding ? 'Adding…' : 'Add'}
  </button>
</form>
