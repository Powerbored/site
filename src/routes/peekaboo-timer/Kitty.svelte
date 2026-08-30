<script lang="ts">
	export let color = "#4ade80"; // Default green
	export let variant: number = -1;
	export let name: string = "";
	export let style = "";

	// Load actual SVG assets from static/kitties directory as raw text strings
	const svgModules = import.meta.glob("/static/kitties/*.svg", {
		query: "?raw",
		import: "default",
		eager: true,
	}) as Record<string, string>;

	const svgEntries = Object.entries(svgModules);

	$: selectedSvg = (() => {
		if (name) {
			const found = svgEntries.find(([path]) => path.includes(name));
			if (found) return found[1];
		}
		if (variant >= 0 && variant < svgEntries.length) {
			return svgEntries[variant][1];
		}
		// Random fallback if no variant/name specified
		const randomIndex = Math.floor(
			Math.random() * (svgEntries.length || 1),
		);
		return svgEntries[randomIndex]?.[1] || "";
	})();
</script>

<div
	class="kitty-container w-full h-full"
	style="--kitty-color: {color}; {style}"
>
	{@html selectedSvg}
</div>

<style>
	.kitty-container {
		display: block;
	}
	:global(.kitty-container svg) {
		width: 100%;
		height: 100%;
		display: block;
	}
	:global(.kitty-container .kitty-body) {
		fill: var(--kitty-color, #4ade80);
		transition: fill 0.3s ease;
	}
</style>
