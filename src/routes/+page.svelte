<script lang="ts">
    import LightningBackground from "$lib/components/LightningBackground.svelte";
    import Title from "$lib/components/content/Title.svelte";
</script>

<div class="relative min-h-screen overflow-hidden">
    <LightningBackground startFromMainTitle={true} />

    <div class="container mx-auto p-4 relative z-10">
        <Title type="h1" text="Powerbored" />
    </div>
</div>
