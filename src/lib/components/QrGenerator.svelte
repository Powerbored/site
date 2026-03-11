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
                    dark: darkColor,
                    light: lightColor,
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

    export function getCanvas(): HTMLCanvasElement {
        return canvasElement;
    }
</script>

<div class="inline-flex flex-col items-center">
    <canvas bind:this={canvasElement} class="rounded-xl"></canvas>
    {#if generateError}
        <p class="text-red-500 text-xs mt-2">{generateError}</p>
    {/if}
</div>
