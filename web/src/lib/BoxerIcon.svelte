<script lang="ts">
  type IconName = 'paw' | 'check' | 'bone' | 'boxer';

  let { name, class: className = '' }: { name: IconName; class?: string } = $props();
</script>

<svg
  class={className}
  data-testid="boxer-icon"
  aria-hidden="true"
  focusable="false"
  viewBox="0 0 24 24"
  fill="currentColor"
>
  {#if name === 'paw'}
    <circle cx="6" cy="9" r="2.2" />
    <circle cx="10.5" cy="5.5" r="2.2" />
    <circle cx="16" cy="5.5" r="2.2" />
    <circle cx="19.5" cy="9.5" r="2.2" />
    <path
      d="M12 10.5c-3 0-6 3.2-6 5.8 0 1.8 1.4 3.2 3.2 3.2.9 0 1.8-.4 2.8-.4s1.9.4 2.8.4c1.8 0 3.2-1.4 3.2-3.2 0-2.6-3-5.8-6-5.8Z"
    />
  {:else if name === 'check'}
    <path
      d="m5 12.5 4.5 4.5L19 7.5"
      fill="none"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  {:else if name === 'bone'}
    <rect x="5" y="9" width="14" height="6" rx="1" />
    <circle cx="5.5" cy="9" r="3" />
    <circle cx="5.5" cy="15" r="3" />
    <circle cx="18.5" cy="9" r="3" />
    <circle cx="18.5" cy="15" r="3" />
  {:else}
    <circle cx="12" cy="11" r="6.5" />
    <ellipse cx="5.5" cy="7.5" rx="2.2" ry="4" transform="rotate(-25 5.5 7.5)" />
    <ellipse cx="18.5" cy="7.5" rx="2.2" ry="4" transform="rotate(25 18.5 7.5)" />
    <ellipse cx="12" cy="15" rx="3.2" ry="2.6" />
  {/if}
</svg>
