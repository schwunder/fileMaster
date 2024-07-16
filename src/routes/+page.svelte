<script lang="ts">
    import type { PageData } from './$types'
    import { useConvexClient, useQuery } from 'convex-svelte'
    import { api } from '$convex/_generated/api.js'
    import type { Id } from '$convex/_generated/dataModel' // Corrected import path
  
  
  
    const client = useConvexClient()
    const meta = useQuery(api.meta.getAll, {}) // Destructure data, isLoading, and error from useQuery
   
    // Add console logs for debugging
    console.log('isLoading:', meta.isLoading)
    console.log('error:', meta.error)
    console.log('images:', meta.data)
    console.log('stale:', meta.isStale )
  
    async function handleScanDirectory(): Promise<void> {
      try {
          const response = await fetch('/api/scan-image-directory');
          if (!response.ok) {
              throw new Error('Failed to scan directory');
          }
          const data = await response.json();
          
          for (const filePath of data.files) {
              await client.mutation(api.meta.addMeta, { path: filePath, type: "image" });
          }
          console.log("Images added successfully");
      } catch (error) {
          console.error("Error scanning directory:", error);
      }
  }
  
    async function handleDeleteMeta(id: string): Promise<void> {
      try {
        client.mutation(api.meta.deleteMeta, {id:  id as Id<"meta"> })
        console.log("Meta deleted successfully")
      } catch (error) {
        console.error("Error deleting meta:", error)
      }
    }
  </script>
  <svelte:head>
    <title>Home</title>
    <meta name="description" content="Synth" />
  </svelte:head>
  
  <header class="bg-blue-500 text-white p-4 flex justify-between items-center">
    <h1 class="text-2xl font-bold">Images Gallery with Tags and Description and Suggested Title</h1>
    <button class="bg-white text-blue-500 px-4 py-2 rounded" on:click={handleScanDirectory}>
      Scan Directory
    </button>
  </header>
  
  <main class="p-4">
    {#if meta.isLoading}
      <p>Loading images...</p>
    {:else if meta.error}
      <p>Error loading images: {meta.error}</p>
    {:else if meta.data && meta.data.length > 0}
      <div class="grid grid-cols-3 gap-4 mt-4">
        {#each meta.data as image}
        <button class="bg-white text-blue-500 px-4 py-2 rounded" on:click={e => handleDeleteMeta(image._id)}>
          Delete meta: {image._id}
        </button>
                <div class="border p-2">
            <!-- svelte-ignore a11y_img_redundant_alt -->
            <img src={`${image.path}`} alt="Gallery image" class="w-full h-48 object-cover" />
          </div>
        {/each}
      </div>
    {:else}
      <p>No images found.</p>
    {/if}
  </main>
  
  <footer class="bg-gray-800 text-white p-4 text-center">
    <p>© 2023 Sample HTML Page. All rights reserved.</p>
  </footer>