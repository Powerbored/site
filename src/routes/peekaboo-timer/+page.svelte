<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import Kitty from "./Kitty.svelte";

	interface ActiveKitty {
		id: number;
		color: string;
		edge: string;
		offset: number;
		visible: boolean;
	}

	let intervalSeconds = 10;
	let remainingTime = 10;
	let intervalCount = 0;
	let isRunning = false;

	let activeKitties: ActiveKitty[] = [];
	let kittyIdCounter = 0;

	let containerRef: HTMLDivElement;
	let animationFrameId: number;
	let lastTime = 0;
	let wakeLock: WakeLockSentinel | null = null;
	let orientationAngle = 0;

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
		const id = ++kittyIdCounter;
		const color = colors[Math.floor(Math.random() * colors.length)];
		const edge = edges[Math.floor(Math.random() * edges.length)];
		const offset = 20 + Math.random() * 60; // Between 20% and 80%

		const newKitty: ActiveKitty = {
			id,
			color,
			edge,
			offset,
			visible: false,
		};
		activeKitties = [...activeKitties, newKitty];

		playMeow();

		// Trigger slide-in transition after mounting
		setTimeout(() => {
			activeKitties = activeKitties.map((k) =>
				k.id === id ? { ...k, visible: true } : k,
			);
		}, 20);

		// Slide-out after 1.5s
		setTimeout(() => {
			activeKitties = activeKitties.map((k) =>
				k.id === id ? { ...k, visible: false } : k,
			);
			// Remove from DOM after slide-out animation (500ms)
			setTimeout(() => {
				activeKitties = activeKitties.filter((k) => k.id !== id);
			}, 500);
		}, 1500);
	}

	function updateTimer(time: number) {
		if (!isRunning) return;

		const delta = (time - lastTime) / 1000;
		lastTime = time;

		remainingTime -= delta;

		if (remainingTime <= 0) {
			// Timer finished! Trigger peekaboo, increment interval count and reset remainingTime
			triggerPeekaboo();
			intervalCount++;
			remainingTime = intervalSeconds + (remainingTime % intervalSeconds);
		}

		animationFrameId = requestAnimationFrame(updateTimer);
	}

	async function requestWakeLock() {
		try {
			if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
				wakeLock = await navigator.wakeLock.request("screen");
			}
		} catch (err) {
			console.error("Wake Lock request failed:", err);
		}
	}

	function releaseWakeLock() {
		if (wakeLock) {
			wakeLock.release().catch((err) => console.error(err));
			wakeLock = null;
		}
	}

	function handleOrientation(event: DeviceOrientationEvent) {
		if (event.beta !== null && event.gamma !== null) {
			// Calculate orientation angle of phone relative to upright portrait position
			const rad = Math.atan2(event.gamma, event.beta);
			orientationAngle = -rad * (180 / Math.PI);
		}
	}

	async function startTimer() {
		if (intervalSeconds <= 0) return;

		// Request device orientation permissions if needed (iOS)
		if (
			typeof DeviceOrientationEvent !== "undefined" &&
			typeof (DeviceOrientationEvent as any).requestPermission ===
				"function"
		) {
			try {
				await (DeviceOrientationEvent as any).requestPermission();
			} catch (e) {
				console.error("Device orientation permission failed", e);
			}
		}

		try {
			if (containerRef && !document.fullscreenElement) {
				await containerRef.requestFullscreen();
			}
		} catch (err) {
			console.error(`Error attempting to enable fullscreen: ${err}`);
		}

		remainingTime = intervalSeconds;
		intervalCount = 0;
		isRunning = true;
		activeKitties = [];
		lastTime = performance.now();
		animationFrameId = requestAnimationFrame(updateTimer);
		requestWakeLock();
	}

	function stopTimer() {
		isRunning = false;
		activeKitties = [];
		releaseWakeLock();
		if (animationFrameId) cancelAnimationFrame(animationFrameId);
		if (typeof document !== "undefined" && document.fullscreenElement) {
			document.exitFullscreen().catch((err) => console.error(err));
		}
	}

	function handleFullscreenChange() {
		if (!document.fullscreenElement && isRunning) {
			stopTimer();
		}
	}

	function handleVisibilityChange() {
		if (document.visibilityState === "visible" && isRunning) {
			requestWakeLock();
		}
	}

	onMount(() => {
		document.addEventListener("fullscreenchange", handleFullscreenChange);
		document.addEventListener("visibilitychange", handleVisibilityChange);
		if (typeof window !== "undefined") {
			window.addEventListener("deviceorientation", handleOrientation);
		}
	});

	onDestroy(() => {
		stopTimer();
		if (typeof document !== "undefined") {
			document.removeEventListener(
				"fullscreenchange",
				handleFullscreenChange,
			);
			document.removeEventListener(
				"visibilitychange",
				handleVisibilityChange,
			);
		}
		if (typeof window !== "undefined") {
			window.removeEventListener("deviceorientation", handleOrientation);
		}
	});

	$: elapsedProgress = Math.min(
		1,
		Math.max(0, 1 - remainingTime / intervalSeconds),
	);
	$: elapsedAngle = elapsedProgress * 360;
	$: isEvenInterval = intervalCount % 2 === 0;

	$: conicGradientStyle = isEvenInterval
		? `conic-gradient(transparent 0deg ${elapsedAngle}deg, white ${elapsedAngle}deg 360deg)`
		: `conic-gradient(white 0deg ${elapsedAngle}deg, transparent ${elapsedAngle}deg 360deg)`;
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
		<div
			class="absolute inset-0 z-0 pointer-events-none"
			style="background: rebeccapurple"
		></div>

		<!-- Conic Timer Circle (Oriented to device rotation) -->
		<div
			class="relative z-10 rounded-full transition-all"
			style="width: 50vmin; height: 50vmin; transform: rotate({orientationAngle}deg); background: {conicGradientStyle};"
		></div>

		<!-- Peekaboo Kitties (Multiple self-destroying instances) -->
		{#each activeKitties as kitty (kitty.id)}
			<div
				class="absolute z-20 pointer-events-none"
				style="
					width: 30vmin;
					height: 30vmin;
					filter: drop-shadow( 3vmin 3vmin 2px rgba(0, 0, 0, 0.3));
					{kitty.edge === 'bottom'
					? `bottom: 0; left: ${kitty.offset}%; transform: translateX(-50%);`
					: ''}
					{kitty.edge === 'top'
					? `top: 0; left: ${kitty.offset}%; transform: translateX(-50%) rotate(180deg);`
					: ''}
					{kitty.edge === 'left'
					? `left: 0; top: ${kitty.offset}%; transform: translateY(-50%) rotate(90deg);`
					: ''}
					{kitty.edge === 'right'
					? `right: 0; top: ${kitty.offset}%; transform: translateY(-50%) rotate(-90deg);`
					: ''}
				"
			>
				<!-- Inner Sliding Wrapper -->
				<div
					class="w-full h-full transition-transform duration-500 ease-in-out"
					style="transform: translateY({kitty.visible
						? '0%'
						: '100%'});"
				>
					<Kitty color={kitty.color} />
				</div>
			</div>
		{/each}
	{/if}
</div>
