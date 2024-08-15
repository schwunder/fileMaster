<script lang="ts">
    import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';

    export let tags: string[];
    export let selectedTags: string[];
    export let onTagsChange: (tags: string[]) => void;

    function handleTagChange(newSelectedTags: string[]) {
        selectedTags = newSelectedTags;
        onTagsChange(selectedTags);
    }
</script>

<ToggleGroup.Root 
    size="lg" 
    type="multiple" 
    bind:value={selectedTags} 
    on:change={() => handleTagChange(selectedTags)} 
    class="flex flex-wrap gap-2 pt-5"
>
    {#each tags as tag}
        <ToggleGroup.Item value={tag} aria-label="Toggle {tag}" class="flex-none">
            <div class="inline-block cursor-pointer px-2 py-1 rounded transition-colors duration-200 {selectedTags.includes(tag) ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground'}">
                {tag}
            </div>
        </ToggleGroup.Item>
    {/each}
</ToggleGroup.Root>