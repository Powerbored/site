<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import Kitty from "./Kitty.svelte";

	let intervalSeconds = 10;
	let remainingTime = 10;
	let isRunning = false;

	let kittyVisible = false;
	let kittyColor = "#4ade80";
	let kittyEdge = "bottom";
	let kittyOffset = 50; // percentage

	let containerRef: HTMLDivElement;
	let animationFrameId: number;
	let lastTime = 0;
	let timeoutId: number | NodeJS.Timeout;

	const colors = [
		"#4ade80",
		"#fb923c",
		"#2dd4bf",
		"#f472b6",
		"#a78bfa",
		"#fcd34d",
		"#38bdf8",
	];
	const edges = ["top", "bottom", "left", "right"];

	function playMeow() {
		try {
			const AudioContext =
				window.AudioContext || (window as any).webkitAudioContext;
			const ctx = new AudioContext();
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();

			osc.type = "sawtooth";
			osc.connect(gain);
			gain.connect(ctx.destination);

			// Meow frequency envelope
			osc.frequency.setValueAtTime(800, ctx.currentTime);
			osc.frequency.exponentialRampToValueAtTime(
				300,
				ctx.currentTime + 0.5,
			);

			// Meow amplitude envelope
			gain.gain.setValueAtTime(0, ctx.currentTime);
			gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1);
			gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

			osc.start(ctx.currentTime);
			osc.stop(ctx.currentTime + 0.5);
		} catch (e) {
			console.error("Audio playback failed", e);
		}
	}

	function triggerPeekaboo() {
		kittyColor = colors[Math.floor(Math.random() * colors.length)];
		kittyEdge = edges[Math.floor(Math.random() * edges.length)];
		kittyOffset = 20 + Math.random() * 60; // Between 20% and 80%

		kittyVisible = true;
		playMeow();

		if (timeoutId) clearTimeout(timeoutId as NodeJS.Timeout);
		timeoutId = setTimeout(() => {
			kittyVisible = false;
		}, 1500); // Kitty stays visible for 1.5s
	}

	function updateTimer(time: number) {
		if (!isRunning) return;

		const delta = (time - lastTime) / 1000;
		lastTime = time;

		remainingTime -= delta;

		if (remainingTime <= 0) {
			// Timer finished! Trigger peekaboo and reset remainingTime seamlessly
			triggerPeekaboo();
			remainingTime = intervalSeconds + (remainingTime % intervalSeconds);
		}

		animationFrameId = requestAnimationFrame(updateTimer);
	}

	async function startTimer() {
		if (intervalSeconds <= 0) return;

		try {
			if (containerRef && !document.fullscreenElement) {
				await containerRef.requestFullscreen();
			}

			remainingTime = intervalSeconds;
			isRunning = true;
			kittyVisible = false;
			lastTime = performance.now();
			animationFrameId = requestAnimationFrame(updateTimer);
		} catch (err) {
			console.error(`Error attempting to enable fullscreen: ${err}`);
			// Fallback to run even if fullscreen fails
			remainingTime = intervalSeconds;
			isRunning = true;
			lastTime = performance.now();
			animationFrameId = requestAnimationFrame(updateTimer);
		}
	}

	function stopTimer() {
		isRunning = false;
		kittyVisible = false;
		if (animationFrameId) cancelAnimationFrame(animationFrameId);
		if (timeoutId) clearTimeout(timeoutId as NodeJS.Timeout);
		if (typeof document !== "undefined" && document.fullscreenElement) {
			document.exitFullscreen().catch((err) => console.error(err));
		}
	}

	function handleFullscreenChange() {
		if (!document.fullscreenElement && isRunning) {
			stopTimer();
		}
	}

	onMount(() => {
		document.addEventListener("fullscreenchange", handleFullscreenChange);
	});

	onDestroy(() => {
		stopTimer();
		if (typeof document !== "undefined") {
			document.removeEventListener(
				"fullscreenchange",
				handleFullscreenChange,
			);
		}
	});

	$: progress = remainingTime / intervalSeconds;
	// conic-gradient needs an angle
	$: angle = progress * 360;
</script>

<svelte:head>
	<title>Peekaboo Timer</title>
</svelte:head>

<!-- Timer Container -->
<div
	bind:this={containerRef}
	class="w-full h-full min-h-screen bg-neutral-950 flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-500"
>
	{#if !isRunning}
		<!-- Config Screen -->
		<div
			class="bg-neutral-900/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-neutral-800 text-center z-10 w-full max-w-sm"
		>
			<h1 class="text-3xl font-bold text-white mb-6 tracking-tight">
				Peekaboo Timer
			</h1>

			<div class="mb-8">
				<label
					for="interval"
					class="block text-sm font-medium text-neutral-400 mb-2"
				>
					Interval (Seconds)
				</label>
				<input
					type="number"
					id="interval"
					bind:value={intervalSeconds}
					min="1"
					class="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white text-center text-2xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
				/>
			</div>

			<button
				on:click={startTimer}
				class="w-full bg-white text-black font-bold py-4 rounded-xl text-lg hover:bg-neutral-200 active:scale-95 transition-all shadow-lg hover:shadow-white/20"
			>
				Start Timer
			</button>
			<p class="mt-4 text-xs text-neutral-500">
				Requires fullscreen. Press Esc to exit.
			</p>
		</div>
	{:else}
		<!-- Active Timer Screen -->
		<div class="absolute inset-0 bg-black z-0 pointer-events-none"></div>

		<!-- Conic Timer -->
		<div
			class="relative z-10 rounded-full transition-all"
			style="width: 50vmin; height: 50vmin; background: conic-gradient(white {angle}deg, transparent {angle}deg);"
		>
			<!-- Inner dark circle to make it a ring (optional, but looks better) -->
			<!-- <div class="absolute inset-2 bg-black rounded-full"></div> -->
		</div>

		<!-- Peekaboo Kitty Outer Container (Instantly positioned and rotated per edge, no transition) -->
		<div
			class="absolute z-20 pointer-events-none"
			style="
				width: 30vmin;
				height: 30vmin;
				{kittyEdge === 'bottom'
				? `bottom: 0; left: ${kittyOffset}%; transform: translateX(-50%);`
				: ''}
				{kittyEdge === 'top'
				? `top: 0; left: ${kittyOffset}%; transform: translateX(-50%) rotate(180deg);`
				: ''}
				{kittyEdge === 'left'
				? `left: 0; top: ${kittyOffset}%; transform: translateY(-50%) rotate(90deg);`
				: ''}
				{kittyEdge === 'right'
				? `right: 0; top: ${kittyOffset}%; transform: translateY(-50%) rotate(-90deg);`
				: ''}
			"
		>
			<!-- Inner Sliding Wrapper (Handles transition of translate inside local coordinate space) -->
			<div
				class="w-full h-full transition-transform duration-500 ease-in-out"
				style="transform: translateY({kittyVisible ? '0%' : '100%'});"
			>
				<Kitty color={kittyColor} />
			</div>
		</div>
	{/if}
</div>
