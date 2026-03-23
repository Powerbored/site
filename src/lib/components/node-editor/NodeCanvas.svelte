<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import NodeBlock from "./NodeBlock.svelte";
    import ConnectionWire from "./ConnectionWire.svelte";
    import NodeToolbar from "./NodeToolbar.svelte";
    import { 
        editorStore, 
        updateNodePosition, 
        addConnection, 
        removeConnection 
    } from "../../nodeStore";

    let canvasEl: HTMLElement;
    
    // Viewport State
    let canvasX = 0;
    let canvasY = 0;
    let zoom = 1;
    let isPanning = false;
    let lastPanX = 0;
    let lastPanY = 0;

    // Connection Drawing State
    let isDrawingConnection = false;
    let drawStartPortId: string | null = null;
    let drawStartX = 0;
    let drawStartY = 0;
    let drawCurrentX = 0;
    let drawCurrentY = 0;

    // Compute port positions dynamically
    // A reactive statement tracking all nodes and canvas transform to resolve where ports are
    function getPortCoordinates(portId: string) {
        if (!canvasEl) return { x: 0, y: 0 };
        // We can just find the DOM element and get its center relatively to the canvas content
        const portEl = document.querySelector(`[title="${portId}"]`);
        if (!portEl) return { x: 0, y: 0 };

        const portRect = portEl.getBoundingClientRect();
        const canvasRect = canvasEl.getBoundingClientRect();

        // Convert screen coordinates to canvas workspace coordinates
        return {
            x: (portRect.left + portRect.width / 2 - canvasRect.left - canvasX) / zoom,
            y: (portRect.top + portRect.height / 2 - canvasRect.top - canvasY) / zoom
        };
    }

    // Canvas panning logic
    function handleCanvasPointerDown(e: PointerEvent) {
        // Only pan on middle click, right click, or when clicking the background
        if (e.target !== canvasEl && !(e.target as Element).classList.contains('canvas-background')) return;
        
        isPanning = true;
        lastPanX = e.clientX;
        lastPanY = e.clientY;
        canvasEl.setPointerCapture(e.pointerId);
    }

    function handleCanvasPointerMove(e: PointerEvent) {
        if (isPanning) {
            canvasX += e.clientX - lastPanX;
            canvasY += e.clientY - lastPanY;
            lastPanX = e.clientX;
            lastPanY = e.clientY;
        } else if (isDrawingConnection) {
            const canvasRect = canvasEl.getBoundingClientRect();
            drawCurrentX = (e.clientX - canvasRect.left - canvasX) / zoom;
            drawCurrentY = (e.clientY - canvasRect.top - canvasY) / zoom;
        }
    }

    function handleCanvasPointerUp(e: PointerEvent) {
        if (isPanning) {
            isPanning = false;
            canvasEl.releasePointerCapture(e.pointerId);
        }
        
        if (isDrawingConnection) {
            // Cancel drawing if dropped on canvas
            isDrawingConnection = false;
            drawStartPortId = null;
        }
    }

    function handleWheel(e: WheelEvent) {
        // Zooming logic
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            
            const zoomDelta = e.deltaY * -0.01;
            const newZoom = Math.max(0.2, Math.min(3, zoom + zoomDelta));
            
            // Adjust pan to zoom around pointer
            const rect = canvasEl.getBoundingClientRect();
            const pointerX = e.clientX - rect.left;
            const pointerY = e.clientY - rect.top;
            
            // Calculate where the pointer is in the workspace
            const workspaceX = (pointerX - canvasX) / zoom;
            const workspaceY = (pointerY - canvasY) / zoom;
            
            zoom = newZoom;
            
            // Adjust canvas offset so the workspace point stays under the pointer
            canvasX = pointerX - workspaceX * zoom;
            canvasY = pointerY - workspaceY * zoom;
        } else {
            // Panning logic (two finger scroll on trackpad)
            canvasX -= e.deltaX;
            canvasY -= e.deltaY;
        }
    }

    // Node Dragging Handlers
    function handleNodeDragMove(e: CustomEvent) {
        const { id, dx, dy, initialX, initialY } = e.detail;
        updateNodePosition(id, initialX + dx / zoom, initialY + dy / zoom);
    }

    // Port Connection Handlers
    function handlePortPointerDown(e: CustomEvent) {
        const { id, direction, e: pointerEvent } = e.detail;
        
        // Only start from output ports for simplicity, or allow both?
        // Let's only allow dragging from output to input.
        if (direction !== "out") return;

        isDrawingConnection = true;
        drawStartPortId = id;
        
        const coords = getPortCoordinates(id);
        drawStartX = coords.x;
        drawStartY = coords.y;
        
        const canvasRect = canvasEl.getBoundingClientRect();
        drawCurrentX = (pointerEvent.clientX - canvasRect.left - canvasX) / zoom;
        drawCurrentY = (pointerEvent.clientY - canvasRect.top - canvasY) / zoom;
    }

    function handlePortPointerUp(e: CustomEvent) {
        const { id, direction } = e.detail;
        
        if (isDrawingConnection && drawStartPortId) {
            if (direction === "in") {
                addConnection(drawStartPortId, id);
            }
            isDrawingConnection = false;
            drawStartPortId = null;
        }
    }

    let tick = 0;
    $: if ($editorStore.nodes) {
        if (typeof window !== 'undefined') {
            requestAnimationFrame(() => {
                tick++; 
            });
        }
    }
</script>

<div class="editor-container">
    <!-- Toolbar overlay -->
    <NodeToolbar {canvasX} {canvasY} {zoom} />

    <!-- Canvas wrapper -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div 
        class="canvas-wrapper" 
        bind:this={canvasEl}
        on:pointerdown={handleCanvasPointerDown}
        on:pointermove={handleCanvasPointerMove}
        on:pointerup={handleCanvasPointerUp}
        on:pointercancel={handleCanvasPointerUp}
        on:wheel|nonpassive={handleWheel}
    >
        <div class="canvas-background" 
             style="background-position: {canvasX}px {canvasY}px; background-size: {20 * zoom}px {20 * zoom}px;">
        </div>

        <!-- Transform Layer -->
        <div 
            class="transform-layer" 
            style="transform: translate({canvasX}px, {canvasY}px) scale({zoom});"
        >
            <!-- SVG layer for connections -->
            <svg class="connection-layer">
                <defs>
                    <linearGradient id="wire-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#06b6d4" />
                        <stop offset="100%" stop-color="#8b5cf6" />
                    </linearGradient>
                    <linearGradient id="wire-gradient-hover" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#0891b2" />
                        <stop offset="100%" stop-color="#7c3aed" />
                    </linearGradient>
                </defs>
                
                {#key tick}
                    {#each Object.values($editorStore.connections) as conn (conn.id)}
                        {@const start = getPortCoordinates(conn.fromPortId)}
                        {@const end = getPortCoordinates(conn.toPortId)}
                        {#if start.x !== 0 || start.y !== 0} <!-- Basic check that DOM resolved -->
                            <ConnectionWire 
                                id={conn.id}
                                startX={start.x} 
                                startY={start.y} 
                                endX={end.x} 
                                endY={end.y} 
                                on:removeConnection={(e) => removeConnection(e.detail.id)}
                            />
                        {/if}
                    {/each}
                {/key}
                
                {#if isDrawingConnection}
                    <ConnectionWire 
                        id="draw-temp"
                        startX={drawStartX} 
                        startY={drawStartY} 
                        endX={drawCurrentX} 
                        endY={drawCurrentY} 
                        active={true}
                    />
                {/if}
            </svg>

            <!-- HTML layer for nodes -->
            <div class="node-layer">
                {#each Object.values($editorStore.nodes) as node (node.id)}
                    <NodeBlock 
                        {...node} 
                        on:nodedragmove={handleNodeDragMove}
                        on:portPointerDown={handlePortPointerDown}
                        on:portPointerUp={handlePortPointerUp}
                    />
                {/each}
            </div>
        </div>
    </div>
</div>

<style>
    .editor-container {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: calc(100vh - 64px); /* Fallback depending on navbar size */
        overflow: hidden;
        background-color: #f8fafc;
    }

    :global(html.dark) .editor-container {
        background-color: #0f172a;
    }

    .canvas-wrapper {
        position: absolute;
        inset: 0;
        cursor: grab;
        touch-action: none; /* Required for custom pan/zoom pointer events */
    }

    .canvas-wrapper:active {
        cursor: grabbing;
    }

    .canvas-background {
        position: absolute;
        inset: 0;
        pointer-events: none;
        background-image: radial-gradient(rgba(0,0,0,0.1) 1px, transparent 1px);
    }

    :global(html.dark) .canvas-background {
        background-image: radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px);
    }

    .transform-layer {
        position: absolute;
        top: 0;
        left: 0;
        width: 0;
        height: 0;
        transform-origin: 0 0;
    }

    .connection-layer {
        position: absolute;
        top: 0;
        left: 0;
        width: 1px;
        height: 1px;
        overflow: visible;
        pointer-events: none;
        z-index: 10;
    }

    .node-layer {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 20;
    }
</style>
