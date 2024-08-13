<script lang="ts">
  import type { SourceMeta, MetadataValue } from '../utilities/extraction';

  export let sourceMeta: SourceMeta = [];

  let error: string | null = null;

  const formatValue = (value: MetadataValue): string => {
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    return String(value);
  };

  const getImageUrl = (relativePath: string): string => {
    return `/${relativePath}`;
  };

  function parseJSON(value: string) {
    try {
      return JSON.parse(value);
    } catch (error) {
      console.warn(`Failed to parse JSON: ${value}`);
      return null;
    }
  }

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

<div class="container">
  <h2 class="text-2xl font-bold mb-4">Existing Data</h2>
  {#if error}
    <div class="error">{error}</div>
  {:else if sourceMeta.length > 0}
    {#each sourceMeta as { filePath, metadata, relativePath }}
      <div class="metadata-item">
        <h3 class="text-xl font-semibold mb-2">{relativePath}</h3>
        <img 
          src={getImageUrl(relativePath)} 
          alt={relativePath.split('/').pop() || ''}
          class="w-64 h-64 object-cover mb-4"
          on:error={handleImageError}
        />
        <div class="metadata-grid">
          {#each Object.entries(metadata) as [key, value]}
            <div class="metadata-entry">
              <strong class="font-medium">{key}:</strong>
              <pre class="json-content">
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
  {:else}
    <p>No source metadata available.</p>
  {/if}
</div>

<style>
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 1rem;
  }

  .metadata-item {
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .metadata-grid {
    display: grid;
    gap: 0.5rem;
  }

  .metadata-entry {
    background-color: #f7fafc;
    border-radius: 0.25rem;
    padding: 0.5rem;
  }

  .json-content {
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 0.875rem;
    line-height: 1.25rem;
    max-height: 200px;
    overflow-y: auto;
    background-color: #edf2f7;
    padding: 0.5rem;
    border-radius: 0.25rem;
  }
</style>