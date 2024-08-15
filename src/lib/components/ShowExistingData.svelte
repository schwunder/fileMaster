<script lang="ts">
  import type { SourceMeta, MetadataValue } from '../utilities/extraction';
  import { Button } from '$lib/components/ui/button';
  import { getImageUrl, parseJSON } from '../utilities/string'; // Import the functions

  export let sourceMeta: SourceMeta = [];
  export let onHide: () => void;
  export let onExtract: () => void;

  let error: string | null = null;

  const handleImageError = (event: Event): void => {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.style.display = 'none';
    }
  };

  $: {
    console.log('ShowExistingData component received sourceMeta:', sourceMeta);
    console.log('sourceMeta length:', sourceMeta.length);
    console.log('sourceMeta type:', typeof sourceMeta);
    if (Array.isArray(sourceMeta)) {
      console.log('sourceMeta is an array');
    } else {
      console.log('sourceMeta is not an array');
    }
  }
</script>

{#if sourceMeta.length > 0}
  <div class="flex flex-col items-center justify-center container mx-auto p-4 max-w-2xl">
    <h2 class="text-2xl font-bold mb-4">Existing Data</h2>
    {#if error}
      <div class="error">{error}</div>
    {:else}
      {#each sourceMeta as { filePath, metadata, relativePath }}
        <div class="border border-gray-300 rounded-lg p-4 mb-4">
          <h3 class="text-xl font-semibold mb-2">{relativePath}</h3>
          <img 
            src={getImageUrl(relativePath)} 
            alt={relativePath.split('/').pop() || ''}
            class="w-64 h-64 object-cover mb-4"
            on:error={handleImageError}
          />
          <div class="grid gap-2">
            {#each Object.entries(metadata) as [key, value]}
              <div class="bg-gray-100 rounded-md p-2">
                <strong class="font-medium">{key}:</strong>
                <pre class="whitespace-pre-wrap break-words text-sm leading-5 max-h-52 overflow-y-auto bg-gray-200 p-2 rounded-md">
                  {#if typeof value === 'string'}
                    {#if value.startsWith('{') || value.startsWith('[')}
                      {#if parseJSON(value)}
                        {JSON.stringify(parseJSON(value), null, 2)}
                      {:else}
                        {value}
                      {/if}
                    {:else}
                      {value}
                    {/if}
                  {:else}
                    {JSON.stringify(value)}
                  {/if}
                </pre>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    {/if}
    <Button on:click={onHide} class="mt-4 flex flex-col items-center justify-center mx-auto">Hide Source Meta</Button>
  </div>
{:else}
  <Button on:click={onExtract} class="flex flex-col items-center justify-center mx-auto">Extract Source Meta</Button>
{/if}