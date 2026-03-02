<script lang="ts">
    import { onMount } from "svelte";
    import Icon from "$lib/components/Icon.svelte";
    import { themes, getTheme, getMessage, type Theme } from "$lib/birthday";

    let ready = false;

    let sharedTo = "";
    let sharedFrom = "";
    let sharedMessage = "";
    let sharedTheme: Theme = themes.neon;

    type EmojiRender = {
        emoji: string;
        left: string;
        animationDuration: string;
        delay: string;
        size: string;
    };
    let emojisToRender: EmojiRender[] = [];

    function generateEmojis() {
        const themeEmojis = sharedTheme.emojis;
        emojisToRender = Array.from({ length: 30 }, () => ({
            emoji: themeEmojis[Math.floor(Math.random() * themeEmojis.length)],
            left: Math.random() * 100 + "%",
            animationDuration: 10 + Math.random() * 15 + "s",
            delay: Math.random() * -20 + "s",
            size: 2.5 + Math.random() * 3 + "rem",
        }));
    }

    onMount(() => {
        const params = new URLSearchParams(window.location.search);

        sharedTo = params.get("to") ?? "";
        sharedFrom = params.get("from") ?? "";
        sharedMessage = getMessage(parseInt(params.get("msg") ?? "0", 10));
        sharedTheme = getTheme(params.get("theme") ?? "neon");

        generateEmojis();

        // Two rAF ticks ensure Svelte has re-rendered the themed content before fading in
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                ready = true;
            });
        });
    });
</script>

<svelte:head>
    <title
        >{sharedTo
            ? `Happy Birthday, ${sharedTo}!`
            : "Birthday Wish | Powerbored"}</title
    >
    {@html `
    <style>
        html, body { background: transparent !important; }
        nav.group.fixed { display: none !important; }
        main.ml-16 { margin-left: 0 !important; min-height: 100vh !important; background-color: transparent !important; }
    </style>
    `}
</svelte:head>

<!-- Black overlay while content loads; fades out once ready -->
<div
    class="fixed inset-0 bg-black z-[99] pointer-events-none transition-opacity duration-700"
    class:opacity-0={ready}
    class:opacity-100={!ready}
></div>

<div
    class="fixed inset-0 w-screen h-screen z-[100] {sharedTheme.bg} flex flex-col items-center justify-center overflow-hidden transition-opacity duration-700 m-0 p-4 pb-20"
    class:opacity-100={ready}
    class:opacity-0={!ready}
>
    <!-- Background Emojis -->
    {#each emojisToRender as { emoji, left, animationDuration, delay, size }}
        <div
            class="absolute bottom-0 emoji-float origin-center opacity-70 drop-shadow-lg"
            style="left: {left}; font-size: {size}; animation-duration: {animationDuration}; animation-delay: {delay}"
        >
            <div style="transform: rotate({Math.random() * 360}deg);">
                {emoji}
            </div>
        </div>
    {/each}

    <!-- Content card -->
    <div
        class="relative z-10 text-center max-w-5xl mx-auto space-y-6 md:space-y-10 p-6 md:p-14 lg:p-20 rounded-[4rem] bg-white/10 dark:bg-black/20 backdrop-blur-3xl border border-white/30 shadow-2xl hover:bg-white/20 dark:hover:bg-black/30 transition-all duration-700 hover:scale-[1.02]"
    >
        <h1
            class="text-6xl md:text-9xl font-black mb-6 {sharedTheme.text} tracking-tighter"
        >
            Happy Birthday,&ensp;<br class="md:hidden" />{sharedTo}!
        </h1>

        <p
            class="text-3xl md:text-5xl font-bold italic opacity-90 {sharedTheme.text} leading-relaxed py-8"
        >
            {sharedMessage.replace("{name}", sharedTo)}
        </p>

        <div class="pt-8 border-t border-white/30 inline-block px-12">
            <p
                class="text-2xl md:text-4xl font-black uppercase tracking-widest {sharedTheme.text} opacity-80"
            >
                From, {sharedFrom}
            </p>
        </div>
    </div>

    <!-- Home button: lightning bolt icon -->
    <a
        href="/"
        aria-label="Go to home page"
        class="absolute bottom-4 right-4 p-4 bg-white/10 hover:bg-white/25 backdrop-blur-xl rounded-full text-cyan-400 hover:text-cyan-600 transition-all border border-white/20 z-20 shadow-xl hover:scale-110 active:scale-95"
    >
        <Icon name="lightning-bolt" variant="filled" size={24} />
    </a>
</div>

<style>
    @keyframes float-up {
        0% {
            transform: translateY(0vh) rotate(0);
            opacity: 0;
        }
        5% {
            opacity: 1;
        }
        95% {
            opacity: 1;
        }
        100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
        }
    }

    .emoji-float {
        animation-name: float-up;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
    }
</style>
