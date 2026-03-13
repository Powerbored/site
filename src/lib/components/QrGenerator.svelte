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

    // Viewport dimensions for dynamic sizing
    let innerWidth = 0;
    let innerHeight = 0;

    async function generateQR(data: string, renderWidth: number) {
        if (!canvasElement) return;

        try {
            if (!data.trim()) {
                generateError = "Empty value provided.";
                return;
            }
            generateError = "";
            await QRCode.toCanvas(canvasElement, data, {
                width: renderWidth,
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
    $: {
        // Trigger on any dependency change
        const _deps = [
            value,
            isBlackAndWhite,
            isFullscreen,
            innerWidth,
            innerHeight,
        ];
        if (typeof window !== "undefined") {
            const renderWidth =
                isFullscreen && innerWidth && innerHeight
                    ? Math.floor(Math.min(innerWidth, innerHeight) * 0.8)
                    : width;
            generateQR(value, renderWidth);
        }
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
        if (value) {
            generateQR(value, width);
        }
        return () => {
            document.removeEventListener(
                "fullscreenchange",
                handleFullscreenChange,
            );
        };
    });

    async function copyImage() {
        if (!canvasElement) return;
        canvasElement.toBlob(async (blob) => {
            if (blob) {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ "image/png": blob }),
                    ]);
                    copySuccess = true;
                    setTimeout(() => (copySuccess = false), 2000);
                } catch (err) {
                    console.error("Failed to copy image: ", err);
                    alert(
                        "Failed to copy image. Your browser might not support this.",
                    );
                }
            }
        }, "image/png");
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

<svelte:window bind:innerWidth bind:innerHeight />

<div
    bind:this={containerElement}
    class="inline-flex flex-col gap-4 items-center bg-transparent {isFullscreen
        ? 'justify-center w-full h-full p-8'
        : ''}"
    style={isFullscreen ? `background-color: ${lightColor};` : ""}
>
    <div class="relative group">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <canvas
            bind:this={canvasElement}
            class="rounded-xl transition-all duration-300 {isFullscreen
                ? 'cursor-pointer'
                : ''}"
            on:click={() => {
                if (isFullscreen) toggleFullscreen();
            }}
            title={isFullscreen ? "Click to exit fullscreen" : ""}
        ></canvas>

        <!-- Utility Bar (Hidden in fullscreen, appears on hover or normally depending on preference, going with always visible but compact below) -->
    </div>

    {#if generateError}
        <p class="text-red-500 text-xs">{generateError}</p>
    {/if}

    <!-- Compact Utility Bar -->
    {#if !generateError}
        <div
            class="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all text-slate-500 dark:text-slate-400"
        >
            <!-- Fullscreen -->
            <button
                on:click={toggleFullscreen}
                class="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors group relative"
                aria-label={isFullscreen
                    ? "Exit Fullscreen"
                    : "View Fullscreen"}
                title={isFullscreen ? "Exit Fullscreen" : "View Fullscreen"}
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
                title="Toggle Black & White"
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
                title="Show Text"
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

            <!-- Copy Image -->
            <button
                on:click={copyImage}
                class="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors {copySuccess
                    ? 'text-emerald-500'
                    : ''}"
                aria-label="Copy Image"
                title="Copy Image"
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
                        ><rect x="3" y="3" width="18" height="18" rx="2" ry="2"
                        ></rect><circle cx="8.5" cy="8.5" r="1.5"
                        ></circle><polyline points="21 15 16 10 5 21"
                        ></polyline></svg
                    >
                {/if}
            </button>

            <div class="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1"></div>

            <!-- Save Image -->
            <button
                on:click={saveImage}
                class="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                aria-label="Save File"
                title="Save File"
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
    {#if showText}
        <div
            class="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-2"
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
