<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { base } from "$app/paths";
    import { page } from "$app/stores";
    import Icon from "$lib/components/Icon.svelte";

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
        {
            href: `${base}/birthday`,
            label: "Birthday",
            icon: "birthday" as const,
        },
        { href: `${base}/chat`, label: "Chat", icon: "chat" as const },
    ];

    let theme: "light" | "dark" | "auto" = "auto";
    let systemTheme: "light" | "dark" = "light";
    let mediaQuery: MediaQueryList;

    function handleSystemThemeChange(e: MediaQueryListEvent) {
        systemTheme = e.matches ? "dark" : "light";
        if (theme === "auto") {
            if (e.matches) {
                document.documentElement.classList.add("dark");
            } else {
                document.documentElement.classList.remove("dark");
            }
        }
    }

    onMount(() => {
        // Media query listener
        mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        systemTheme = mediaQuery.matches ? "dark" : "light";
        mediaQuery.addEventListener("change", handleSystemThemeChange);

        // Check initial state
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

    function applyTheme(newTheme: "light" | "dark" | "auto") {
        if (newTheme === "auto") {
            localStorage.removeItem("theme");
            if (mediaQuery.matches) {
                document.documentElement.classList.add("dark");
            } else {
                document.documentElement.classList.remove("dark");
            }
        } else if (newTheme === "dark") {
            localStorage.theme = "dark";
            document.documentElement.classList.add("dark");
        } else {
            localStorage.theme = "light";
            document.documentElement.classList.remove("dark");
        }
    }

    function toggleTheme() {
        if (theme === "auto") {
            theme = "light";
        } else if (theme === "light") {
            theme = "dark";
        } else {
            theme = "auto";
        }
        applyTheme(theme);
    }

    $: iconName = (
        theme === "auto"
            ? "settings"
            : theme === "dark"
              ? "dark-mode"
              : "light-mode"
    ) as "settings" | "dark-mode" | "light-mode";
    $: label =
        theme === "auto"
            ? `System (${systemTheme === "dark" ? "Dark" : "Light"})`
            : theme === "dark"
              ? "Dark Mode"
              : "Light Mode";
</script>

<nav
    class="group fixed left-0 top-0 h-screen w-16 bg-white/10 backdrop-blur-md border-r border-white/20 transition-all duration-300 hover:w-64 focus-within:w-64 z-50 flex flex-col pt-4 overflow-hidden shadow-lg dark:bg-black/30 dark:border-white/10 justify-between pb-4"
    aria-label="Main Navigation"
>
    <ul class="flex flex-col gap-2 w-full">
        {#each menuItems as item}
            <li>
                <a
                    href={item.href}
                    class="flex items-center h-12 px-4 gap-4 hover:bg-black/5 dark:hover:bg-white/10 transition-colors whitespace-nowrap outline-none focus:bg-black/5 dark:focus:bg-white/10 rounded-r-lg mr-2 {$page
                        .url.pathname === item.href
                        ? 'text-cyan-600 dark:text-cyan-400 bg-black/5 dark:bg-white/5 font-semibold'
                        : 'text-gray-800 dark:text-gray-200 font-medium'}"
                    aria-current={$page.url.pathname === item.href
                        ? "page"
                        : undefined}
                >
                    <span
                        class="text-xl w-8 text-center flex items-center justify-center h-full {$page
                            .url.pathname === item.href
                            ? 'text-cyan-500 dark:text-cyan-400'
                            : ''}"
                        aria-hidden="true"
                    >
                        <Icon
                            name={item.icon}
                            size={24}
                            variant={$page.url.pathname === item.href
                                ? "filled"
                                : "hollow"}
                        />
                    </span>
                    <span
                        class="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 delay-75"
                    >
                        {item.label}
                    </span>
                </a>
            </li>
        {/each}
    </ul>

    <button
        on:click={toggleTheme}
        class="flex items-center h-12 px-4 gap-4 text-gray-800 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors whitespace-nowrap outline-none focus:bg-black/5 dark:focus:bg-white/10 rounded-r-lg mr-2 w-full text-left"
        aria-label="Toggle Theme"
    >
        <span
            class="text-xl w-8 text-center flex items-center justify-center h-full"
            aria-hidden="true"><Icon name={iconName} size={24} /></span
        >
        <span
            class="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 font-medium delay-75"
        >
            {label}
        </span>
    </button>
</nav>
