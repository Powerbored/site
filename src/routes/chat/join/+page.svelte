<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import QRCode from "qrcode";
    import { goto } from "$app/navigation";
    import {
        chatManager,
        activeChatName,
        saveChatToHistory,
    } from "$lib/chatStore";

    import { page } from "$app/stores";

    const { connectionState } = chatManager;

    let offerInput = "";
    let base64Payload = "";
    let chatName = "Chat Partner";
    let qrCanvas: HTMLCanvasElement;
    let copySuccess = false;

    onMount(() => {
        const nameParam = $page.url.searchParams.get("name");
        if (nameParam) chatName = nameParam;

        const hash = window.location.hash;
        if (hash.startsWith("#offer=")) {
            offerInput = hash.replace("#offer=", "");
            handleJoin();
        }
    });

    onDestroy(() => {
        if ($connectionState !== "connected") {
            chatManager.cleanup();
        }
    });

    $: if ($connectionState === "connected") {
        saveChatToHistory(chatName, "joiner");
        activeChatName.set(chatName);
        goto(`/chat#${encodeURIComponent(chatName)}`);
    }

    async function handleJoin() {
        if (!offerInput.trim()) return;
        const payload = await chatManager.joinChat(offerInput);
        base64Payload = payload;
        renderQR(payload);
    }

    async function renderQR(data: string) {
        setTimeout(async () => {
            if (qrCanvas) {
                try {
                    await QRCode.toCanvas(qrCanvas, data, {
                        width: 250,
                        margin: 2,
                        color: {
                            dark: "#0f172a",
                            light: "#ffffff",
                        },
                    });
                } catch (err) {
                    console.error("QR code err", err);
                }
            }
        }, 100);
    }

    function copyPayload() {
        navigator.clipboard.writeText(base64Payload);
        copySuccess = true;
        setTimeout(() => (copySuccess = false), 2000);
    }
</script>

<svelte:head>
    <title>Join Chat | Powerbored</title>
</svelte:head>

<div
    class="w-full max-w-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl rounded-[3rem] shadow-2xl border border-white/50 dark:border-slate-700/50 p-6 md:p-12 relative overflow-hidden mt-10"
>
    <div
        class="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"
    ></div>

    <div class="relative z-10 space-y-8">
        <div class="flex items-center gap-4">
            <a
                href="/chat"
                class="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400"
            >
                <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 19l-7-7 7-7"
                    ></path></svg
                >
            </a>
            <h1
                class="text-3xl font-black text-slate-900 dark:text-white tracking-tighter"
            >
                Join a Chat
            </h1>
        </div>

        <!-- Before base64Payload generates -->
        {#if !base64Payload}
            <div
                class="bg-white dark:bg-slate-950 p-6 sm:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-inner space-y-6"
            >
                <div>
                    <h3
                        class="font-bold text-slate-900 dark:text-white mb-2 text-lg"
                    >
                        1. Paste Connection Link/Code
                    </h3>
                    <p class="text-sm text-slate-500 mb-6">
                        Enter the invite code from the host.
                    </p>
                    <textarea
                        bind:value={offerInput}
                        placeholder="Paste invite code..."
                        class="w-full h-32 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-mono text-slate-600 outline-none focus:border-blue-500 resize-none"
                    ></textarea>
                </div>

                <!-- Optional Name for Joiner (Host sets default but Joiner can name it locally too) -->
                <div>
                    <label
                        for="chatName"
                        class="font-bold text-slate-900 dark:text-white text-sm mb-2 block"
                        >Optional: Save As</label
                    >
                    <input
                        id="chatName"
                        type="text"
                        bind:value={chatName}
                        placeholder="Name this chat connection..."
                        class="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl px-5 py-3 outline-none"
                    />
                </div>

                <button
                    disabled={!offerInput.trim()}
                    on:click={handleJoin}
                    class="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-sm rounded-2xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                    Generate Response
                </button>
            </div>
            <!-- During or After Generating Answer -->
        {:else if $connectionState === "gathering"}
            <div
                class="bg-white dark:bg-slate-950 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-inner text-center text-slate-500 font-bold flex flex-col items-center gap-4"
            >
                <span class="animate-spin text-4xl">⏳</span>
                Generating connection...
            </div>
        {:else}
            <div
                class="bg-white dark:bg-slate-950 p-6 sm:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-inner space-y-6"
            >
                <div>
                    <h3
                        class="font-bold text-slate-900 dark:text-white mb-2 text-lg"
                    >
                        2. Send Response to Host
                    </h3>
                    <p class="text-sm text-slate-500 mb-6">
                        Have the host scan this QR code or send them the
                        response code.
                    </p>

                    <div class="flex flex-col sm:flex-row items-center gap-6">
                        <div
                            class="bg-white p-2 inline-block rounded-2xl shadow-md border border-slate-100 dark:border-slate-800"
                        >
                            <canvas bind:this={qrCanvas}></canvas>
                        </div>
                        <div class="flex-1 w-full space-y-2">
                            <!-- Raw payload shown since Join usually sends it back as text -->
                            <textarea
                                readonly
                                value={base64Payload}
                                class="w-full h-32 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-slate-500 outline-none resize-none"
                            ></textarea>
                            <button
                                on:click={copyPayload}
                                class="w-full px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors whitespace-nowrap"
                            >
                                {copySuccess
                                    ? "Copied Response!"
                                    : "Copy Response Code"}
                            </button>
                        </div>
                    </div>
                </div>
                {#if $connectionState === "connecting"}
                    <div
                        class="text-center pt-4 border-t border-slate-200 dark:border-slate-800"
                    >
                        <p
                            class="text-blue-500 dark:text-blue-400 font-bold animate-pulse"
                        >
                            Waiting for host to accept...
                        </p>
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>
