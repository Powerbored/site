<script lang="ts">
    import {
        chatHistory,
        deleteChatHistory,
        renameChatHistory,
    } from "$lib/chatStore";

    let editingId: string | null = null;
    let editingName = "";

    function startEdit(id: string, currentName: string) {
        editingId = id;
        editingName = currentName;
    }

    function saveEdit(id: string) {
        if (editingName.trim()) {
            renameChatHistory(id, editingName.trim());
        }
        editingId = null;
    }

    function cancelEdit() {
        editingId = null;
    }

    function handleKeydown(e: KeyboardEvent, id: string) {
        if (e.key === "Enter") saveEdit(id);
        if (e.key === "Escape") cancelEdit();
    }

    function formatDate(ts: number) {
        return new Date(ts).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    }
</script>

<svelte:head>
    <title>Chat History | Powerbored</title>
</svelte:head>

<div
    class="w-full max-w-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl rounded-[3rem] shadow-2xl border border-white/50 dark:border-slate-700/50 p-6 md:p-12 relative overflow-hidden mt-10"
>
    <div
        class="absolute -top-40 pl-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"
    ></div>

    <div class="relative z-10 space-y-8">
        <div class="flex items-center gap-4">
            <a
                href="/chat"
                aria-label="Back to Chat Hub"
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
                Chat History
            </h1>
        </div>

        <div
            class="bg-white dark:bg-slate-950 p-6 sm:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-inner space-y-4"
        >
            {#if $chatHistory.length === 0}
                <div class="p-8 text-center text-slate-400 font-medium">
                    No chat history found.
                </div>
            {:else}
                <div class="space-y-4">
                    {#each $chatHistory as chat (chat.id)}
                        <div
                            class="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl gap-4"
                        >
                            <div class="flex-1 w-full flex items-center gap-3">
                                <div
                                    class="w-10 h-10 rounded-xl bg-{chat.role ===
                                    'host'
                                        ? 'blue'
                                        : 'emerald'}-100 dark:bg-{chat.role ===
                                    'host'
                                        ? 'blue'
                                        : 'emerald'}-900/40 text-{chat.role ===
                                    'host'
                                        ? 'blue'
                                        : 'emerald'}-600 dark:text-{chat.role ===
                                    'host'
                                        ? 'blue'
                                        : 'emerald'}-400 flex items-center justify-center flex-shrink-0"
                                    title="Role: {chat.role}"
                                >
                                    {#if chat.role === "host"}
                                        <svg
                                            class="w-5 h-5"
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
                                    {:else}
                                        <svg
                                            class="w-5 h-5"
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
                                    {/if}
                                </div>
                                <div class="flex-1 min-w-0">
                                    {#if editingId === chat.id}
                                        <input
                                            type="text"
                                            bind:value={editingName}
                                            on:blur={() => saveEdit(chat.id)}
                                            on:keydown={(e) =>
                                                handleKeydown(e, chat.id)}
                                            class="w-full bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 px-3 py-1 rounded outline-none focus:border-blue-500 font-bold text-slate-900 dark:text-white mb-1"
                                        />
                                    {:else}
                                        <button
                                            on:click={() =>
                                                startEdit(chat.id, chat.name)}
                                            class="text-left font-bold text-slate-900 dark:text-white truncate cursor-text hover:text-blue-500 transition-colors"
                                            title="Click to rename"
                                        >
                                            {chat.name}
                                        </button>
                                    {/if}
                                    <p class="text-xs text-slate-500">
                                        {formatDate(chat.createdAt)}
                                    </p>
                                </div>
                            </div>

                            <div
                                class="flex items-center gap-2 w-full sm:w-auto"
                            >
                                <a
                                    href="/chat/host?name={encodeURIComponent(
                                        chat.name,
                                    )}"
                                    class="flex-1 sm:flex-none px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl transition-colors text-center whitespace-nowrap"
                                >
                                    Rehost
                                </a>
                                <a
                                    href="/chat/join?name={encodeURIComponent(
                                        chat.name,
                                    )}"
                                    class="flex-1 sm:flex-none px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl transition-colors text-center whitespace-nowrap"
                                >
                                    Rejoin
                                </a>
                                <button
                                    on:click={() => deleteChatHistory(chat.id)}
                                    class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors flex-shrink-0"
                                    title="Delete"
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
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        ></path></svg
                                    >
                                </button>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
</div>
