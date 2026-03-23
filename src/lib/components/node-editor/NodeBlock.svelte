<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import Port from "./Port.svelte";
    import type { NodeType } from "../../nodeStore";
    import { updateNodeValue } from "../../nodeStore";
    
    export let id: string;
    export let type: NodeType;
    export let x: number;
    export let y: number;
    export let value: number;

    const dispatch = createEventDispatcher();

    // Node colors and port config based on type
    let title = "";
    let colorVar = "";
    let inputs = 0;
    let outputs = 0;

    $: {
        if (type === "number-input") {
            title = "Number";
            colorVar = "#10b981"; // emerald
            inputs = 0;
            outputs = 1;
        } else if (type === "logic-and") {
            title = "AND Gate";
            colorVar = "#06b6d4"; // cyan
            inputs = 2;
            outputs = 1;
        } else if (type === "logic-or") {
            title = "OR Gate";
            colorVar = "#8b5cf6"; // violet
            inputs = 2;
            outputs = 1;
        } else if (type === "logic-not") {
            title = "NOT Gate";
            colorVar = "#f59e0b"; // amber
            inputs = 1;
            outputs = 1;
        } else if (type === "output") {
            title = "Output";
            colorVar = "#f43f5e"; // rose
            inputs = 1;
            outputs = 0;
        }
    }

    // Dragging state
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialNodeX = 0;
    let initialNodeY = 0;

    function handlePointerDown(e: PointerEvent) {
        if ((e.target as HTMLElement).tagName.toLowerCase() === 'input') return;
        
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialNodeX = x;
        initialNodeY = y;
        
        // Capture pointer to track dragging outside the element
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        dispatch("nodedragstart", { id });
        e.stopPropagation();
    }

    function handlePointerMove(e: PointerEvent) {
        if (!isDragging) return;
        
        // Let the canvas handle scaling if needed, but simple diff works if not scaled 
        // We'll dispatch to let the canvas apply its zoom inverse if desired, 
        // but for now simple delta is dispatched.
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        dispatch("nodedragmove", {
            id,
            dx,
            dy,
            initialX: initialNodeX,
            initialY: initialNodeY
        });
        e.stopPropagation();
    }

    function handlePointerUp(e: PointerEvent) {
        if (isDragging) {
            isDragging = false;
            (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
            dispatch("nodedragend", { id });
            e.stopPropagation();
        }
    }

    function onPortDown(e: CustomEvent) {
        dispatch("portPointerDown", e.detail);
    }

    function onPortUp(e: CustomEvent) {
        dispatch("portPointerUp", e.detail);
    }

    function handleInput(e: Event) {
        const val = parseFloat((e.target as HTMLInputElement).value) || 0;
        updateNodeValue(id, val);
    }
    
    function handleRemove() {
        dispatch("removeNode", { id });
    }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div 
    class="node-block"
    style="transform: translate({x}px, {y}px); --node-color: {colorVar};"
    on:pointerdown={handlePointerDown}
    on:pointermove={handlePointerMove}
    on:pointerup={handlePointerUp}
    on:pointercancel={handlePointerUp}
>
    <!-- Title bar -->
    <div class="node-header">
        <span class="node-title">{title}</span>
        <button class="node-close" on:click={handleRemove} on:pointerdown|stopPropagation title="Delete Node">×</button>
    </div>

    <!-- Body content -->
    <div class="node-body">
        {#if type === "number-input"}
            <input type="number" class="node-input" value={value} on:input={handleInput} />
        {:else if type === "output"}
            <div class="node-result">{value}</div>
        {:else}
            <div class="node-logic-label">
                {#if type === "logic-and"}AND
                {:else if type === "logic-or"}OR
                {:else if type === "logic-not"}NOT
                {/if}
            </div>
        {/if}
    </div>

    <!-- Ports -->
    {#if inputs > 0}
        <div class="ports-container in-ports">
            {#each Array(inputs) as _, i}
                <div class="port-wrapper">
                    <Port 
                        id="{id}-in-{i}" 
                        direction="in" 
                        on:portPointerDown={onPortDown}
                        on:portPointerUp={onPortUp}
                    />
                </div>
            {/each}
        </div>
    {/if}

    {#if outputs > 0}
        <div class="ports-container out-ports">
            {#each Array(outputs) as _, i}
                <div class="port-wrapper">
                    <Port 
                        id="{id}-out-{i}" 
                        direction="out" 
                        on:portPointerDown={onPortDown}
                        on:portPointerUp={onPortUp}
                    />
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .node-block {
        position: absolute;
        left: 0;
        top: 0;
        width: 140px;
        background-color: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px var(--node-color) inset;
        display: flex;
        flex-direction: column;
        user-select: none;
        touch-action: none;
        cursor: grab;
        z-index: 100;
        will-change: transform;
    }

    .node-block:active {
        cursor: grabbing;
        z-index: 101;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2), 0 0 0 2px var(--node-color) inset;
    }

    /* Dark mode adjustments - standard fallback assuming dark mode class on html or body if needed,
       but using generally dark-friendly transparent styles */
    :global(html.dark) .node-block {
        background-color: rgba(15, 23, 42, 0.6);
        border-color: rgba(255, 255, 255, 0.1);
    }

    .node-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 10px;
        background-color: var(--node-color);
        color: #fff;
        border-top-left-radius: 7px;
        border-top-right-radius: 7px;
        font-size: 11px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .node-close {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        font-size: 16px;
        line-height: 1;
        padding: 0 4px;
        cursor: pointer;
        transition: color 0.1s;
    }

    .node-close:hover {
        color: #fff;
    }

    .node-body {
        padding: 16px 12px;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 50px;
    }

    .node-input {
        width: 100%;
        background: rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        padding: 4px 8px;
        color: inherit;
        font-family: monospace;
        font-size: 14px;
        text-align: center;
        outline: none;
        -moz-appearance: textfield;
        appearance: textfield;
    }

    :global(html.dark) .node-input {
        background: rgba(255, 255, 255, 0.05);
        color: #e2e8f0;
    }

    .node-input::-webkit-outer-spin-button,
    .node-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    .node-input:focus {
        border-color: var(--node-color);
        box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
    }

    .node-result {
        font-family: monospace;
        font-size: 24px;
        font-weight: bold;
        color: var(--node-color);
    }

    .node-logic-label {
        font-size: 16px;
        font-weight: 600;
        color: inherit;
        opacity: 0.8;
    }
    
    :global(html.dark) .node-logic-label {
        color: #f8fafc;
    }

    .ports-container {
        position: absolute;
        top: 32px; /* Below header */
        bottom: 0;
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
    }

    .in-ports {
        left: 0;
    }

    .out-ports {
        right: 0;
    }

    .port-wrapper {
        position: relative;
        height: 100%;
        display: flex;
        align-items: center;
        --port-border: var(--node-color);
    }
    
    :global(html.dark) .port-wrapper {
        --port-bg: #1e293b;
    }
</style>
