<script lang="ts">
    import LightningBackground from "$lib/components/LightningBackground.svelte";
</script>

<div class="relative min-h-screen overflow-hidden">
    <LightningBackground />

    <div class="container mx-auto p-4 relative z-10">
        <h1
            class="text-4xl md:text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 drop-shadow-sm mb-8 mt-20"
        >
            Powerbored
        </h1>
        <p
            class="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-2xl font-light leading-relaxed"
        >
            Exploring the boundaries of web experimentation and creative coding.
        </p>
        <div class="mt-12 flex gap-4">
            <div class="h-1 w-24 bg-sky-500 rounded-full"></div>
            <div class="h-1 w-12 bg-sky-500/50 rounded-full"></div>
            <div class="h-1 w-6 bg-sky-500/20 rounded-full"></div>
        </div>
    </div>
</div>
