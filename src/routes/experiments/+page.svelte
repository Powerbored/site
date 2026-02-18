<script>
    const experiments = [
        { id: 'hello-world', title: 'Hello World' }
    ];
</script>

<div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Experiments</h1>
    <ul class="list-disc pl-5">
        {#each experiments as experiment}
            <li>
                <a href="/experiments/{experiment.id}" class="text-blue-600 hover:underline">
                    {experiment.title}
                </a>
            </li>
        {/each}
    </ul>
</div>
