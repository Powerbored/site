<script>
    import Title from "$lib/components/content/Title.svelte";
    import NodeCanvas from "$lib/components/node-editor/NodeCanvas.svelte";
    import JsonDrawer from "$lib/components/node-editor/JsonDrawer.svelte";
</script>

<svelte:head>
    <title>Logic Node Editor - Powerbored</title>
</svelte:head>

<div class="h-screen w-full overflow-hidden flex flex-col">
    <!-- Canvas takes full screen -->
    <NodeCanvas />
    <JsonDrawer />
</div>
