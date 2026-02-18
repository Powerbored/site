<script>
	import "../app.css";
	import Navigation from "$lib/components/Navigation.svelte";
</script>

<Navigation />

<main class="ml-16 transition-all duration-300 min-h-screen">
	<slot />
</main>
