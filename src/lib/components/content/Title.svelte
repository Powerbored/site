<script lang="ts">
    let { type, text } = $props();
</script>

<svelte:element
    this={type}
    class="text-4xl md:text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 drop-shadow-sm"
>
    {#if type === "h1"}
        <span id="main-title">{text}</span>
    {:else}
        {text}
    {/if}
</svelte:element>
