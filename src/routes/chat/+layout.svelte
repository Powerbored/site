<script lang="ts">
    import { page } from "$app/state";
    import { activeChatName, chatManager } from "$lib/chatStore";
    import { onMount, onDestroy } from "svelte";

    const { connectionState } = chatManager;

    let inActiveChat = false;

    $: {
        // We're essentially 'in' an active chat if we are at /chat and we have a hash name, AND we are connected or connecting
        // To simplify, if activeChatName has a value, we consider it "active chat mode"
        inActiveChat =
            $activeChatName !== null && $connectionState === "connected";
    }

    onMount(() => {
        const hash = window.location.hash;
        if (
            hash &&
            hash.length > 1 &&
            !hash.startsWith("#offer=") &&
            !hash.startsWith("#answer=")
        ) {
            activeChatName.set(decodeURIComponent(hash.substring(1)));
        } else {
            activeChatName.set(null);
        }

        // Keep it sync if hash changes manually
        window.addEventListener("hashchange", () => {
            const h = window.location.hash;
            if (
                h &&
                h.length > 1 &&
                !h.startsWith("#offer=") &&
                !h.startsWith("#answer=")
            ) {
                activeChatName.set(decodeURIComponent(h.substring(1)));
            } else {
                activeChatName.set(null);
            }
        });
    });
</script>

<div
    class={inActiveChat
        ? ""
        : "min-h-[85vh] p-4 flex flex-col items-center max-w-5xl mx-auto w-full relative"}
>
    <slot />
</div>
