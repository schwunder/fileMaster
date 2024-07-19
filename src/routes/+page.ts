// since there's no dynamic data here, we can prerender
// it so that it gets served as a static asset in production

// export const prerender = true;

/*
<script lang="ts">
  import "./app.css";
  import Tsne from "./lib/Tsne.svelte";
  import { DB } from "../db.ts";
  import { addFolder } from "./api.js";
  import { calculateSimilarities } from "./utilities";
  import { fetchEmbedding } from "./api.js";
  import CardCarousel from "./lib/CardCarousel.svelte";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import * as ToggleGroup from "$lib/components/ui/toggle-group/index.js";

  interface MetaData {
    embedding: number[];
    imgPath: string;
    tags: string[];
    matchingTags: string[];
    title: string;
    description: string;
    timeStamp: number;
  }

  let folderPath: string = "";
  let searchQuery: string = "";
  let metaDataArray: MetaData[] = [];
  let sortedMetaDataArray: MetaData[] = [];
  let isayso: boolean = false;
  const sampleTags: string[] = [
    "screenshot",
    "passport",
    "document",
    "bill",
    "family",
    "city",
    "vacation",
    "landscape",
    "pet",
    "art",
    "male",
    "female",
  ];
  let selectedTags: string[] = [...sampleTags]; // Initialize with all sample tags selected

  // Ensure sortedMetaDataArray is always an array
  $: sortedMetaDataArray = Array.isArray(sortedMetaDataArray) ? sortedMetaDataArray : [];

  function isMetaDataArray(data: any): data is MetaData[] {
      return Array.isArray(data) && data.every(item => 
          'embedding' in item && 
          'imgPath' in item && 
          'matchingTags' in item && 
          'tags' in item && 
          'title' in item && 
          'description' in item && 
          'timeStamp' in item
      );
  }

  async function loadData(): Promise<void> {
      try {
          const data = await DB({
              method: "GET"
          });

          if (isMetaDataArray(data)) {
              metaDataArray = data;
              sortedMetaDataArray = [...metaDataArray];
          } else {
              throw new Error("Invalid data format");
          }
      } catch (error) {
          console.error("Error loading data:", error);
      }
  }

  const handleAddFolder = async (): Promise<void> => {
      await addFolder(folderPath, selectedTags); // Pass selectedTags here
      await loadData();
  };

  const handleSearch = async (): Promise<void> => {
      try {
          const response = await fetchEmbedding(searchQuery);
          const searchEmbedding = response.embedding;

          if (!Array.isArray(searchEmbedding)) {
              throw new Error("Invalid search embedding");
          }

          const similarities = calculateSimilarities(searchEmbedding, metaDataArray);
          sortedMetaDataArray = similarities.sort((a, b) => b.similarity - a.similarity).map(item => item.token);
      } catch (error) {
          console.error("Error in handleSearch:", error);
      }
  };



  // Load data initially
  loadData();
</script>

<header class="bg-blue-500 text-white p-4 flex justify-between items-center">
  <h1 class="text-2xl font-bold">Images Gallery with Tags and Description and Suggested Title</h1>
  <Button class="bg-white text-blue-500 px-4 py-2 rounded" on:click="{() => { isayso = !isayso; }}">
    {isayso ? "Show Images" : "Show TSNE"}
  </Button>
  <Input class="p-2 rounded border bg-gray-100" bind:value="{searchQuery}" type="text" placeholder="Search images..." on:keydown="{(event) => { if (event.key === 'Enter') handleSearch(); }}" />
</header>

<main class="p-4">
  {#if isayso}
    <Tsne></Tsne>
  {:else}
    {#if sortedMetaDataArray.length > 0}
      <CardCarousel {sortedMetaDataArray} {folderPath}></CardCarousel>
    {:else}
      <p class="text-red-500">Add a folder path please then press the button to add it</p>
      <Input class="p-2 rounded border" bind:value="{folderPath}" type="text" placeholder="Enter folder path here" />
      <Button class="bg-blue-500 text-white px-4 py-2 rounded mt-2" on:click="{handleAddFolder}">Add</Button>    
    {/if}
  {/if}

  <ToggleGroup.Root size="lg" type="multiple" bind:value={selectedTags}>
    {#each sampleTags as tag}
      <ToggleGroup.Item value={tag} aria-label="Toggle {tag}">
        <div style="display: inline-block; margin: 0 4px; cursor: pointer; background-color: {selectedTags.includes(tag) ? '#007BFF' : 'initial'}; color: {selectedTags.includes(tag) ? 'white' : 'initial'}; padding: 4px 8px; border-radius: 4px;">
          {tag}
        </div>
      </ToggleGroup.Item>
    {/each}
  </ToggleGroup.Root>
</main>

<footer class="bg-gray-800 text-white p-4 text-center">
  <p>© 2023 Sample HTML Page. All rights reserved.</p>
</footer>

<style>
  :global(body) {
    font-family: Arial, sans-serif;
  }
</style>
*/
