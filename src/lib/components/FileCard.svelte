<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import * as Card from "$lib/components/ui/card";
    import { AspectRatio } from "$lib/components/ui/aspect-ratio";
    import { ToggleGroup, ToggleGroupItem } from "$lib/components/ui/toggle-group";
    import { Checkbox } from "$lib/components/ui/checkbox";
   //import { processImage, writeData, filterTags } from "../api";
  
    export let metaData: {
      imgPath: string;
      title: string;
      description: string;
      tags: string[];
      matchingTags: string[];
    };
    export let onImageClick: (imgUrl: string, event: MouseEvent) => void = () => {};
    let selectedTags: string[] = [];
    let selectedMatchingTags: string[] = [];
    let isChecked: boolean = false;
    const sampleTags = [
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
// patch db on assign tags from samples
  </script>
  
  <Card.Root class="max-w-[450px] mx-auto p-4 bg-white rounded-md shadow-md">
    <Card.Header class="flex items-center">
      <Card.Title>{metaData.imgPath.split("/").pop()}</Card.Title>
      <Checkbox class="ml-auto" bind:checked={isChecked} />
    </Card.Header>
    <Card.Content>
      <AspectRatio ratio={16 / 9} class="bg-muted w-full">
        <Button on:click={(e) => { /*processImage(metaData.imgPath);*/ onImageClick(metaData.imgPath, e); }} variant="ghost" class="w-full h-full">
          <img src={`http://localhost:3000/${metaData.imgPath}`} alt={""} class="rounded-md object-contain w-full h-full" />
        </Button>
      </AspectRatio>
      <Input id="title" bind:value={metaData.title} class="mt-4 w-full" contenteditable="true" />
      <ToggleGroup type="multiple" bind:value={selectedTags} class="mt-4 w-full">
        {#each metaData.tags as tag}
          <ToggleGroupItem value={tag} class="{selectedTags.includes(tag) ? 'selected' : ''} px-2 py-1 m-1 border rounded">
            {tag}
          </ToggleGroupItem>
        {/each}
      </ToggleGroup>
      <ToggleGroup type="multiple" bind:value={selectedMatchingTags} class="mt-4 w-full border-teal-500">
        {#each metaData.matchingTags as tag}
          <ToggleGroupItem value={tag} class="{selectedMatchingTags.includes(tag) ? 'selected' : ''} px-2 py-1 m-1 border rounded font-extrabold">
            {tag}
          </ToggleGroupItem>
        {/each}
      </ToggleGroup>
      <Input id="description" bind:value={metaData.description} class="mt-4 w-full" contenteditable="true" />
    </Card.Content>
    <Card.Footer class="flex justify-end mt-4">
      <Button variant="default" class="mr-2" on:click={() => {} /*writeData(metaData.imgPath, metaData.title, metaData.description, metaData.tags);*/}>
        Write
      </Button>
      <Button variant="secondary" class="mr-2" on:click={() => {} /*filterTags(metaData.description, metaData.tags);*/}>
        Assign tags from samples
      </Button>
      <Button variant="ghost">
        Discard
      </Button>
    </Card.Footer>
  </Card.Root>