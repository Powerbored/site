<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import {
        Html5QrcodeScanner,
        Html5QrcodeSupportedFormats,
    } from "html5-qrcode";

    export let onScanSuccess: (decodedText: string) => void;
    // Optional props for customization
    export let fps: number = 10;
    export let qrboxWidth: number = 250;
    export let qrboxHeight: number = 250;

    let scannerId = `reader-${Math.random().toString(36).substr(2, 9)}`;
    let scanner: Html5QrcodeScanner | null = null;

    function onScanFailure(error: string) {
        // Html5QrcodeScanner throws continuous warnings, safe to ignore for UI.
        // We log silently if needed.
    }

    export function startScanner() {
        if (!document.getElementById(scannerId)) return;

        scanner = new Html5QrcodeScanner(
            scannerId,
            {
                fps,
                qrbox: { width: qrboxWidth, height: qrboxHeight },
                formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            },
            false,
        );
        scanner.render((decodedText) => {
            onScanSuccess(decodedText);
        }, onScanFailure);
    }

    export function stopScanner() {
        if (scanner) {
            scanner.clear().catch((err) => {
                console.error("Failed to clear html5-qrcode scanner", err);
            });
            scanner = null;
        }
    }

    onMount(() => {
        startScanner();
    });

    onDestroy(() => {
        stopScanner();
    });
</script>

<div
    id={scannerId}
    class="rounded-xl overflow-hidden shadow-lg border-2 border-cyan-500/30 bg-black/5 dark:bg-black/50 w-full min-h-[300px]"
></div>

<style>
    /* Style the HTML5 QR Code scanner UI heavily since it injects ugly DOM elements */
    :global(div[id^="reader-"]) {
        border: none !important;
    }
    :global(div[id^="reader-"] #reader__scan_region) {
        background: transparent !important;
    }
    :global(div[id^="reader-"] #reader__dashboard_section_csr span) {
        color: inherit !important;
    }
    :global(div[id^="reader-"] button) {
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
    :global(div[id^="reader-"] button:hover) {
        transform: scale(1.05) !important;
    }
    :global(div[id^="reader-"] select) {
        background: rgba(255, 255, 255, 0.1) !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        color: inherit !important;
        padding: 0.5rem !important;
        border-radius: 0.5rem !important;
        margin-bottom: 1rem !important;
    }
</style>
