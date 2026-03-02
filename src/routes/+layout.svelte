<script>
	import "../app.css";
	import Navigation from "$lib/components/Navigation.svelte";
	import { page } from "$app/state";
</script>

{#if !page.data.noNav}
	<Navigation />
{/if}

<main class="ml-16 transition-all duration-300 min-h-screen">
	<slot />
</main>
