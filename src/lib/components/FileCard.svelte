<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import * as Card from "$lib/components/ui/card";
    import { AspectRatio } from "$lib/components/ui/aspect-ratio";
    import { ToggleGroup, ToggleGroupItem } from "$lib/components/ui/toggle-group";
    import { Checkbox } from "$lib/components/ui/checkbox";
    import IconButton from "$lib/components/IconButton.svelte";
    import type { Id } from '$convex/_generated/dataModel';

    export let metaData: {
      _id: Id<"meta">;
      _creationTime: number;
      path: string;
      title: string;
      type: string;
      description: string;
      tags: string[];
      matching: string[];
      embedding: number[];
    };
    export let setActiveImage: (fileUrl: string, event: MouseEvent) => void = () => {};
    export let handleDeleteMeta: (id: Id<"meta">) => Promise<void>;
    export let handleUpdateMeta: (id: Id<"meta">, imgPath: string) => Promise<void>;
    export let handleSimilar: (id: Id<"meta">) => void;
    let selectedTags: string[] = [];
    let selectedMatching: string[] = [];
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

    function requestSimilar() {
      handleSimilar(metaData._id);
    }

    // patch db on assign tags from samples
  </script>

  <Card.Root class="max-w-[450px] mx-auto p-4 bg-white rounded-md shadow-md">
    <Card.Header class="flex-row justify-between items-center">
      <Button variant="default" on:click={() => {} /*writeData(metaData.path, metaData.title, metaData.description, metaData.tags);*/}>
        Write
      </Button>
      <Button variant="default" on:click={requestSimilar}>
        Similar
      </Button>
      <IconButton title="Regenerate meta" onClick={() => handleUpdateMeta(metaData._id, metaData.path)} />
      <Checkbox class="ml-2" bind:checked={isChecked} />
      <Card.Title class="ml-2">{metaData.path.split("/").pop()}</Card.Title>
      <IconButton title="Delete" onClick={() => handleDeleteMeta(metaData._id)} iconType="x" />
    </Card.Header>
    <Card.Content>
      <AspectRatio ratio={16 / 9} class="bg-muted w-full">
        <Button on:click={(e) => { setActiveImage(metaData.path, e); }} variant="ghost" class="w-full h-full">
          <img src={metaData.path} alt={""} class="rounded-md object-contain w-full h-full" />
        </Button>
      </AspectRatio>
        <Input id="title" bind:value={metaData.title} class="flex-grow" contenteditable="true" />


        <Input id="description" bind:value={metaData.description} class="flex-grow" contenteditable="true" />

    </Card.Content>
    <Card.Footer class="flex-col justify-center mt-4">
        <ToggleGroup type="multiple" bind:value={selectedTags} class="w-full">
          {#each metaData.tags as tag}
            <ToggleGroupItem value={tag} class="{selectedTags.includes(tag) ? 'selected' : ''} px-2 py-1 m-1 border rounded">
              {tag}
            </ToggleGroupItem>
          {/each}
        </ToggleGroup>

        <ToggleGroup type="multiple" bind:value={selectedMatching} class="mt-4 w-full border-teal-500">
          {#each metaData.matching as tag}
            <ToggleGroupItem value={tag} class="{selectedMatching.includes(tag) ? 'selected' : ''} px-2 py-1 m-1 border rounded font-extrabold">
              {tag}
            </ToggleGroupItem>
            {/each}
          </ToggleGroup>
    </Card.Footer>
  </Card.Root>