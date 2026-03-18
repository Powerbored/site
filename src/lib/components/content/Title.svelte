<script lang="ts">
    let { type, text } = $props();
</script>

<svelte:element
    this={type}
    class="text-4xl/[1.5] md:text-6xl/[1.5] font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-cyan-600 dark:from-white dark:to-cyan-400 drop-shadow-sm"
>
    {#if type === "h1"}
        <span id="main-title">{text}</span>
    {:else}
        {text}
    {/if}
</svelte:element>
