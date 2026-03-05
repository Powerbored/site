<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { base } from "$app/paths";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import Icon from "$lib/components/Icon.svelte";

    // ── Menu items (same list as sidebar) ──────────────────────────
    const menuItems = [
        {
            href: `${base}/`,
            label: "Powerbored",
            icon: "lightning-bolt" as const,
        },
        {
            href: `${base}/experiments`,
            label: "Experiments",
            icon: "test-tube" as const,
        },
        { href: `${base}/tz`, label: "Timezone", icon: "clock" as const },
        { href: `${base}/qr`, label: "QR Code", icon: "search" as const },
        {
            href: `${base}/birthday`,
            label: "Birthday",
            icon: "birthday" as const,
        },
        { href: `${base}/chat`, label: "Chat", icon: "chat" as const },
    ];

    // ── Theme toggle (mirrored from Navigation.svelte) ─────────────
    let theme: "light" | "dark" | "auto" = "auto";
    let systemTheme: "light" | "dark" = "light";
    let mediaQuery: MediaQueryList;

    function handleSystemThemeChange(e: MediaQueryListEvent) {
        systemTheme = e.matches ? "dark" : "light";
        if (theme === "auto") {
            document.documentElement.classList.toggle("dark", e.matches);
        }
    }

    onMount(() => {
        mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        systemTheme = mediaQuery.matches ? "dark" : "light";
        mediaQuery.addEventListener("change", handleSystemThemeChange);

        if ("theme" in localStorage) {
            theme = localStorage.theme as "light" | "dark";
        } else {
            theme = "auto";
        }
        applyTheme(theme);
    });

    onDestroy(() => {
        if (mediaQuery) {
            mediaQuery.removeEventListener("change", handleSystemThemeChange);
        }
    });

    function applyTheme(t: "light" | "dark" | "auto") {
        if (t === "auto") {
            localStorage.removeItem("theme");
            document.documentElement.classList.toggle(
                "dark",
                mediaQuery.matches,
            );
        } else if (t === "dark") {
            localStorage.theme = "dark";
            document.documentElement.classList.add("dark");
        } else {
            localStorage.theme = "light";
            document.documentElement.classList.remove("dark");
        }
    }

    function toggleTheme() {
        if (theme === "auto") theme = "light";
        else if (theme === "light") theme = "dark";
        else theme = "auto";
        applyTheme(theme);
    }

    $: themeIconName = (
        theme === "auto"
            ? "settings"
            : theme === "dark"
              ? "dark-mode"
              : "light-mode"
    ) as "settings" | "dark-mode" | "light-mode";

    $: themeLabel =
        theme === "auto"
            ? `System (${systemTheme === "dark" ? "Dark" : "Light"})`
            : theme === "dark"
              ? "Dark Mode"
              : "Light Mode";

    // ── Radial state ───────────────────────────────────────────────
    let isOpen = false;
    let isDragging = false;
    let isPointerDown = false;
    let dragThresholdExceeded = false;
    let startX = 0;
    let startY = 0;
    let hoveredIndex: number | null = null;
    let pressTimer: ReturnType<typeof setTimeout> | null = null;

    // All items: nav + theme toggle
    type RadialItem =
        | { kind: "nav"; href: string; label: string; icon: string }
        | { kind: "theme"; label: string; icon: string };

    $: allItems = [
        ...menuItems.map((m) => ({ kind: "nav" as const, ...m })),
        { kind: "theme" as const, label: themeLabel, icon: themeIconName },
    ];

    // ── Geometry ───────────────────────────────────────────────────
    const INNER_RADIUS = 90; // px from FAB centre
    const RING_SPACING = 70; // px between concentric rings
    const ITEM_SPACING = 60; // min px arc length between items
    // First item vertically aligned to center (up, 270°), last horizontally aligned (left, 180°)
    const ARC_START = Math.PI * 1.5; // 270°
    const ARC_END = Math.PI; // 180°

    $: positions = calculatePositions(allItems.length);

    function calculatePositions(total: number) {
        const result = [];
        let remaining = total;
        let ring = 0;

        while (remaining > 0) {
            const r = INNER_RADIUS + ring * RING_SPACING;
            const arcLength = r * Math.abs(ARC_END - ARC_START);
            // How many items can fit in this ring's arc segment? (at least 1)
            const maxItems = Math.max(
                1,
                Math.floor(arcLength / ITEM_SPACING) + 1,
            );

            const itemsInThisRing = Math.min(remaining, maxItems);

            for (let i = 0; i < itemsInThisRing; i++) {
                // If only 1 item in ring, center it. Otherwise spread evenly across the arc.
                const fraction =
                    itemsInThisRing === 1 ? 0.5 : i / (itemsInThisRing - 1);
                const angle = ARC_START + (ARC_END - ARC_START) * fraction;
                result.push({
                    x: Math.cos(angle) * r,
                    y: Math.sin(angle) * r,
                });
            }

            remaining -= itemsInThisRing;
            ring++;
        }
        return result;
    }

    // ── Interaction handlers ───────────────────────────────────────
    function openMenu() {
        isOpen = true;
    }

    function closeMenu() {
        isOpen = false;
        isDragging = false;
        hoveredIndex = null;
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
    }

    function handleFabClick(e: MouseEvent) {
        if (isDragging || dragThresholdExceeded) return;
        if (isOpen) closeMenu();
        else openMenu();
    }

    // Press-and-drag
    function handlePointerDown(e: PointerEvent) {
        if (e.button !== 0) return; // Only primary clicks/taps
        isPointerDown = true;
        startX = e.clientX;
        startY = e.clientY;
        dragThresholdExceeded = false;

        if (!isOpen) {
            // Delay slightly so a quick tap doesn't look like a drag start
            pressTimer = setTimeout(() => {
                if (isPointerDown) {
                    isDragging = true;
                    openMenu();
                }
            }, 200);
        } else {
            isDragging = true;
        }
    }

    function handlePointerMove(e: PointerEvent) {
        if (!isPointerDown) return;

        if (!dragThresholdExceeded) {
            const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
            if (dist > 10) {
                dragThresholdExceeded = true;
                isDragging = true;
                if (!isOpen) openMenu();
            }
        }

        if (isDragging && fabEl) {
            const fabRect = fabEl.getBoundingClientRect();
            const fabCx = fabRect.left + fabRect.width / 2;
            const fabCy = fabRect.top + fabRect.height / 2;
            const dx = e.clientX - fabCx;
            const dy = e.clientY - fabCy;

            let closest: number | null = null;
            let closestDist = Infinity;
            for (let i = 0; i < allItems.length; i++) {
                const pos = positions[i];
                const dist = Math.hypot(dx - pos.x, dy - pos.y);
                if (dist < closestDist) {
                    closestDist = dist;
                    closest = i;
                }
            }
            // Increase distance threshold for selection dynamically based on rings
            hoveredIndex = closestDist < 80 ? closest : null;
        }
    }

    function handlePointerUp(e: PointerEvent) {
        if (!isPointerDown) return;
        isPointerDown = false;

        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }

        if (isDragging) {
            if (hoveredIndex !== null) {
                activateItem(hoveredIndex);
            } else {
                closeMenu();
            }
            // Clear drag state on next tick so click handler can ignore the click
            setTimeout(() => {
                isDragging = false;
                dragThresholdExceeded = false;
            }, 0);
        }
    }

    function activateItem(index: number) {
        const item = allItems[index];
        if (item.kind === "nav") {
            goto(item.href);
            closeMenu();
        } else {
            toggleTheme();
            // don't close — let user see the change
        }
    }

    let fabEl: HTMLButtonElement;
</script>

<svelte:window
    on:pointermove={handlePointerMove}
    on:pointerup={handlePointerUp}
    on:pointercancel={handlePointerUp}
/>

<!-- Backdrop -->
{#if isOpen}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
        class="fixed inset-0 z-[998] bg-black/30 backdrop-blur-sm transition-opacity duration-300"
        on:click={closeMenu}
    ></div>
{/if}

<!-- Drag label bar -->
{#if isDragging && hoveredIndex !== null}
    <div
        class="fixed top-0 left-0 right-0 z-[1001] flex items-center justify-center py-3 px-4
               bg-white/10 backdrop-blur-xl border-b border-white/20 dark:bg-black/30
               text-gray-900 dark:text-gray-100 font-semibold text-lg tracking-wide
               animate-slideDown"
    >
        {allItems[hoveredIndex].label}
    </div>
{/if}

<!-- Radial items -->
{#if isOpen}
    <div
        class="fixed bottom-6 right-6 w-14 h-14 z-[999] pointer-events-none"
        role="menu"
        aria-label="Navigation menu"
    >
        {#each allItems as item, i}
            {@const pos = positions[i]}
            {@const isActive =
                item.kind === "nav" && $page.url.pathname === item.href}
            {@const isHovered = hoveredIndex === i}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div
                class="radial-item absolute flex items-center justify-center pointer-events-auto"
                style="
                    --tx: {pos.x}px;
                    --ty: {pos.y}px;
                    --delay: {i * 30}ms;
                    width: 48px; height: 48px;
                    left: 50%; top: 50%;
                    margin-left: -24px; margin-top: -24px;
                "
                role="menuitem"
                tabindex="0"
                on:click={() => activateItem(i)}
            >
                <div
                    class="w-12 h-12 rounded-full flex items-center justify-center
                           transition-all duration-200 shadow-lg border
                           {isHovered
                        ? 'bg-cyan-500/30 border-cyan-400 scale-125 shadow-cyan-500/40'
                        : isActive
                          ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-500 dark:text-cyan-400'
                          : 'bg-white/15 dark:bg-white/10 border-white/25 dark:border-white/15 backdrop-blur-xl text-gray-800 dark:text-gray-200 hover:bg-white/30 dark:hover:bg-white/20'}"
                >
                    {#if item.kind === "nav"}
                        <Icon
                            name={item.icon}
                            size={22}
                            variant={isActive ? "filled" : "hollow"}
                        />
                    {:else}
                        <Icon name={item.icon} size={22} />
                    {/if}
                </div>
            </div>
        {/each}
    </div>
{/if}

<!-- FAB -->
<button
    bind:this={fabEl}
    class="fixed bottom-6 right-6 z-[1000] w-14 h-14 rounded-full flex items-center justify-center
           bg-white/15 dark:bg-white/10 backdrop-blur-xl border border-white/25
           dark:border-white/15 shadow-xl text-cyan-500 dark:text-cyan-400
           hover:bg-white/25 dark:hover:bg-white/20 hover:scale-110
           active:scale-95 transition-all duration-200 md:hidden
           {isOpen ? 'rotate-45' : ''}"
    style="touch-action: none;"
    aria-label={isOpen ? "Close menu" : "Open menu"}
    on:click={handleFabClick}
    on:pointerdown={handlePointerDown}
>
    {#if isOpen}
        <Icon name="close" size={24} />
    {:else}
        <Icon name="lightning-bolt" variant="filled" size={24} />
    {/if}
</button>

<style>
    /* ── Item fly-out animation ─────────────────────────────── */
    .radial-item {
        animation: flyOut 300ms ease-out forwards;
        animation-delay: var(--delay);
        opacity: 0;
        transform: translate(0, 0);
    }

    @keyframes flyOut {
        from {
            opacity: 0;
            transform: translate(0, 0) scale(0.3);
        }
        to {
            opacity: 1;
            transform: translate(var(--tx), var(--ty)) scale(1);
        }
    }

    /* ── Label bar slide-down ───────────────────────────────── */
    .animate-slideDown {
        animation: slideDown 200ms ease-out forwards;
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-100%);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>
