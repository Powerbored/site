<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { chatManager, activeChatName } from "$lib/chatStore";
    import Icon from "$lib/components/Icon.svelte";

    const { connectionState, messages } = chatManager;

    let chatInput = "";
    let fileInputRef: HTMLInputElement;

    // To auto-scroll chat
    let chatArea: HTMLDivElement;

    $: if ($messages && chatArea) {
        setTimeout(() => {
            chatArea.scrollTop = chatArea.scrollHeight;
        }, 50);
    }

    function sendMessage() {
        if (!chatInput.trim()) return;
        chatManager.sendTextMessage(chatInput);
        chatInput = "";
    }

    function triggerFileSelect() {
        fileInputRef.click();
    }

    async function handleFileSelect(e: Event) {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
            const file = target.files[0];
            await chatManager.sendFile(file);
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

{#if $activeChatName && $connectionState !== "disconnected"}
    <!-- CHAT UI -->
    <div
        class="w-full flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500 h-[85vh] m-4"
    >
        <!-- Header -->
        <div
            class="px-6 py-4 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-950/50 flex flex-col items-center justify-between sm:flex-row relative"
        >
            <div class="absolute left-6">
                <!-- Back Link -->
                <a
                    href="/chat"
                    class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center gap-2 text-sm font-bold"
                >
                    &larr; Leave
                </a>
            </div>

            <div class="text-center w-full mt-8 sm:mt-0">
                <h2
                    class="text-xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-2"
                >
                    <span
                        class="w-2.5 h-2.5 rounded-full {$connectionState ===
                        'connected'
                            ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]'
                            : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-pulse'}"
                    ></span>
                    {$activeChatName}
                </h2>
                <p class="text-xs text-slate-500 font-medium">
                    {$connectionState === "connected"
                        ? "Direct connection • No servers involved"
                        : "Connecting peers..."}
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
                        {#if $connectionState === "connected"}
                            Connection established! Say hi.
                        {:else}
                            Waiting for connection...
                        {/if}
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
                            class="px-5 py-4 rounded-2xl {msg.sender === 'me'
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
                    title="Attach File"
                    on:click={triggerFileSelect}
                    disabled={$connectionState !== "connected"}
                    class="p-3.5 text-slate-400 hover:text-blue-500 dark:text-slate-500 dark:hover:text-blue-400 transition-colors bg-slate-100 dark:bg-slate-900 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    disabled={$connectionState !== "connected"}
                    placeholder={$connectionState === "connected"
                        ? "Type a message..."
                        : "Connecting..."}
                    class="flex-1 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-2xl px-5 py-3.5 text-[15px] outline-none placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                />

                <button
                    type="submit"
                    disabled={!chatInput.trim() ||
                        $connectionState !== "connected"}
                    class="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-black rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                >
                    Send
                </button>
            </form>
        </div>
    </div>
{:else}
    <!-- HUB UI -->
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
                <p
                    class="text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto"
                >
                    Connect directly peer-to-peer. Choose an option to get
                    started or view your history.
                </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
                <!-- Host Card -->
                <a
                    href="/chat/host"
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
                </a>

                <!-- Join Card -->
                <a
                    href="/chat/join"
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
                </a>

                <!-- History Card -->
                <a
                    href="/chat/history"
                    class="md:col-span-2 flex flex-col md:flex-row items-center justify-center p-6 bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 hover:border-slate-300 dark:bg-slate-950 dark:hover:bg-slate-800 dark:border-slate-800 dark:hover:border-slate-600 rounded-3xl transition-all group scale-100 hover:scale-[1.02] shadow-sm hover:shadow-xl cursor-pointer gap-4 text-left"
                >
                    <div
                        class="w-14 h-14 bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0"
                    >
                        <!-- Reusing clock_filled icon basically, or a clock svg -->
                        <svg
                            class="w-7 h-7"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            ></path>
                        </svg>
                    </div>
                    <div class="flex-1 text-center md:text-left">
                        <h3
                            class="text-lg font-black text-slate-900 dark:text-white mb-1"
                        >
                            History
                        </h3>
                        <p class="text-sm text-slate-500">
                            Rejoin past chats and manage your chat sessions.
                        </p>
                    </div>
                    <div
                        class="hidden md:flex bg-white dark:bg-slate-900 rounded-full p-2 border border-slate-200 dark:border-slate-700 shadow-sm opacity-50 group-hover:opacity-100 transition-opacity"
                    >
                        <svg
                            class="w-5 h-5 text-slate-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                            ><path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2.5"
                                d="M9 5l7 7-7 7"
                            ></path></svg
                        >
                    </div>
                </a>
            </div>
        </div>
    </div>
{/if}
