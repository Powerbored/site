<script lang="ts">
    import { onMount } from "svelte";
    import { themes, messages } from "$lib/birthday";
    import Title from "$lib/components/content/Title.svelte";

    let toName = "";
    let fromName = "";
    let selectedMessageIndex = 0;
    let selectedThemeId: keyof typeof themes = "neon";

    function randomize() {
        selectedMessageIndex = Math.floor(Math.random() * messages.length);
        const themeKeys = Object.keys(themes) as (keyof typeof themes)[];
        selectedThemeId =
            themeKeys[Math.floor(Math.random() * themeKeys.length)];
    }

    let origin = "";
    onMount(() => {
        origin = window.location.origin;
    });

    $: generatedLink = `${origin}/birthday/message?to=${encodeURIComponent(toName)}&from=${encodeURIComponent(fromName)}&msg=${selectedMessageIndex}&theme=${selectedThemeId}`;

    let copySuccess = false;
    function copyLink() {
        navigator.clipboard.writeText(generatedLink);
        copySuccess = true;
        setTimeout(() => (copySuccess = false), 2000);
    }
</script>

<svelte:head>
    <title>Create Birthday Wish | Powerbored</title>
    <meta
        name="description"
        content="Design a personalised, full-screen birthday greeting to share with your friends or loved ones."
    />
</svelte:head>

<!-- Creation Menu View -->
<div
    class="min-h-[80vh] pt-12 pb-12 px-4 flex items-center justify-center relative bg-slate-50/50 dark:bg-slate-900/50"
>
    <div
        class="w-full max-w-4xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl rounded-[3rem] shadow-2xl border border-white/50 dark:border-slate-700/50 p-6 md:p-14 space-y-10 relative overflow-hidden"
    >
        <div class="text-center space-y-4 relative z-10">
            <Title type="h1" text="Create a Birthday Message" />
            <p
                class="text-xl text-slate-600 dark:text-slate-300 font-medium mt-4"
            >
                Design a personalised, full-screen birthday greeting to share
                with your friends or loved ones.
            </p>
        </div>
        <!-- Decorative blur blobs behind the form inside the card -->
        <div
            class="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"
        ></div>
        <div
            class="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"
        ></div>

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
                    Preview Message
                </a>
            {:else}
                <div
                    class="p-6 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-400 font-bold text-center"
                >
                    Please enter both a "To" and "From" name to generate your
                    link.
                </div>
            {/if}
        </div>
    </div>
</div>
