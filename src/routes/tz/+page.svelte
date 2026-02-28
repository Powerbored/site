<script lang="ts">
    import { onMount } from "svelte";
    import LightningBackground from "$lib/components/LightningBackground.svelte";

    let now = new Date();
    let timezone = "";
    let city = "";
    let utcOffset = "";
    let longTZ = "";
    let longTZInitials = "";
    let nextTransition: {
        date: Date;
        type: string;
        days: number;
        nextTZ: string;
        nextTZInitials: string;
    } | null = null;

    function updateTime() {
        now = new Date();
    }

    function calculateInfo() {
        const options = Intl.DateTimeFormat().resolvedOptions();
        timezone = options.timeZone;

        // City usually is the last part of the timezone ID
        city = timezone.split("/").pop()?.replace(/_/g, " ") || timezone;

        const dateString = now.toString();
        const offsetMatch = dateString.match(/([+-]\d{4})/);
        if (offsetMatch) {
            const rawOffset = offsetMatch[1];
            utcOffset = `UTC ${rawOffset.slice(0, 3)}:${rawOffset.slice(3)}`;
        }

        const longFormatter = new Intl.DateTimeFormat("en-US", {
            timeZoneName: "long",
        });
        longTZ =
            longFormatter
                .formatToParts(now)
                .find((p) => p.type === "timeZoneName")?.value || "";
        longTZInitials = longTZ
            .split(" ")
            .map((word) => word[0])
            .join("");

        // DST check - check next 365 days
        findNextTransition();
    }

    function findNextTransition() {
        const currentOffset = now.getTimezoneOffset();
        const oneDay = 24 * 60 * 60 * 1000;
        let checkDate = new Date(now.getTime() + oneDay);

        // Step forward till we find a change in offset
        for (let i = 0; i < 365; i++) {
            if (checkDate.getTimezoneOffset() !== currentOffset) {
                // Found transition day
                const days = Math.floor(
                    (checkDate.getTime() - now.getTime()) / oneDay,
                );
                const type =
                    checkDate.getTimezoneOffset() < currentOffset
                        ? "starts"
                        : "ends";

                // Get the long name of the TZ after transition
                // We go 2 days past the detected change to ensure we are well into the new period
                const futureDate = new Date(checkDate.getTime() + oneDay * 2);
                const longFormatter = new Intl.DateTimeFormat("en-US", {
                    timeZoneName: "long",
                });
                const nextTZ =
                    longFormatter
                        .formatToParts(futureDate)
                        .find((p) => p.type === "timeZoneName")?.value || "";
                const nextTZInitials = nextTZ
                    .split(" ")
                    .map((word) => word[0])
                    .join("");

                nextTransition = {
                    date: checkDate,
                    type,
                    days,
                    nextTZ,
                    nextTZInitials,
                };
                return;
            }
            checkDate = new Date(checkDate.getTime() + oneDay);
        }
        nextTransition = null;
    }

    onMount(() => {
        calculateInfo();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    });

    $: timeStr = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
    });
    $: dateStr = now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
</script>

<svelte:head>
    <title>{city} Time | Powerbored</title>
    <meta
        name="description"
        content="Current time, timezone details and daylight saving status for {city} ({timezone})."
    />
</svelte:head>

<div
    class="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-4"
>
    <div
        class="relative z-10 w-full max-w-2xl bg-white/10 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/20 dark:border-slate-700/50 rounded-[2.5rem] p-4 md:p-12 shadow-2xl transition-all duration-700 hover:bg-white/15 dark:hover:bg-slate-900/50"
    >
        <header class="text-center mb-6 md:mb-12">
            <h1
                id="main-title"
                class="inline-block text-5xl md:text-7xl font-black italic tracking-tighter mb-2 drop-shadow-sm"
            >
                {city}
            </h1>
            <p
                class="text-slate-600 dark:text-slate-400 font-bold tracking-widest uppercase opacity-70"
            >
                {timezone}
            </p>
        </header>

        <div class="space-y-6 md:space-y-12">
            <!-- Main Clock -->
            <div class="text-center group">
                <div
                    class="text-4xl md:text-[5rem] font-mono font-black tracking-tighter text-slate-900 dark:text-white mb-4 tabular-nums"
                >
                    {timeStr}
                </div>
                <div
                    class="text-xl md:text-2xl text-slate-500 dark:text-slate-400 font-semibold tracking-tight"
                >
                    {dateStr}
                </div>
            </div>

            <!-- Stats Grid -->
            <div
                class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 pt-6 md:pt-12 border-t border-slate-900/5 dark:border-white/5"
            >
                <div
                    class="p-4 md:p-6 rounded-3xl bg-slate-900/5 dark:bg-white/5 border border-white/5 group hover:border-blue-500/30 transition-colors"
                >
                    <div
                        class="font-black uppercase tracking-[0.2em] text-blue-500 dark:text-sky-400 mb-2"
                    >
                        UTC Offset
                    </div>
                    <div
                        class="text-3xl font-bold text-slate-800 dark:text-slate-100"
                    >
                        {utcOffset}
                    </div>
                </div>
                <div
                    class="p-4 md:p-6 rounded-3xl bg-slate-900/5 dark:bg-white/5 border border-white/5 group hover:border-blue-500/30 transition-colors"
                >
                    <div
                        class="font-black uppercase tracking-[0.2em] text-blue-500 dark:text-sky-400 mb-2"
                    >
                        Region Name
                    </div>
                    <div
                        class="text-3xl font-bold text-slate-800 dark:text-slate-100"
                        title={longTZ}
                    >
                        {longTZInitials}
                    </div>
                </div>
            </div>

            <!-- DST Alert -->
            {#if nextTransition}
                <div
                    class="mt-8 p-4 md:p-6 rounded-3xl bg-gradient-to-br from-blue-600/10 to-indigo-600/10 border border-blue-500/20 text-center animate-pulse-slow"
                >
                    <div class="flex flex-col items-center gap-2">
                        <span
                            class="text-blue-600 dark:text-sky-300 font-bold text-lg"
                        >
                            Daylight Savings {nextTransition.type === "starts"
                                ? "begins"
                                : "ends"} in
                        </span>
                        <div class="flex items-baseline gap-2">
                            <span
                                class="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tabular-nums drop-shadow-md"
                            >
                                {nextTransition.days}
                            </span>
                            <span
                                class="text-xl font-bold text-slate-500 uppercase tracking-tighter"
                                >Days</span
                            >
                        </div>
                        <p
                            class="text-xs mt-4 text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] font-black"
                        >
                            Next Phase<span
                                class="block text-3xl font-bold text-slate-800 dark:text-slate-100"
                                title={nextTransition.nextTZ}
                                >{nextTransition.nextTZInitials}</span
                            >
                        </p>
                    </div>
                </div>
            {:else}
                <div
                    class="mt-8 p-6 rounded-3xl bg-slate-500/5 border border-slate-500/10 text-center"
                >
                    <p class="text-slate-500 font-medium italic">
                        Standard time region • No upcoming seasonal transitions
                    </p>
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    :global(html) {
        scroll-behavior: smooth;
    }

    .animate-pulse-slow {
        animation: pulse-subtle 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes pulse-subtle {
        0%,
        100% {
            opacity: 1;
            transform: scale(1);
        }
        50% {
            opacity: 0.95;
            transform: scale(0.995);
        }
    }

    /* Custom scrollbar for better aesthetics */
    :global(::-webkit-scrollbar) {
        width: 8px;
    }
    :global(::-webkit-scrollbar-track) {
        background: transparent;
    }
    :global(::-webkit-scrollbar-thumb) {
        background: rgba(148, 163, 184, 0.1);
        border-radius: 4px;
    }
    :global(::-webkit-scrollbar-thumb:hover) {
        background: rgba(148, 163, 184, 0.2);
    }
</style>
