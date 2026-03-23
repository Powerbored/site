<script lang="ts">
    import { addNode, clearAll, type NodeType } from "../../nodeStore";

    // Viewport position is managed by parent, but we add nodes near center
    export let canvasX = 0;
    export let canvasY = 0;
    export let zoom = 1;

    function handleAdd(type: NodeType) {
        // Place new node in the center of the current view
        const cx = -canvasX / zoom + (window.innerWidth / 2) / zoom - 70;
        const cy = -canvasY / zoom + (window.innerHeight / 2) / zoom - 40;
        
        // Add some random scatter so they don't overlap perfectly
        const scatterX = cx + (Math.random() * 40 - 20);
        const scatterY = cy + (Math.random() * 40 - 20);
        
        addNode(type, scatterX, scatterY);
    }

    function handleClear() {
        if (confirm("Are you sure you want to clear all nodes?")) {
            clearAll();
        }
    }
</script>

<div class="node-toolbar">
    <div class="toolbar-section">
        <span class="toolbar-label">Add Nodes</span>
        <button class="tool-btn btn-input" on:click={() => handleAdd("number-input")}># Input</button>
        <button class="tool-btn btn-and" on:click={() => handleAdd("logic-and")}>AND</button>
        <button class="tool-btn btn-or" on:click={() => handleAdd("logic-or")}>OR</button>
        <button class="tool-btn btn-not" on:click={() => handleAdd("logic-not")}>NOT</button>
        <button class="tool-btn btn-output" on:click={() => handleAdd("output")}>Output</button>
    </div>
    
    <div class="toolbar-section divider"></div>
    
    <div class="toolbar-section">
        <button class="action-btn btn-danger" on:click={handleClear}>Clear All</button>
    </div>
</div>

<style>
    .node-toolbar {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 16px;
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 999px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        align-items: center;
        user-select: none;
    }

    :global(html.dark) .node-toolbar {
        background: rgba(15, 23, 42, 0.7);
        border-color: rgba(255, 255, 255, 0.1);
    }

    .toolbar-section {
        display: flex;
        gap: 8px;
        align-items: center;
    }

    .toolbar-label {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        color: rgba(0, 0, 0, 0.5);
        margin-right: 4px;
        letter-spacing: 0.5px;
    }
    
    :global(html.dark) .toolbar-label {
        color: rgba(255, 255, 255, 0.5);
    }

    .divider {
        width: 1px;
        height: 24px;
        background: rgba(0, 0, 0, 0.1);
    }
    
    :global(html.dark) .divider {
        background: rgba(255, 255, 255, 0.1);
    }

    button {
        border: none;
        outline: none;
        cursor: pointer;
        padding: 6px 12px;
        border-radius: 999px;
        font-weight: 600;
        font-size: 13px;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        color: white;
    }

    button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    button:active {
        transform: translateY(0);
    }

    .tool-btn { text-shadow: 0 1px 2px rgba(0,0,0,0.2); }
    .btn-input { background: #10b981; }
    .btn-input:hover { background: #059669; }
    .btn-and { background: #06b6d4; }
    .btn-and:hover { background: #0891b2; }
    .btn-or { background: #8b5cf6; }
    .btn-or:hover { background: #7c3aed; }
    .btn-not { background: #f59e0b; }
    .btn-not:hover { background: #d97706; }
    .btn-output { background: #f43f5e; }
    .btn-output:hover { background: #e11d48; }

    .action-btn {
        background: rgba(0, 0, 0, 0.05);
        color: #333;
        border: 1px solid rgba(0, 0, 0, 0.1);
    }
    
    :global(html.dark) .action-btn {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
        border-color: rgba(255, 255, 255, 0.1);
    }

    .action-btn:hover {
        background: rgba(0, 0, 0, 0.1);
    }
    
    :global(html.dark) .action-btn:hover {
        background: rgba(255, 255, 255, 0.15);
    }

    .btn-danger {
        color: #ef4444;
    }
    :global(html.dark) .btn-danger {
        color: #fca5a5;
    }
</style>
