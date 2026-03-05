<script>
	import "../app.css";
	import Navigation from "$lib/components/Navigation.svelte";
	import RadialMenu from "$lib/components/RadialMenu.svelte";
	import { page } from "$app/state";
</script>

{#if !page.data.noNav}
	<Navigation />
	<RadialMenu />
{/if}

<main class="ml-0 md:ml-16 transition-all duration-300 min-h-screen">
	<slot />
</main>
