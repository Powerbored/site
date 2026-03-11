<script lang="ts">
    import { onMount } from "svelte";
    import QRCode from "qrcode";

    export let value: string;
    export let width: number = 250;
    export let darkColor: string = "#0f172a";
    export let lightColor: string = "#ffffff";
    export let margin: number = 2;

    let canvasElement: HTMLCanvasElement;
    let generateError: string = "";

    // Feature states
    let isBlackAndWhite = false;
    let showText = false;
    let copySuccess = false;
    let isFullscreen = false;
    let containerElement: HTMLDivElement;

    async function generateQR(data: string) {
        if (!canvasElement) return;

        try {
            if (!data.trim()) {
                generateError = "Empty value provided.";
                return;
            }
            generateError = "";
            await QRCode.toCanvas(canvasElement, data, {
                width,
                margin,
                color: {
                    dark: isBlackAndWhite ? "#000000" : darkColor,
                    light: isBlackAndWhite ? "#ffffff" : lightColor,
                },
            });
        } catch (err) {
            console.error(err);
            generateError = "Failed to generate QR Code.";
        }
    }

    // Reactively update the canvas when the value or styling props change
    $: if (typeof window !== "undefined") {
        generateQR(value);
    }
    $: if (isBlackAndWhite !== undefined && typeof window !== "undefined") {
        generateQR(value);
    }

    export function getCanvas(): HTMLCanvasElement {
        return canvasElement;
    }

    // --- Utility Functions ---

    function toggleFullscreen() {
        if (!containerElement) return;

        if (!document.fullscreenElement) {
            containerElement.requestFullscreen().catch((err) => {
                console.error(
                    `Error attempting to enable fullscreen: ${err.message}`,
                );
            });
        } else {
            document.exitFullscreen();
        }
    }

    onMount(() => {
        const handleFullscreenChange = () => {
            isFullscreen = !!document.fullscreenElement;
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => {
            document.removeEventListener(
                "fullscreenchange",
                handleFullscreenChange,
            );
        };
    });

    async function copyText() {
        try {
            await navigator.clipboard.writeText(value);
            copySuccess = true;
            setTimeout(() => (copySuccess = false), 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    }

    function saveImage() {
        if (!canvasElement) return;
        const dataUrl = canvasElement.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = "qrcode.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
</script>

<div
    bind:this={containerElement}
    class="inline-flex flex-col items-center bg-transparent {isFullscreen
        ? 'justify-center w-full h-full bg-slate-900/90 backdrop-blur-sm p-8'
        : ''}"
>
    <div class="relative group">
        <canvas
            bind:this={canvasElement}
            class="rounded-xl {isFullscreen
                ? 'scale-125 transition-transform shadow-2xl'
                : ''}"
        ></canvas>

        <!-- Utility Bar (Hidden in fullscreen, appears on hover or normally depending on preference, going with always visible but compact below) -->
    </div>

    {#if generateError}
        <p class="text-red-500 text-xs mt-2">{generateError}</p>
    {/if}

    <!-- Compact Utility Bar -->
    {#if !isFullscreen && !generateError}
        <div
            class="flex items-center gap-1 mt-3 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all text-slate-500 dark:text-slate-400"
        >
            <!-- Fullscreen -->
            <button
                on:click={toggleFullscreen}
                class="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors group relative"
                aria-label="View Fullscreen"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    ><path
                        d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
                    ></path></svg
                >
            </button>

            <div class="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1"></div>

            <!-- Toggle B&W -->
            <button
                on:click={() => (isBlackAndWhite = !isBlackAndWhite)}
                class="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors {isBlackAndWhite
                    ? 'text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-700'
                    : ''}"
                aria-label="Toggle Black & White"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    ><circle cx="12" cy="12" r="10"></circle><path
                        d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
                    ></path></svg
                >
            </button>

            <!-- Show Text -->
            <button
                on:click={() => (showText = !showText)}
                class="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors {showText
                    ? 'text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-700'
                    : ''}"
                aria-label="Show Text"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    ><path
                        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                    ></path></svg
                >
            </button>

            <!-- Copy Text -->
            <button
                on:click={copyText}
                class="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors {copySuccess
                    ? 'text-emerald-500'
                    : ''}"
                aria-label="Copy Text"
            >
                {#if copySuccess}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><polyline points="20 6 9 17 4 12"></polyline></svg
                    >
                {:else}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><rect x="9" y="9" width="13" height="13" rx="2" ry="2"
                        ></rect><path
                            d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                        ></path></svg
                    >
                {/if}
            </button>

            <div class="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1"></div>

            <!-- Save Image -->
            <button
                on:click={saveImage}
                class="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                aria-label="Save Image"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    ><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                    ></path><polyline points="7 10 12 15 17 10"></polyline><line
                        x1="12"
                        y1="15"
                        x2="12"
                        y2="3"
                    ></line></svg
                >
            </button>
        </div>
    {/if}

    <!-- Show Text Block -->
    {#if showText && !isFullscreen}
        <div
            class="mt-4 w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-2"
        >
            <h4
                class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
            >
                QR Value
            </h4>
            <p
                class="text-sm font-mono text-slate-700 dark:text-slate-300 break-all select-all"
            >
                {value}
            </p>
        </div>
    {/if}
</div>
