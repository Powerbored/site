<script lang="ts">
    import { onMount } from "svelte";

    export let name: string;
    export let variant: "hollow" | "filled" = "hollow";
    export let size: number | string = 24;
    let className: string = "";
    export { className as class };

    // Module-level cache to ensure we only load and inject each icon once per path
    const loadedIcons = new Set<string>();
    let spriteContainer: SVGSVGElement | null = null;
    let loadFailed = false; // Add a state if fetching completely fails to show the fallback

    $: iconId = `${name}_${variant}`;

    function getSpriteContainer(): SVGSVGElement {
        if (!spriteContainer) {
            spriteContainer = document.getElementById(
                "icon-sprite",
            ) as SVGSVGElement | null;
            if (!spriteContainer) {
                spriteContainer = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "svg",
                );
                spriteContainer.id = "icon-sprite";
                spriteContainer.setAttribute("style", "display: none;");
                document.body.appendChild(spriteContainer);
            }
        }
        return spriteContainer;
    }

    async function fetchAndInjectSVG(
        id: string,
        path: string,
    ): Promise<boolean> {
        if (loadedIcons.has(id)) return true; // Already loading or loaded
        loadedIcons.add(id); // Mark as loading to prevent concurrent fetches

        try {
            const resp = await fetch(path);
            if (!resp.ok) {
                loadedIcons.delete(id); // Allow retry if needed, but for now we consider it failed
                return false;
            }
            const text = await resp.text();

            // Svelte SSR guard
            if (typeof document === "undefined") return false;

            const parser = new DOMParser();
            const doc = parser.parseFromString(text, "image/svg+xml");
            const svg = doc.querySelector("svg");

            if (!svg) {
                loadedIcons.delete(id);
                return false;
            }

            const symbol = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "symbol",
            );
            symbol.id = id;
            symbol.setAttribute(
                "viewBox",
                svg.getAttribute("viewBox") || "0 0 24 24",
            );
            symbol.innerHTML = svg.innerHTML;

            getSpriteContainer().appendChild(symbol);

            return true;
        } catch (err) {
            console.error(`Failed to load icon ${path}:`, err);
            loadedIcons.delete(id);
            return false;
        }
    }

    async function loadIcon() {
        if (typeof window === "undefined") return; // Skip during SSR

        loadFailed = false;

        // Try requested variant first
        const requestedId = `${name}_${variant}`;
        const requestedPath = `/icons/${requestedId}.svg`;

        let success = await fetchAndInjectSVG(requestedId, requestedPath);

        // If it failed, try the fallback variant
        if (!success) {
            const fallbackVariant = variant === "hollow" ? "filled" : "hollow";
            const fallbackId = `${name}_${fallbackVariant}`;
            const fallbackPath = `/icons/${fallbackId}.svg`;

            success = await fetchAndInjectSVG(fallbackId, fallbackPath);

            if (success) {
                // We succeeded using the fallback, overwrite our local iconId so <use> points to the fallback
                iconId = fallbackId;
            } else {
                loadFailed = true;
            }
        }
    }

    onMount(() => {
        loadIcon();
    });

    // Re-run if props change
    $: {
        if (typeof window !== "undefined" && name && variant) {
            loadIcon();
        }
    }
</script>

{#if !loadFailed}
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        class={className}
        aria-hidden="true"
    >
        <use href="#{iconId}" {...{ rel: "external" } as any} />
    </svg>
{:else}
    <!-- Fallback for missing icon that couldn't be loaded at all -->
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        class={className}
        aria-hidden="true"
    >
        <rect
            width="24"
            height="24"
            fill="none"
            stroke="red"
            stroke-width="2"
            stroke-dasharray="4"
        />
        <line x1="0" y1="0" x2="24" y2="24" stroke="red" stroke-width="2" />
        <line x1="24" y1="0" x2="0" y2="24" stroke="red" stroke-width="2" />
    </svg>
{/if}

<style>
    svg {
        display: inline-block;
        vertical-align: middle;
    }
</style>
