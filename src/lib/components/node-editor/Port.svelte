<script lang="ts">
    import { createEventDispatcher } from "svelte";
    
    export let id: string;
    export let direction: "in" | "out";
    
    const dispatch = createEventDispatcher();
    
    function handlePointerDown(e: PointerEvent) {
        // Prevent event from bubbling up to drag the whole node
        e.stopPropagation();
        dispatch("portPointerDown", { e, id, direction });
    }

    function handlePointerUp(e: PointerEvent) {
        e.stopPropagation();
        dispatch("portPointerUp", { e, id, direction });
    }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div 
    class="port port-{direction}" 
    on:pointerdown={handlePointerDown}
    on:pointerup={handlePointerUp}
    title={id}
></div>

<style>
    .port {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background-color: var(--port-bg, #333);
        border: 2px solid var(--port-border, #4ade80);
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        cursor: crosshair;
        z-index: 10;
        transition: transform 0.1s ease-in-out, box-shadow 0.1s ease-in-out;
    }

    .port:hover {
        transform: translateY(-50%) scale(1.3);
        box-shadow: 0 0 8px var(--port-border, #4ade80);
    }

    .port-in {
        left: -7px;
    }
    
    .port-out {
        right: -7px;
    }
</style>
