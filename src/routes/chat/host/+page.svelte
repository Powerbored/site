<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import QrGenerator from "$lib/components/QrGenerator.svelte";
    import QrReader from "$lib/components/QrReader.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import { goto } from "$app/navigation";
    import {
        chatManager,
        activeChatName,
        saveChatToHistory,
    } from "$lib/chatStore";

    import { page } from "$app/stores";

    const { connectionState } = chatManager;

    let chatName =
        "Chat " +
        new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });

    onMount(() => {
        const nameParam = $page.url.searchParams.get("name");
        if (nameParam) chatName = nameParam;
    });

    let base64Payload = "";
    let generatedUrl = "";
    let answerInput = "";
    let copySuccess = false;

    let hasStartedHosting = false;
    let qrReaderActive = false;

    // Optional: Auto-start hosting immediately or let them click "Start"
    // Let's implement an explicit start so they can name it first.

    onDestroy(() => {
        // If they navigate away before connecting, cleanup
        if ($connectionState !== "connected") {
            chatManager.cleanup();
        }
    });

    $: if ($connectionState === "connected") {
        saveChatToHistory(chatName, "host");
        activeChatName.set(chatName);
        goto(`/chat#${encodeURIComponent(chatName)}`);
    }

    async function handleHost() {
        if (!chatName.trim()) return;
        hasStartedHosting = true;
        const payload = await chatManager.hostChat();
        base64Payload = payload;
        generatedUrl = `${window.location.origin}/chat/join#offer=${payload}`;
    }

    async function handleAcceptAnswer() {
        if (!answerInput) return;
        await chatManager.acceptAnswer(answerInput);
    }

    function onScanSuccess(decodedText: string) {
        answerInput = decodedText;
        qrReaderActive = false; // Turn off scanner once we get a code
    }

    function copyLink() {
        navigator.clipboard.writeText(generatedUrl);
        copySuccess = true;
        setTimeout(() => (copySuccess = false), 2000);
    }
</script>

<svelte:head>
    <title>Host Chat | Powerbored</title>
</svelte:head>

<div
    class="w-full max-w-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl rounded-[3rem] shadow-2xl border border-white/50 dark:border-slate-700/50 p-6 md:p-12 relative overflow-hidden mt-10"
>
    <div
        class="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"
    ></div>

    <div class="relative z-10 space-y-8">
        <div class="flex items-center gap-4">
            <a
                href="/chat"
                aria-label="Back to Chat Hub"
                class="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400"
            >
                <Icon name="chevron-left" class="w-5 h-5" />
            </a>
            <h1
                class="text-3xl font-black text-slate-900 dark:text-white tracking-tighter"
            >
                Host a Chat
            </h1>
        </div>

        <div
            class="bg-white dark:bg-slate-950 p-6 sm:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-inner space-y-8"
        >
            <!-- 1. Name -->
            <div class="space-y-3">
                <label
                    for="chatName"
                    class="font-bold text-slate-900 dark:text-white text-lg"
                    >1. Name Your Chat</label
                >
                <input
                    id="chatName"
                    type="text"
                    bind:value={chatName}
                    placeholder="Enter a chat name..."
                    disabled={hasStartedHosting}
                    class="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl px-5 py-3.5 text-[15px] outline-none disabled:opacity-50"
                />
            </div>

            <!-- Start button if not started -->
            {#if !hasStartedHosting}
                <button
                    onclick={handleHost}
                    disabled={!chatName.trim()}
                    class="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-sm rounded-2xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                    Generate Secure Link
                </button>
            {/if}

            <!-- 2. Share & 3. Connect (Visible after hosting started) -->
            {#if hasStartedHosting}
                {#if $connectionState === "gathering"}
                    <div
                        class="p-8 text-center text-slate-500 font-bold flex flex-col items-center gap-4 border-t border-slate-200 dark:border-slate-800 pt-8 mt-8"
                    >
                        <span class="animate-spin text-4xl">⏳</span>
                        Generating connection...
                    </div>
                {:else}
                    <div
                        class="animate-in fade-in slide-in-from-top-4 space-y-8 border-t border-slate-200 dark:border-slate-800 pt-8 mt-8"
                    >
                        <!-- 2. Share -->
                        <div class="space-y-4">
                            <h3
                                class="font-bold text-slate-900 dark:text-white text-lg"
                            >
                                2. Send Invitation
                            </h3>
                            <p class="text-sm text-slate-500">
                                Have them scan this QR code or send them the
                                link.
                            </p>

                            <div
                                class="flex flex-col items-center justify-center bg-white p-6 rounded-2xl shadow-[0_0_40px_rgba(8,145,178,0.2)] dark:shadow-[0_0_40px_rgba(8,145,178,0.15)] transition-all"
                            >
                                <QrGenerator value={generatedUrl} />
                            </div>
                            <div
                                class="flex flex-col sm:flex-row items-center gap-6"
                            >
                                <input
                                    type="text"
                                    readonly
                                    value={generatedUrl}
                                    class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-500 outline-none"
                                />
                                <button
                                    onclick={copyLink}
                                    class="w-40 px-4 py-3 bg-slate-900 dark:bg-white {copySuccess
                                        ? 'text-emerald-600'
                                        : 'text-white dark:text-slate-900'} font-bold text-sm rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors whitespace-nowrap"
                                >
                                    {copySuccess ? "Copied!" : "Copy Link"}
                                </button>
                            </div>
                        </div>

                        <!-- 3. Connect -->
                        <div class="space-y-4 pt-4">
                            <h3
                                class="font-bold text-slate-900 dark:text-white text-lg"
                            >
                                3. Confirm Connection
                            </h3>
                            <p class="text-sm text-slate-500">
                                When they join, paste their response code here
                                or scan their QR response.
                            </p>

                            <div class="flex items-center gap-4">
                                <textarea
                                    bind:value={answerInput}
                                    placeholder="Paste response code here..."
                                    class="flex-1 h-24 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-mono text-slate-600 outline-none focus:border-emerald-500 resize-none"
                                ></textarea>

                                <button
                                    onclick={() =>
                                        (qrReaderActive = !qrReaderActive)}
                                    class="h-24 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-2xl transition-colors flex flex-col items-center justify-center gap-2 font-bold text-xs"
                                >
                                    <Icon name="qr-scan" class="w-6 h-6" />
                                    {qrReaderActive ? "Cancel Scan" : "Scan QR"}
                                </button>
                            </div>

                            {#if qrReaderActive}
                                <div
                                    class="w-full mt-4 animate-in fade-in slide-in-from-top-4"
                                >
                                    <QrReader {onScanSuccess} />
                                </div>
                            {/if}

                            <button
                                disabled={!answerInput.trim() ||
                                    $connectionState === "connecting"}
                                onclick={handleAcceptAnswer}
                                class="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-sm rounded-2xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                            >
                                {$connectionState === "connecting"
                                    ? "Connecting..."
                                    : "Connect"}
                            </button>
                        </div>
                    </div>
                {/if}
            {/if}
        </div>
    </div>
</div>
