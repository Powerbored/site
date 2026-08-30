<script lang="ts">
	export let color = "#4ade80"; // Default green
	export let style = "";
</script>

<svg
	viewBox="0 0 100 100"
	xmlns="http://www.w3.org/2000/svg"
	class="w-full h-full kitty-svg"
	{style}
>
	<g fill={color}>
		<!-- Left Ear -->
		<path
			d="M 15 50 
               C 10 30, 15 10, 20 5 
               C 25 15, 30 30, 35 45 Z"
		/>

		<!-- Right Ear -->
		<path
			d="M 85 50 
               C 90 30, 85 10, 80 5 
               C 75 15, 70 30, 65 45 Z"
		/>

		<!-- Head (rounded top, flat bottom) -->
		<path
			d="M 10 40
			   C 10 20, 90 20, 90 40
			   L 90 100
			   L 10 100 Z"
		/>
	</g>

	<!-- Eyes -->
	<circle cx="35" cy="65" r="4" fill="#1a1a1a" />
	<circle cx="65" cy="65" r="4" fill="#1a1a1a" />

	<!-- Mouth/Nose -->
	<g
		stroke="#1a1a1a"
		stroke-width="2.5"
		stroke-linecap="round"
		stroke-linejoin="round"
		fill="none"
	>
		<!-- Tiny nose line -->
		<line x1="50" y1="72" x2="50" y2="76" />
		<!-- Left curve -->
		<path d="M 50 76 Q 45 82, 40 76" />
		<!-- Right curve -->
		<path d="M 50 76 Q 55 82, 60 76" />
	</g>
</svg>

<style>
	.kitty-svg {
		/* Ensures smooth scaling */
		display: block;
	}
</style>
