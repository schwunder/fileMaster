<script lang="ts">
	import type { Id } from '$convex/_generated/dataModel';

	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Card from '$lib/components/ui/card';
	import { AspectRatio } from '$lib/components/ui/aspect-ratio';
	import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group';
	import { Checkbox } from '$lib/components/ui/checkbox';

	import IconButton from '$lib/components/IconButton.svelte';
	import { onMount } from 'svelte';

	export let metaData: {
		_id: Id<'meta'>;
		_creationTime: number;
		path: string;
		title: string;
		type: string;
		description: string;
		tags: string[];
		matching: string[];
		embedding: number[];
		processed: number; // Added processed field
	};

	export let setActiveImage: (fileUrl: string, event: MouseEvent) => void = () => {};
	export let handleDeleteMeta: (id: Id<'meta'>) => Promise<void>;
	export let handleUpdateMeta: (id: Id<'meta'>, imgPath: string) => Promise<void>;
	export let handleSimilarMeta: (id: Id<'meta'>) => void;

	let selectedTags: string[] = [];
	let selectedMatching: string[] = [];
	let isChecked: boolean = false;

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let renderedImageDataUrl: string | null = null;

	$: imagePath = metaData.path.toLowerCase().endsWith('.heic') 
		? metaData.path.replace(/\.heic$/i, '.raw') 
		: metaData.path;

	$: isRawImage = imagePath.toLowerCase().endsWith('.raw');

	onMount(() => {
		if (canvas) {
			ctx = canvas.getContext('2d')!;
			if (isRawImage) {
				drawRawImage(imagePath);
			}
		}
	});

	async function drawRawImage(path: string) {
		try {
			const response = await fetch(path);
			const rawData: RawData = await response.json();
			
			if (canvas) {
				canvas.width = rawData.width;
				canvas.height = rawData.height;
				
				const imageData = new ImageData(
					new Uint8ClampedArray(rawData.data),
					rawData.width,
					rawData.height
				);
				ctx.putImageData(imageData, 0, 0);

				// Store the rendered canvas as a data URL
				renderedImageDataUrl = canvas.toDataURL();
			}
		} catch (error) {
			console.error('Error loading raw image:', error);
		}
	}

	function handleImageClick(e: MouseEvent) {
		if (isRawImage && renderedImageDataUrl) {
			setActiveImage(renderedImageDataUrl, e);
		} else {
			setActiveImage(metaData.path, e);
		}
	}

	interface RawData {
		data: number[];
		width: number;
		height: number;
	}
</script>

<Card.Root class="mx-auto max-w-[450px] rounded-md bg-white p-4 shadow-md">
	<Card.Header class="flex-row items-center justify-between">
		<Button variant="default" on:click={() => {}}>Write</Button>
		<Button variant="default" on:click={() => handleSimilarMeta(metaData._id)}>Similar</Button>
		<IconButton
			title="Regenerate meta"
			onClick={() => handleUpdateMeta(metaData._id, metaData.path)}
		/>
		<Checkbox class="ml-2" bind:checked={isChecked} />
		<Card.Title class="ml-2">{metaData.path.split('/').pop()}</Card.Title>
		<IconButton title="Delete" onClick={() => handleDeleteMeta(metaData._id)} iconType="x" />
	</Card.Header>
	<Card.Content>
		<AspectRatio ratio={16 / 9} class="w-full bg-muted">
			<Button
				on:click={handleImageClick}
				variant="ghost"
				class="h-full w-full"
			>
				{#if isRawImage}
					<canvas
						bind:this={canvas}
						class="h-full w-full rounded-md object-contain"
					></canvas>
				{:else}
					<img src={imagePath} alt={''} class="h-full w-full rounded-md object-contain" />
				{/if}
			</Button>
		</AspectRatio>
		<Input id="title" bind:value={metaData.title} class="flex-grow" contenteditable="true" />

		<Input
			id="description"
			bind:value={metaData.description}
			class="flex-grow"
			contenteditable="true"
		/>
	</Card.Content>
	<Card.Footer class="mt-4 flex-col justify-center">
		<ToggleGroup type="multiple" bind:value={selectedTags} class="w-full">
			{#each metaData.tags as tag}
				<ToggleGroupItem
					value={tag}
					class="{selectedTags.includes(tag) ? 'selected' : ''} m-1 rounded border px-2 py-1"
				>
					{tag}
				</ToggleGroupItem>
			{/each}
		</ToggleGroup>

		<ToggleGroup type="multiple" bind:value={selectedMatching} class="mt-4 w-full border-teal-500">
			{#each metaData.matching as tag}
				<ToggleGroupItem
					value={tag}
					class="{selectedMatching.includes(tag)
						? 'selected'
						: ''} m-1 rounded border px-2 py-1 font-extrabold"
				>
					{tag}
				</ToggleGroupItem>
			{/each}
		</ToggleGroup>
	</Card.Footer>
</Card.Root>