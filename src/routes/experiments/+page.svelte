<script>
    import { base } from "$app/paths";
    import Title from "$lib/components/content/Title.svelte";
    const experiments = [{ id: "hello-world", title: "Hello World" }];
</script>

<div class="container mx-auto p-4">
    <Title type="h1" text="Experiments" />
    <ul class="list-disc pl-5">
        {#each experiments as experiment}
            <li>
                <a
                    href="{base}/experiments/{experiment.id}"
                    class="text-blue-600 hover:underline"
                >
                    {experiment.title}
                </a>
            </li>
        {/each}
    </ul>
</div>
