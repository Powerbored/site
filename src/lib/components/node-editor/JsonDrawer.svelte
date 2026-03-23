<script lang="ts">
    import { editorStore, exportJSON } from "../../nodeStore";
    import Icon from "../Icon.svelte";
    
    let isOpen = false;

    function toggleDrawer() {
        isOpen = !isOpen;
    }
</script>

<div class="json-drawer" class:open={isOpen}>
    <button class="toggle-btn" on:click={toggleDrawer} aria-label={isOpen ? "Close JSON View" : "Open JSON View"} title="View JSON">
        {#if isOpen}
            <Icon name="close" size={20} />
        {:else}
            <!-- Use a generic icon or text, paperclip/menu/settings -->
            <span class="json-label">{`{ }`}</span>
        {/if}
    </button>
    
    <div class="drawer-content">
        <div class="drawer-header">
            <h3>State JSON</h3>
            <button class="export-btn" on:click={exportJSON}>Export JSON</button>
        </div>
        <div class="drawer-scroll">
            <pre><code>{JSON.stringify($editorStore, null, 2)}</code></pre>
        </div>
    </div>
</div>

<style>
    .json-drawer {
        position: fixed;
        top: 0;
        right: 0;
        height: 100vh;
        width: 350px;
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-left: 1px solid rgba(0, 0, 0, 0.1);
        box-shadow: -4px 0 24px rgba(0, 0, 0, 0.1);
        transform: translateX(100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 2000;
        display: flex;
        flex-direction: column;
        color: #333;
    }

    :global(html.dark) .json-drawer {
        background: rgba(15, 23, 42, 0.85);
        border-left-color: rgba(255, 255, 255, 0.1);
        color: #e2e8f0;
    }

    .json-drawer.open {
        transform: translateX(0);
    }

    .toggle-btn {
        position: absolute;
        top: 24px;
        left: -48px;
        width: 48px;
        height: 48px;
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-right: none;
        border-radius: 8px 0 0 8px;
        box-shadow: -4px 0 12px rgba(0, 0, 0, 0.05);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: inherit;
        transition: background 0.2s, color 0.2s;
    }

    :global(html.dark) .toggle-btn {
        background: rgba(15, 23, 42, 0.85);
        border-color: rgba(255, 255, 255, 0.1);
    }

    .toggle-btn:hover {
        background: #f8fafc;
    }

    :global(html.dark) .toggle-btn:hover {
        background: #1e293b;
    }

    .json-label {
        font-family: monospace;
        font-weight: bold;
        font-size: 16px;
    }

    .drawer-content {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
    }

    .drawer-header {
        padding: 16px 20px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    :global(html.dark) .drawer-header {
        border-bottom-color: rgba(255, 255, 255, 0.1);
    }

    .export-btn {
        background: rgba(0, 0, 0, 0.05);
        color: #333;
        border: 1px solid rgba(0, 0, 0, 0.1);
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
    }

    :global(html.dark) .export-btn {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
        border-color: rgba(255, 255, 255, 0.1);
    }

    .export-btn:hover {
        background: rgba(0, 0, 0, 0.1);
    }

    :global(html.dark) .export-btn:hover {
        background: rgba(255, 255, 255, 0.15);
    }

    .drawer-header h3 {
        margin: 0;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        opacity: 0.8;
    }

    .drawer-scroll {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
    }

    pre {
        margin: 0;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 12px;
        line-height: 1.5;
        white-space: pre-wrap;
        word-break: break-all;
    }
</style>
