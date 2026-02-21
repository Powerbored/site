<script lang="ts">
    import LightningBackground from "$lib/components/LightningBackground.svelte";
</script>

<div class="relative min-h-screen overflow-hidden">
    <LightningBackground startFromMainTitle={true} />

    <div class="container mx-auto p-4 relative z-10">
        <h1
            class="text-4xl md:text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 drop-shadow-sm mb-8 mt-20"
        >
            <span id="main-title">Powerbored</span>
        </h1>
    </div>
</div>
