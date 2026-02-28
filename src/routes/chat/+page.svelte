<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { WebRTCManager, type ChatMessage } from "$lib/webrtc";
    import QRCode from "qrcode";

    let manager = new WebRTCManager();
    const { connectionState, messages } = manager;

    let setupMode: "choose" | "host" | "join" = "choose";
    let base64Payload = "";
    let generatedUrl = "";

    let answerInput = "";
    let offerInput = "";

    let qrCanvas: HTMLCanvasElement;

    let chatInput = "";
    let fileInputRef: HTMLInputElement;

    // To auto-scroll chat
    let chatArea: HTMLDivElement;

    onMount(() => {
        // Check if URL has #offer=... or #answer=...
        const hash = window.location.hash;
        if (hash.startsWith("#offer=")) {
            setupMode = "join";
            offerInput = hash.replace("#offer=", "");
            handleJoin();
        } else if (hash.startsWith("#answer=")) {
            // we probably wouldn't link to host directly with answer, host just pastes it
            // but just in case
            answerInput = hash.replace("#answer=", "");
            handleAcceptAnswer();
        }
    });

    onDestroy(() => {
        manager.cleanup();
    });

    $: if ($messages && chatArea) {
        setTimeout(() => {
            chatArea.scrollTop = chatArea.scrollHeight;
        }, 50);
    }

    async function handleHost() {
        setupMode = "host";
        const payload = await manager.hostChat();
        base64Payload = payload;
        generatedUrl = `${window.location.origin}/chat#offer=${payload}`;
        renderQR(generatedUrl);
    }

    async function handleJoin() {
        if (!offerInput) return;
        const payload = await manager.joinChat(offerInput);
        base64Payload = payload;
        generatedUrl = `${window.location.origin}/chat#answer=${payload}`;
        renderQR(generatedUrl);
    }

    async function handleAcceptAnswer() {
        if (!answerInput) return;
        await manager.acceptAnswer(answerInput);
    }

    async function renderQR(data: string) {
        // wait for bind
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

    let copySuccess = false;
    function copyLink() {
        navigator.clipboard.writeText(generatedUrl);
        copySuccess = true;
        setTimeout(() => (copySuccess = false), 2000);
    }

    function copyPayload() {
        navigator.clipboard.writeText(base64Payload);
        copySuccess = true;
        setTimeout(() => (copySuccess = false), 2000);
    }

    function sendMessage() {
        if (!chatInput.trim()) return;
        manager.sendTextMessage(chatInput);
        chatInput = "";
    }

    function triggerFileSelect() {
        fileInputRef.click();
    }

    async function handleFileSelect(e: Event) {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
            const file = target.files[0];
            await manager.sendFile(file);
            target.value = ""; // reset
        }
    }

    function formatTime(ts: number) {
        return new Date(ts).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    }
</script>

<svelte:head>
    <title>Serverless P2P Chat | Powerbored</title>
</svelte:head>

<div
    class="min-h-[85vh] p-4 flex flex-col items-center max-w-5xl mx-auto w-full relative"
>
    {#if $connectionState === "connected"}
        <!-- CHAT UI -->
        <div
            class="w-full flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500"
        >
            <!-- Header -->
            <div
                class="px-6 py-4 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-950/50 flex items-center justify-between"
            >
                <div>
                    <h2
                        class="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2"
                    >
                        <span
                            class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"
                        ></span>
                        Secure P2P Chat
                    </h2>
                    <p class="text-xs text-slate-500 font-medium">
                        Direct connection • No servers involved
                    </p>
                </div>
            </div>

            <!-- Messages List -->
            <div
                bind:this={chatArea}
                class="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col scroll-smooth"
            >
                {#if $messages.length === 0}
                    <div
                        class="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-4 opacity-70"
                    >
                        <div class="text-5xl">👋</div>
                        <p class="font-medium text-lg">
                            Connection established! Say hi.
                        </p>
                    </div>
                {/if}

                {#each $messages as msg (msg.id)}
                    <div
                        class="flex flex-col max-w-[80%] {msg.sender === 'me'
                            ? 'self-end items-end'
                            : 'self-start items-start'} animate-in slide-in-from-bottom-2 fade-in duration-300"
                    >
                        {#if msg.text}
                            <div
                                class="px-5 py-3 rounded-2xl text-[15px] {msg.sender ===
                                'me'
                                    ? 'bg-blue-600 text-white rounded-br-sm shadow-md shadow-blue-500/20'
                                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-sm border border-slate-100 dark:border-slate-700 shadow-sm'}"
                            >
                                {msg.text}
                            </div>
                        {:else if msg.fileUrl}
                            <div
                                class="px-5 py-4 rounded-2xl {msg.sender ===
                                'me'
                                    ? 'bg-blue-600 text-white rounded-br-sm'
                                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-sm border border-slate-100 dark:border-slate-700'}"
                            >
                                <div class="flex items-center gap-4">
                                    <div
                                        class="w-10 h-10 rounded-full bg-black/10 dark:bg-black/30 flex items-center justify-center text-xl"
                                    >
                                        📄
                                    </div>
                                    <div class="flex flex-col">
                                        <span
                                            class="font-bold text-sm line-clamp-1 break-all"
                                            >{msg.fileName}</span
                                        >
                                        <a
                                            href={msg.fileUrl}
                                            download={msg.fileName}
                                            class="text-xs font-medium underline opacity-80 hover:opacity-100 mt-1 cursor-pointer"
                                        >
                                            Download
                                        </a>
                                    </div>
                                </div>
                            </div>
                        {/if}
                        <span
                            class="text-[11px] text-slate-400 mt-1 font-medium px-1"
                            >{formatTime(msg.timestamp)}</span
                        >
                    </div>
                {/each}
            </div>

            <!-- Input Area -->
            <div
                class="p-4 bg-white/50 dark:bg-slate-950/50 border-t border-slate-200/50 dark:border-slate-800/50 pb-6 px-6"
            >
                <form
                    on:submit|preventDefault={sendMessage}
                    class="flex items-end gap-2 relative"
                >
                    <button
                        type="button"
                        aria-label="Attach File"
                        on:click={triggerFileSelect}
                        class="p-3.5 text-slate-400 hover:text-blue-500 dark:text-slate-500 dark:hover:text-blue-400 transition-colors bg-slate-100 dark:bg-slate-900 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    >
                        <svg
                            class="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            ><path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2.5"
                                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                            ></path></svg
                        >
                    </button>
                    <input
                        type="file"
                        bind:this={fileInputRef}
                        on:change={handleFileSelect}
                        class="hidden"
                    />

                    <input
                        type="text"
                        bind:value={chatInput}
                        placeholder="Type a message..."
                        class="flex-1 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-2xl px-5 py-3.5 text-[15px] outline-none placeholder:text-slate-400"
                    />

                    <button
                        type="submit"
                        disabled={!chatInput.trim()}
                        class="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-black rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    {:else}
        <!-- SETUP UI -->
        <div
            class="w-full max-w-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl rounded-[3rem] shadow-2xl border border-white/50 dark:border-slate-700/50 p-6 md:p-12 relative overflow-hidden mt-10"
        >
            <!-- Blobs -->
            <div
                class="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"
            ></div>
            <div
                class="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"
            ></div>

            <div class="relative z-10 space-y-8">
                <div class="text-center space-y-4">
                    <h1
                        class="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter"
                    >
                        Serverless Chat
                    </h1>
                    <p class="text-slate-500 dark:text-slate-400 font-medium">
                        Connect directly peer-to-peer. Completely private.
                    </p>
                </div>

                {#if setupMode === "choose"}
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
                        <button
                            on:click={handleHost}
                            class="flex flex-col items-center justify-center p-8 bg-slate-50 hover:bg-blue-50 border-2 border-slate-200 hover:border-blue-500 dark:bg-slate-950 dark:hover:bg-slate-800 dark:border-slate-800 dark:hover:border-blue-500 rounded-3xl transition-all group scale-100 hover:scale-[1.02] shadow-sm hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer"
                        >
                            <div
                                class="w-16 h-16 bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                            >
                                <svg
                                    class="w-8 h-8"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    ><path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M12 4v16m8-8H4"
                                    ></path></svg
                                >
                            </div>
                            <h3
                                class="text-xl font-black text-slate-900 dark:text-white mb-2"
                            >
                                Host Chat
                            </h3>
                            <p class="text-sm text-center text-slate-500">
                                Create a new connection and invite someone.
                            </p>
                        </button>

                        <button
                            on:click={() => (setupMode = "join")}
                            class="flex flex-col items-center justify-center p-8 bg-slate-50 hover:bg-emerald-50 border-2 border-slate-200 hover:border-emerald-500 dark:bg-slate-950 dark:hover:bg-slate-800 dark:border-slate-800 dark:hover:border-emerald-500 rounded-3xl transition-all group scale-100 hover:scale-[1.02] shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 cursor-pointer"
                        >
                            <div
                                class="w-16 h-16 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                            >
                                <svg
                                    class="w-8 h-8"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    ><path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                    ></path></svg
                                >
                            </div>
                            <h3
                                class="text-xl font-black text-slate-900 dark:text-white mb-2"
                            >
                                Join Chat
                            </h3>
                            <p class="text-sm text-center text-slate-500">
                                I have an invite link or connection code.
                            </p>
                        </button>
                    </div>
                {/if}

                {#if setupMode === "host"}
                    <div
                        class="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4"
                    >
                        {#if $connectionState === "gathering"}
                            <div
                                class="p-8 text-center text-slate-500 font-bold flex flex-col items-center gap-4"
                            >
                                <span class="animate-spin text-4xl">⏳</span>
                                Generating connection...
                            </div>
                        {:else}
                            <div
                                class="bg-white dark:bg-slate-950 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-inner space-y-6"
                            >
                                <div class="text-center">
                                    <h3
                                        class="font-bold text-slate-900 dark:text-white mb-2 text-lg"
                                    >
                                        1. Send Invitaion to Friend
                                    </h3>
                                    <p class="text-sm text-slate-500 mb-6 px-4">
                                        Have them scan this QR code or send them
                                        the link.
                                    </p>

                                    <div
                                        class="bg-white p-4 inline-block rounded-3xl shadow-md border border-slate-100 dark:border-slate-800 mb-4"
                                    >
                                        <canvas bind:this={qrCanvas}></canvas>
                                    </div>

                                    <div
                                        class="flex gap-2 w-full max-w-md mx-auto"
                                    >
                                        <input
                                            type="text"
                                            readonly
                                            value={generatedUrl}
                                            class="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-500 outline-none"
                                        />
                                        <button
                                            on:click={copyLink}
                                            class="px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors whitespace-nowrap"
                                        >
                                            {copySuccess ? "Copied!" : "Copy"}
                                        </button>
                                    </div>
                                </div>

                                <div
                                    class="border-t border-slate-200 dark:border-slate-800 pt-6"
                                >
                                    <h3
                                        class="font-bold text-slate-900 dark:text-white mb-4 text-center"
                                    >
                                        2. Await their Answer
                                    </h3>
                                    <div class="flex flex-col gap-3">
                                        <textarea
                                            bind:value={answerInput}
                                            placeholder="Paste their Answer payload here..."
                                            class="w-full h-24 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-mono text-slate-600 outline-none focus:border-emerald-500 resize-none"
                                        ></textarea>
                                        <button
                                            disabled={!answerInput.trim()}
                                            on:click={handleAcceptAnswer}
                                            class="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-sm rounded-2xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                                        >
                                            Connect
                                        </button>
                                    </div>
                                </div>
                            </div>
                        {/if}
                    </div>
                {/if}

                {#if setupMode === "join"}
                    <div
                        class="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4"
                    >
                        {#if !base64Payload}
                            <div
                                class="bg-white dark:bg-slate-950 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-inner text-center"
                            >
                                <h3
                                    class="font-bold text-slate-900 dark:text-white mb-2 text-lg"
                                >
                                    1. Enter Invite Code
                                </h3>
                                <p class="text-sm text-slate-500 mb-6">
                                    Paste the Host's offer payload below.
                                </p>

                                <textarea
                                    bind:value={offerInput}
                                    placeholder="Paste Offer payload..."
                                    class="w-full h-24 mb-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-slate-600 outline-none focus:border-blue-500 resize-none"
                                ></textarea>

                                <button
                                    disabled={!offerInput.trim()}
                                    on:click={handleJoin}
                                    class="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-sm rounded-2xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                >
                                    Generate Connection Answer
                                </button>
                            </div>
                        {:else if $connectionState === "gathering"}
                            <div
                                class="p-8 text-center text-slate-500 font-bold flex flex-col items-center gap-4"
                            >
                                <span class="animate-spin text-4xl">⏳</span>
                                Generating connection...
                            </div>
                        {:else}
                            <div
                                class="bg-white dark:bg-slate-950 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-inner text-center"
                            >
                                <h3
                                    class="font-bold text-slate-900 dark:text-white mb-2 text-lg"
                                >
                                    2. Send Answer to Host
                                </h3>
                                <p class="text-sm text-slate-500 mb-6 px-4">
                                    Have the host scan this QR code or send them
                                    the payload text.
                                </p>

                                <div
                                    class="bg-white p-4 inline-block rounded-3xl shadow-md border border-slate-100 dark:border-slate-800 mb-4"
                                >
                                    <canvas bind:this={qrCanvas}></canvas>
                                </div>

                                <div
                                    class="flex flex-col gap-2 w-full max-w-md mx-auto"
                                >
                                    <!-- we provide the raw base64 payload here instead of the link since host UI asks for the 'Answer payload' direct copy-paste usually if they don't scan QR-->
                                    <button
                                        on:click={copyPayload}
                                        class="w-full px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                                    >
                                        {copySuccess
                                            ? "Copied Payload!"
                                            : "Copy Answer Payload"}
                                    </button>
                                </div>
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>
