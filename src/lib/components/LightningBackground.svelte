<script lang="ts">
    import { onMount } from "svelte";

    // Adjustable variables
    export let minTimeBetweenStrikes = 500; // ms
    export let maxTimeBetweenStrikes = 3000; // ms
    export let minSegments = 8;
    export let maxSegments = 16;
    export let minBranches = 0;
    export let maxBranches = 6;
    export let topRegion = 0.2; // fraction of height
    export let bottomRegion = 0.2; // fraction of height
    export let targetFps = 60;
    export let minSegmentTime = 20;
    export let maxSegmentTime = 30;

    interface Point {
        x: number;
        y: number;
    }

    interface Branch {
        points: Point[];
        startTime: number; // 0 to 1 progress within the strike
    }

    interface Strike {
        id: string;
        mainPath: Point[];
        branches: Branch[];
        startTime: number; // performance.now()
        duration: number; // ms
        flashing: boolean;
        finished: boolean;
    }

    let strikes: Strike[] = [];
    let canvasWidth = 0;
    let canvasHeight = 0;
    let nextStrikeTime = 0;
    let lastTime = 0;

    const STRIKE_DURATION = 500; // ms to reach bottom

    function getRandom(min: number, max: number) {
        return Math.random() * (max - min) + min;
    }

    function generateStrike(): Strike {
        const startX = getRandom(0, canvasWidth);
        const startY = getRandom(0, canvasHeight * topRegion);
        const endX = getRandom(0, canvasWidth);
        const endY = getRandom(canvasHeight * (1 - bottomRegion), canvasHeight);

        const segments = Math.floor(getRandom(minSegments, maxSegments));
        const mainPath: Point[] = [{ x: startX, y: startY }];

        for (let i = 1; i <= segments; i++) {
            const progress = i / segments;
            const targetX = startX + (endX - startX) * progress;
            const targetY = startY + (endY - startY) * progress;

            // Add jitter
            const jitter =
                canvasWidth * 0.15 * (1 - Math.abs(progress - 0.5) * 2);
            mainPath.push({
                x: targetX + getRandom(-jitter, jitter),
                y: targetY,
            });
        }

        const branchCount = Math.floor(getRandom(minBranches, maxBranches));
        const branches: Branch[] = [];

        for (let i = 0; i < branchCount; i++) {
            const startIdx = Math.floor(getRandom(1, mainPath.length - 2));
            const startPoint = mainPath[startIdx];
            const branchSegments = Math.floor(getRandom(3, 8));
            const branchPoints: Point[] = [startPoint];

            let currentX = startPoint.x;
            let currentY = startPoint.y;
            const angle =
                getRandom(-Math.PI / 4, Math.PI / 4) +
                (Math.random() > 0.5 ? Math.PI / 6 : -Math.PI / 6);

            for (let j = 1; j <= branchSegments; j++) {
                currentX +=
                    Math.cos(angle) * (canvasWidth * 0.05) + getRandom(-20, 20);
                currentY +=
                    Math.sin(angle) * (canvasHeight * 0.05) + getRandom(0, 20);
                branchPoints.push({ x: currentX, y: currentY });
            }

            branches.push({
                points: branchPoints,
                startTime: startIdx / mainPath.length,
            });
        }

        return {
            id: crypto.randomUUID(),
            mainPath,
            branches,
            startTime: performance.now(),
            duration: segments * getRandom(minSegmentTime, maxSegmentTime),
            flashing: false,
            finished: false,
        };
    }

    function update(time: number) {
        const deltaTime = time - lastTime;
        lastTime = time;

        if (time > nextStrikeTime) {
            strikes = [...strikes, generateStrike()];
            nextStrikeTime =
                time + getRandom(minTimeBetweenStrikes, maxTimeBetweenStrikes);
        }

        strikes = strikes
            .filter((s) => !s.finished)
            .map((s) => {
                const elapsed = time - s.startTime;
                const progress = Math.min(elapsed / s.duration, 1);

                if (progress >= 1 && !s.flashing) {
                    s.flashing = true;
                    // Keep it for one more frame to flash
                    return s;
                } else if (s.flashing) {
                    s.finished = true;
                }
                return s;
            });

        requestAnimationFrame(update);
    }

    onMount(() => {
        lastTime = performance.now();
        nextStrikeTime =
            lastTime + getRandom(minTimeBetweenStrikes, maxTimeBetweenStrikes);
        const raf = requestAnimationFrame(update);
        return () => cancelAnimationFrame(raf);
    });

    function getVisibleMainPath(strike: Strike) {
        const elapsed = lastTime - strike.startTime;
        const progress = Math.min(elapsed / strike.duration, 1);
        const visibleCount = Math.ceil(progress * strike.mainPath.length);
        return strike.mainPath
            .slice(0, visibleCount)
            .map((p) => `${p.x},${p.y}`)
            .join(" ");
    }

    function getVisibleBranchPath(strike: Strike, branch: Branch) {
        const elapsed = lastTime - strike.startTime;
        const strikeProgress = Math.min(elapsed / strike.duration, 1);

        if (strikeProgress < branch.startTime) return "";

        const branchProgress =
            (strikeProgress - branch.startTime) / (1 - branch.startTime);
        const visibleCount = Math.ceil(branchProgress * branch.points.length);
        return branch.points
            .slice(0, visibleCount)
            .map((p) => `${p.x},${p.y}`)
            .join(" ");
    }
</script>

<div
    class="fixed inset-0 pointer-events-none z-0 overflow-hidden"
    bind:clientWidth={canvasWidth}
    bind:clientHeight={canvasHeight}
>
    <!-- Dark overlay for better contrast if needed, or just let theme handle it -->
    <div
        class="absolute inset-0 bg-transparent transition-colors duration-500"
    ></div>

    <svg width="100%" height="100%" class="w-full h-full">
        <defs>
            <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>

        {#each strikes as strike (strike.id)}
            <g
                class="lightning-bolt"
                filter={strike.flashing ? "url(#glow)" : ""}
            >
                <!-- Main bolt -->
                <polyline
                    points={getVisibleMainPath(strike)}
                    fill="none"
                    stroke={strike.flashing ? "white" : "url(#grad)"}
                    stroke-width={strike.flashing ? 4 : 2}
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="transition-all duration-75"
                />

                <!-- Branches -->
                {#each strike.branches as branch}
                    <polyline
                        points={getVisibleBranchPath(strike, branch)}
                        fill="none"
                        stroke={strike.flashing ? "white" : "url(#grad)"}
                        stroke-width={strike.flashing ? 2 : 1}
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                {/each}
            </g>
        {/each}

        <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#7dd3fc; stop-opacity:1" />
                <stop
                    offset="100%"
                    style="stop-color:#38bdf8; stop-opacity:0.8"
                />
            </linearGradient>
        </defs>
    </svg>
</div>

<style>
    .lightning-bolt polyline {
        filter: drop-shadow(0 0 4px #0ea5e9);
    }
</style>
