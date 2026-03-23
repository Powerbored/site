<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let id: string;
    export let startX: number;
    export let startY: number;
    export let endX: number;
    export let endY: number;
    export let active: boolean = false; // Is it currently being drawn?

    const dispatch = createEventDispatcher();

    // Calculate cubic bezier path
    $: path = calculateBezier(startX, startY, endX, endY);

    function calculateBezier(sx: number, sy: number, ex: number, ey: number) {
        // Curve strength based on distance, but mostly horizontal
        const dist = Math.abs(ex - sx);
        const strength = Math.max(80, dist * 0.5);
        
        const cp1x = sx + strength;
        const cp1y = sy;
        const cp2x = ex - strength;
        const cp2y = ey;

        return `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${ex} ${ey}`;
    }

    function removeConnection() {
        if (!active) {
            dispatch("removeConnection", { id });
        }
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<g class="wire-group" class:active on:click|stopPropagation={removeConnection}>
    <!-- Invisible wider path for easier clicking -->
    <path 
        class="wire-hitbox"
        d={path} 
        fill="none" 
        stroke="transparent" 
        stroke-width="15" 
    />
    
    <!-- Visible wire -->
    <path 
        class="wire-path"
        d={path} 
        fill="none" 
        stroke="url(#wire-gradient)" 
        stroke-width="3" 
        stroke-linecap="round"
    />

    {#if !active}
        <circle 
            class="wire-delete-dot"
            cx={(startX + endX) / 2} 
            cy={(startY + endY) / 2} 
            r="4" 
            fill="var(--port-border, #f43f5e)" 
            opacity="0"
        />
    {/if}
</g>

<style>
    .wire-group {
        cursor: crosshair;
        pointer-events: stroke; /* Only trigger events on the stroke */
    }

    .wire-group:not(.active) {
        cursor: pointer;
    }

    .wire-path {
        transition: stroke-width 0.2s, stroke 0.2s;
        stroke: var(--wire-color, #06b6d4); /* Fallback if gradient fails */
        /* Use standard css gradient id reference */
        stroke: url(#wire-gradient);
    }

    .wire-group:hover .wire-path {
        stroke-width: 5;
        stroke: url(#wire-gradient-hover);
        filter: drop-shadow(0 0 4px rgba(6, 182, 212, 0.5));
    }

    .wire-delete-dot {
        transition: opacity 0.2s, transform 0.2s;
        transform-origin: center;
        transform-box: fill-box;
    }

    .wire-group:hover .wire-delete-dot {
        opacity: 1;
        transform: scale(1.5);
    }
</style>
