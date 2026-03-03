<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import QRCode from "qrcode";
    import {
        Html5QrcodeScanner,
        Html5QrcodeSupportedFormats,
    } from "html5-qrcode";

    let text = $state("");

    let activeTab: "read" | "generate" = $state("read");

    // Read Mode State
    let scannerResult = $state("");
    let scanner: Html5QrcodeScanner | null = $state(null);
    let scanError = $state("");

    // Generate Mode State
    let generateInput = "Hello World";
    let canvasElement: HTMLCanvasElement;
    let generateError = "";

    // Toggle logic
    function switchTab(tab: "read" | "generate") {
        activeTab = tab;
        if (tab === "generate") {
            stopScanner();
            if (text === "") {
                text = "Hello World";
            }
            setTimeout(generateQR, 100);
        } else {
            setTimeout(startScanner, 100);
        }
    }

    // --- Read Mode ---
    function onScanSuccess(decodedText: string) {
        text = decodedText;
        scanError = "";
        // Optional: stop scanning after successful scan
        // scanner?.clear();
    }

    function onScanFailure(error: string) {
        // Html5QrcodeScanner throws continuous warnings, safe to ignore for UI.
        console.warn(`Code scan error = ${error}`);
    }

    function startScanner() {
        if (!document.getElementById("reader")) return;

        scanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                supportAudio: false,
            },
            false,
        );
        scanner.render(onScanSuccess, onScanFailure);
    }

    function stopScanner() {
        if (scanner) {
            scanner.clear().catch((err) => {
                console.error("Failed to clear html5-qrcode scanner", err);
            });
            scanner = null;
        }
    }

    async function copyScannedText() {
        try {
            await navigator.clipboard.writeText(scannerResult);
            // Optionally add a toast here
            alert("Copied to clipboard!");
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    }

    // --- Generate Mode ---
    async function generateQR() {
        if (!canvasElement) return;

        try {
            if (!generateInput.trim()) {
                generateError = "Please enter text to generate a QR Code.";
                return;
            }
            generateError = "";
            await QRCode.toCanvas(canvasElement, text, {
                width: 300,
                margin: 2,
                color: {
                    dark: "#0891b2", // Cyan 600
                    light: "#ffffff",
                },
            });
        } catch (err) {
            console.error(err);
            generateError = "Failed to generate QR Code.";
        }
    }

    async function copyGeneratedQR() {
        if (!canvasElement) return;
        canvasElement.toBlob(async (blob) => {
            if (blob) {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ "image/png": blob }),
                    ]);
                    alert("Image copied to clipboard!");
                } catch (err) {
                    console.error("Failed to copy image: ", err);
                    alert(
                        "Failed to copy image. Your browser might not support this.",
                    );
                }
            }
        }, "image/png");
    }

    onMount(() => {
        if (activeTab === "read") {
            startScanner();
        }
    });

    onDestroy(() => {
        stopScanner();
    });
</script>

<div
    class="h-full w-full min-h-screen p-8 text-gray-900 dark:text-gray-100 bg-white dark:bg-black/90 flex flex-col items-center"
>
    <div
        class="max-w-3xl w-full flex flex-col items-center gap-8 mt-12 bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-black/10 dark:border-white/10 p-8 rounded-3xl shadow-2xl"
    >
        <h1
            class="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500 text-center"
        >
            QR Code Utility
        </h1>

        <!-- Custom Tab Switcher -->
        <div
            class="flex gap-2 p-1 bg-black/5 dark:bg-white/10 rounded-xl relative w-full sm:w-auto"
        >
            <button
                class="flex-1 sm:px-12 py-3 rounded-lg text-sm font-bold transition-all duration-300 z-10 {activeTab ===
                'read'
                    ? 'text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'}"
                on:click={() => switchTab("read")}
            >
                Read
            </button>
            <button
                class="flex-1 sm:px-12 py-3 rounded-lg text-sm font-bold transition-all duration-300 z-10 {activeTab ===
                'generate'
                    ? 'text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'}"
                on:click={() => switchTab("generate")}
            >
                Generate
            </button>

            <!-- Sliding Background Highlight -->
            <div
                class="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg transition-transform duration-300 ease-out z-0"
                style="transform: translateX({activeTab === 'read'
                    ? '0%'
                    : '100%'})"
            ></div>
        </div>

        <div
            class="w-full flex-1 min-h-[400px] flex flex-col items-center justify-center relative"
        >
            <!-- READ MODE -->
            {#if activeTab === "read"}
                <div
                    class="w-full max-w-lg flex flex-col gap-6 animate-fade-in"
                >
                    <div
                        id="reader"
                        class="rounded-xl overflow-hidden shadow-lg border-2 border-cyan-500/30 bg-black/5 dark:bg-black/50 w-full min-h-[300px]"
                    ></div>

                    <div class="w-full flex flex-col gap-3">
                        <label
                            for="scan-result"
                            class="text-sm font-medium text-gray-500 dark:text-gray-400"
                            >Scanned Result</label
                        >
                        <textarea
                            id="scan-result"
                            class="w-full flex-1 p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-black/30 backdrop-blur-md outline-none focus:ring-2 focus:ring-cyan-500/50 resize-y min-h-[100px] transition-all"
                            placeholder="Awaiting QR Code Scan..."
                            value={text}
                            readonly
                        ></textarea>
                    </div>

                    <button
                        on:click={copyScannedText}
                        disabled={!scannerResult}
                        class="px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 {scannerResult
                            ? 'bg-black dark:bg-white text-white dark:text-black hover:scale-[1.02] active:scale-95 shadow-xl shadow-cyan-500/20'
                            : 'bg-gray-200 dark:bg-white/5 text-gray-400 dark:text-gray-500 cursor-not-allowed'}"
                    >
                        <svg
                            class="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                            ><path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            ></path></svg
                        >
                        Copy Text Output
                    </button>
                </div>
            {/if}

            <!-- GENERATE MODE -->
            {#if activeTab === "generate"}
                <div
                    class="w-full max-w-lg flex flex-col gap-6 animate-fade-in relative"
                >
                    <div class="w-full flex flex-col gap-3 z-10">
                        <label
                            for="generate-input"
                            class="text-sm font-medium text-gray-500 dark:text-gray-400"
                            >Source Text</label
                        >
                        <textarea
                            id="generate-input"
                            class="w-full flex-1 p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-black/30 backdrop-blur-md outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-y min-h-[120px] transition-all"
                            placeholder="Enter text or URL to encode..."
                            bind:value={text}
                            on:input={generateQR}
                        ></textarea>
                        {#if generateError}
                            <p class="text-red-500 text-sm mt-1">
                                {generateError}
                            </p>
                        {/if}
                    </div>

                    <!-- QR Display -->
                    <div
                        class="flex flex-col items-center justify-center bg-white p-6 rounded-2xl shadow-[0_0_40px_rgba(8,145,178,0.2)] dark:shadow-[0_0_40px_rgba(8,145,178,0.15)] transition-all"
                    >
                        <canvas bind:this={canvasElement} class="rounded-xl"
                        ></canvas>
                    </div>

                    <button
                        on:click={copyGeneratedQR}
                        disabled={!generateInput.trim()}
                        class="mt-4 px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 {generateInput.trim()
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:scale-[1.02] active:scale-95 shadow-xl shadow-cyan-500/20'
                            : 'bg-gray-200 dark:bg-white/5 text-gray-400 dark:text-gray-500 cursor-not-allowed'}"
                    >
                        <svg
                            class="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                            ><path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                            ></path></svg
                        >
                        Copy Rendered Image
                    </button>
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    @keyframes fade-in {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    .animate-fade-in {
        animation: fade-in 0.4s ease-out forwards;
    }

    /* Style the HTML5 QR Code scanner UI heavily since it injects ugly DOM elements */
    :global(#reader) {
        border: none !important;
    }
    :global(#reader__scan_region) {
        background: transparent !important;
    }
    :global(#reader__dashboard_section_csr span) {
        color: inherit !important;
    }
    :global(#reader button) {
        background-color: #0891b2 !important; /* Cyan 600 */
        color: white !important;
        border: none !important;
        padding: 0.5rem 1rem !important;
        border-radius: 0.5rem !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        margin: 0.5rem !important;
        transition: transform 0.2s !important;
    }
    :global(#reader button:hover) {
        transform: scale(1.05) !important;
    }
    :global(#reader select) {
        background: rgba(255, 255, 255, 0.1) !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        color: inherit !important;
        padding: 0.5rem !important;
        border-radius: 0.5rem !important;
        margin-bottom: 1rem !important;
    }
</style>
