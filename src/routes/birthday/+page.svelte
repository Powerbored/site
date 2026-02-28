<script lang="ts">
    import { onMount } from "svelte";

    const themes = {
        neon: {
            id: "neon",
            name: "Neon Cyber",
            bg: "!bg-gradient-to-br !from-slate-900 !via-purple-900 !to-slate-900",
            text: "text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]",
            emojis: ["🤖", "⚡", "👾", "🛸", "🔋"],
        },
        pastel: {
            id: "pastel",
            name: "Pastel Dream",
            bg: "!bg-gradient-to-br !from-pink-200 !via-purple-200 !to-indigo-200",
            text: "text-purple-700",
            emojis: ["🦄", "🌸", "🎀", "✨", "☁️"],
        },
        midnight: {
            id: "midnight",
            name: "Midnight Party",
            bg: "!bg-gradient-to-br !from-indigo-950 !via-purple-900 !to-black",
            text: "text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]",
            emojis: ["🎉", "🍾", "🌙", "⭐", "🎶"],
        },
        golden: {
            id: "golden",
            name: "Golden Elegance",
            bg: "!bg-gradient-to-br !from-amber-100 !via-yellow-100 !to-amber-200",
            text: "text-amber-900",
            emojis: ["🥂", "✨", "👑", "🎂", "💎"],
        },
        sunset: {
            id: "sunset",
            name: "Sunset Vibes",
            bg: "!bg-gradient-to-br !from-orange-500 !via-rose-500 !to-purple-600",
            text: "text-white drop-shadow-md",
            emojis: ["🌅", "🍹", "🌺", "🔥", "😎"],
        },
    };

    const messages = [
        "Happy Birthday {name}! Hope your day is as awesome as you are.",
        "Wishing you the biggest slice of happy today, {name}.",
        "Age is just a number, but cake is very real. Enjoy, {name}!",
        "Another adventure filled year awaits you, {name}. Happy Birthday!",
        "Cheers to you, {name}, for another trip around the sun!",
        "Have a fantastic birthday {name}, filled with everything you love most.",
        "May your birthday be the start of a year filled with good luck, good health and much happiness.",
        "Wishing you a very special birthday, {name}, and a wonderful year ahead!",
        "Happy Birthday {name}! I hope all your birthday wishes and dreams come true.",
        "Here's to a birthday that is as special as you are, {name}!",
        "Don't count the candles {name}, see the lights they give. Happy Birthday.",
        "Wishing you to be happy & healthy now & forever. Happy Birthday {name}!",
        "May your day be more beautiful than a unicorn farting rainbows, {name}.",
        "You're not older {name}, you're just more distinguished.",
        "Happy Birthday {name}! You look exactly the same as you did yesterday.",
        "Happy Birthday to someone who is forever young!",
        "Warmest wishes for a very happy birthday, {name}.",
        "Happy Birthday {name}! Let's celebrate all the wonderful things that make you, you.",
        "Wishing you everything happy for your birthday, {name}.",
        "I hope you have a brilliant birthday, {name}!",
        "Sending you smiles for every moment of your special day.",
        "May your birthday be just the beginning of a year filled with happy memories, {name}.",
        "Happy Birthday {name}! Enjoy your special day.",
        "May life's brightest joys illuminate your path, {name}. Happy Birthday!",
        "Celebrate your birthday today. Celebrate being happy every day.",
        "Wishing you a beautiful day and many blessings for the year ahead, {name}.",
        "Happy Birthday {name}! May your day be as beautiful as you.",
        "Let the birthday magic begin, {name}!",
        "Here's to celebrating you, {name}! Happy Birthday.",
        "Have an absolutely amazing, incredible, super-fantastic birthday, {name}!",
    ];

    let toName = "";
    let fromName = "";
    let selectedMessageIndex = 0;
    let selectedThemeId = "neon";

    let isSharedView = false;
    let sharedTo = "";
    let sharedFrom = "";
    let sharedMessage = "";
    let sharedTheme = themes.neon;

    type EmojiRender = {
        emoji: string;
        left: string;
        animationDuration: string;
        delay: string;
        size: string;
    };
    let emojisToRender: EmojiRender[] = [];

    function readSharedParams() {
        const urlParams = new URLSearchParams(window.location.search);
        if (
            urlParams.has("to") &&
            urlParams.has("from") &&
            urlParams.has("msg") &&
            urlParams.has("theme")
        ) {
            isSharedView = true;
            sharedTo = urlParams.get("to") || "";
            sharedFrom = urlParams.get("from") || "";

            const msgIdx = parseInt(urlParams.get("msg") || "0", 10);
            sharedMessage = messages[msgIdx] || messages[0];

            const themeId = urlParams.get("theme") || "neon";
            sharedTheme = themes[themeId as keyof typeof themes] || themes.neon;

            generateEmojis();
        } else {
            isSharedView = false;
        }
    }

    function generateEmojis() {
        const themeEmojis = sharedTheme.emojis;
        const newEmojis = [];
        for (let i = 0; i < 30; i++) {
            newEmojis.push({
                emoji: themeEmojis[
                    Math.floor(Math.random() * themeEmojis.length)
                ],
                left: Math.random() * 100 + "%",
                animationDuration: 10 + Math.random() * 15 + "s",
                delay: Math.random() * -20 + "s",
                size: 2.5 + Math.random() * 3 + "rem",
            });
        }
        emojisToRender = newEmojis;
    }

    function randomize() {
        selectedMessageIndex = Math.floor(Math.random() * messages.length);
        const themeKeys = Object.keys(themes);
        selectedThemeId =
            themeKeys[Math.floor(Math.random() * themeKeys.length)];
    }

    // Using browser URL instead of $page.url.origin because SvelteKit $page.url might not have full path correctly in dev sometimes without window, but origin is fine.
    // However keeping it robust across mounting
    let origin = "";
    onMount(() => {
        origin = window.location.origin;
        readSharedParams();
    });

    $: generatedLink = `${origin}/birthday?to=${encodeURIComponent(toName)}&from=${encodeURIComponent(fromName)}&msg=${selectedMessageIndex}&theme=${selectedThemeId}`;

    let copySuccess = false;
    function copyLink() {
        navigator.clipboard.writeText(generatedLink);
        copySuccess = true;
        setTimeout(() => (copySuccess = false), 2000);
    }
</script>

<svelte:head>
    <title
        >{isSharedView
            ? `Happy Birthday, ${sharedTo}!`
            : "Create Birthday Wish | Powerbored"}</title
    >
    {#if isSharedView}
        {@html `
        <style>
            html, body {
                background: transparent !important;
            }
            nav.group.fixed {
                display: none !important;
            }
            main.ml-16 {
                margin-left: 0 !important;
                min-height: 100vh !important;
                background-color: transparent !important;
            }
        </style>
        `}
    {/if}
</svelte:head>

{#if isSharedView}
    <!-- Shared View -->
    <div
        class="fixed inset-0 top-0 left-0 w-screen h-screen z-[100] {sharedTheme.bg} flex flex-col items-center justify-center p-8 overflow-hidden animate-in fade-in duration-500"
        style="margin: 0; padding: 0; overflow: hidden; position: fixed;"
    >
        <!-- Background Emojis -->
        {#each emojisToRender as { emoji, left, animationDuration, delay, size }}
            <div
                class="absolute bottom-0 emoji-float origin-center opacity-70 drop-shadow-lg"
                style="left: {left}; font-size: {size}; animation-duration: {animationDuration}; animation-delay: {delay};"
            >
                {emoji}
            </div>
        {/each}

        <!-- Content -->
        <div
            class="relative z-10 text-center max-w-5xl mx-auto space-y-10 p-10 md:p-20 rounded-[4rem] bg-white/10 dark:bg-black/20 backdrop-blur-3xl border border-white/30 shadow-2xl hover:bg-white/20 dark:hover:bg-black/30 transition-all duration-700 hover:scale-[1.02]"
        >
            <h1
                class="text-6xl md:text-9xl font-black mb-6 {sharedTheme.text} tracking-tighter"
            >
                Happy Birthday, <br class="md:hidden" />{sharedTo}!
            </h1>

            <p
                class="text-3xl md:text-5xl font-bold italic opacity-90 {sharedTheme.text} leading-relaxed py-8"
            >
                "{sharedMessage.replace("{name}", sharedTo)}"
            </p>

            <div class="pt-8 border-t border-white/30 inline-block px-12">
                <p
                    class="text-2xl md:text-4xl font-black uppercase tracking-widest {sharedTheme.text} opacity-80"
                >
                    From, {sharedFrom}
                </p>
            </div>
        </div>

        <a
            href="/birthday"
            class="absolute bottom-6 right-6 md:bottom-10 md:right-10 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full text-white/90 hover:text-white font-bold transition-all border border-white/10 z-20 shadow-xl hover:scale-105 active:scale-95"
        >
            Create your own 🎁
        </a>
    </div>
{:else}
    <!-- Creation Menu View -->
    <div
        class="min-h-[80vh] pt-12 pb-12 px-4 flex items-center justify-center relative bg-slate-50/50 dark:bg-slate-900/50"
    >
        <div
            class="w-full max-w-4xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl rounded-[3rem] shadow-2xl border border-white/50 dark:border-slate-700/50 p-6 md:p-14 space-y-10 relative overflow-hidden"
        >
            <!-- Decorative blur blobs behind the form inside the card -->
            <div
                class="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"
            ></div>
            <div
                class="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"
            ></div>

            <div class="text-center space-y-4 relative z-10">
                <h1
                    class="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter drop-shadow-sm"
                >
                    Create a Birthday Message
                </h1>
                <p
                    class="text-xl text-slate-600 dark:text-slate-300 font-medium"
                >
                    Design a personalised, full-screen birthday greeting to
                    share with your friends or loved ones.
                </p>
            </div>

            <div
                class="space-y-8 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md p-6 md:p-10 rounded-[2.5rem] shadow-inner border border-white/50 dark:border-slate-800 relative z-10"
            >
                <div
                    class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-4"
                >
                    <h2
                        class="text-xl font-bold text-slate-800 dark:text-slate-200"
                    >
                        Message Details
                    </h2>
                    <button
                        type="button"
                        on:click={randomize}
                        class="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                        <span>🎲</span> Randomize
                    </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-3">
                        <label
                            for="toName"
                            class="block text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"
                            >To</label
                        >
                        <input
                            id="toName"
                            type="text"
                            bind:value={toName}
                            placeholder="Birthday Person's Name"
                            class="w-full bg-white/80 dark:bg-black/20 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-lg font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 transition-all outline-none backdrop-blur-sm"
                        />
                    </div>
                    <div class="space-y-3">
                        <label
                            for="fromName"
                            class="block text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"
                            >From</label
                        >
                        <input
                            id="fromName"
                            type="text"
                            bind:value={fromName}
                            placeholder="Your Name"
                            class="w-full bg-white/80 dark:bg-black/20 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-lg font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 transition-all outline-none backdrop-blur-sm"
                        />
                    </div>
                </div>

                <div class="space-y-3">
                    <label
                        for="message"
                        class="block text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"
                        >Message</label
                    >
                    <div class="relative">
                        <select
                            id="message"
                            bind:value={selectedMessageIndex}
                            class="w-full appearance-none bg-white/80 dark:bg-black/20 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 pr-12 text-lg font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 transition-all outline-none leading-snug cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 backdrop-blur-sm"
                        >
                            {#each messages as msg, i}
                                <option value={i}
                                    >{msg.replace(
                                        "{name}",
                                        toName || "there",
                                    )}</option
                                >
                            {/each}
                        </select>
                        <div
                            class="absolute inset-y-0 right-0 flex items-center px-5 pointer-events-none text-slate-400 dark:text-slate-500"
                        >
                            <svg
                                class="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="3"
                                    d="M19 9l-7 7-7-7"
                                ></path></svg
                            >
                        </div>
                    </div>
                </div>

                <div class="space-y-3">
                    <label
                        for="theme"
                        class="block text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"
                        >Theme</label
                    >
                    <div class="relative">
                        <select
                            id="theme"
                            bind:value={selectedThemeId}
                            class="w-full appearance-none bg-white/80 dark:bg-black/20 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 pr-12 text-lg font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 transition-all outline-none leading-snug cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 backdrop-blur-sm"
                        >
                            {#each Object.entries(themes) as [id, theme]}
                                <option value={id}
                                    >{theme.name}
                                    {theme.emojis.slice(0, 3).join("")}</option
                                >
                            {/each}
                        </select>
                        <div
                            class="absolute inset-y-0 right-0 flex items-center px-5 pointer-events-none text-slate-400 dark:text-slate-500"
                        >
                            <svg
                                class="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="3"
                                    d="M19 9l-7 7-7-7"
                                ></path></svg
                            >
                        </div>
                    </div>
                </div>
            </div>

            <div class="pt-6 space-y-6 max-w-xl mx-auto relative z-10">
                {#if toName && fromName}
                    <div class="flex flex-col sm:flex-row items-stretch gap-4">
                        <input
                            type="text"
                            readonly
                            value={generatedLink}
                            class="flex-1 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm text-slate-500 dark:text-slate-400 font-mono outline-none shadow-inner"
                        />
                        <button
                            on:click={copyLink}
                            class="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-sm rounded-2xl transition-all shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 whitespace-nowrap hover:scale-105 active:scale-95"
                        >
                            {copySuccess ? "Copied! ✅" : "Copy Link"}
                        </button>
                    </div>

                    <a
                        href={generatedLink}
                        class="flex items-center justify-center w-full px-8 py-4 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Preview Message ✨
                    </a>
                {:else}
                    <div
                        class="p-6 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-400 font-bold text-center"
                    >
                        <span class="text-xl mr-2">✍️</span> Please enter both a
                        "To" and "From" name to generate your link.
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    @keyframes float-up {
        0% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
        }
        5% {
            opacity: 1;
        }
        100% {
            transform: translateY(-120vh) rotate(360deg);
            opacity: 1;
        }
    }

    .emoji-float {
        animation-name: float-up;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
        bottom: -10%;
    }
</style>
