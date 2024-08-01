<script lang="ts">
	import type { PageData } from './$types';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api.js';
	import type { Id } from '$convex/_generated/dataModel';
	import { Button } from '$lib/components/ui/button';
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
	import { imageMetaSchema, type imageMeta } from '$lib/schemas';
	import CardCarousel from '$lib/components/CardCarousel.svelte';
	import FolderForm from '$lib/components/FolderForm.svelte';

	const sampleTags: string[] = [
		'screenshot',
		'passport',
		'document',
		'bill',
		'family',
		'city',
		'vacation',
		'landscape',
		'pet',
		'art',
		'male',
		'female'
	];

	const client = useConvexClient();
	const meta = useQuery(api.meta.getAll, {}); // Destructure data, isLoading, and error from useQuery

	let { data }: { data: PageData } = $props();

	let similarImageId: Id<'meta'> | null = $state(null);
	let selectedTags: string[] = $state([...sampleTags]); // Initialize with all sample tags selected

	// Add console logs for debugging
	console.log('isLoading:', meta.isLoading);
	console.log('error:', meta.error);
	console.log('images:', meta.data);
	console.log('stale:', meta.isStale);

	async function handleAddFolder(folderPath: string): Promise<void> {
		console.log('folderPath:', folderPath);
		const absoluteDirectoryPath = folderPath;
		try {
			const response = await fetch('/api/copy-to-db', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ absoluteDirectoryPath })
			});
			if (!response.ok) {
				throw new Error('Failed to add folder');
			}
			const data = await response.json();
			console.log('Folder added successfully:', data);
		} catch (error) {
			console.error('Error adding folder:', error);
		}
	}

	async function handleScanImageDirectory(): Promise<void> {
		try {
			const response = await fetch('/api/scan-image-directory');
			if (!response.ok) {
				throw new Error('Failed to scan directory');
			}
			const data = await response.json();
			console.log('data:', data);

			processImageBatch(data.files);
		} catch (error) {
			console.error('Error scanning directory:', error);
		}
	}

	async function handleScanJsonDirectory(): Promise<void> {
		try {
			const response = await fetch('/api/scan-json-directory');
			if (!response.ok) {
				throw new Error('Failed to scan directory');
			}
			const data = await response.json();
			console.log('data:', data);

			for (const { filePath, metadata } of data) {
				console.log('Processing file:', filePath);
				for (const meta of metadata) {
					// Validate metadata using imageMetaSchema
					const parsedMeta = imageMetaSchema.parse(meta);
					await client.mutation(api.meta.addMeta, {
						path: parsedMeta.path,
						type: parsedMeta.type,
						title: parsedMeta.title,
						description: parsedMeta.description,
						tags: parsedMeta.tags,
						matching: parsedMeta.matching,
						embedding: parsedMeta.embedding
					});
				}
			}
			console.log('Jsons added successfully');
		} catch (error) {
			console.error('Error scanning directory:', error);
		}
	}

	async function handleDeleteMeta(id: Id<'meta'>): Promise<void> {
		try {
			client.mutation(api.meta.deleteMeta, { id: id as Id<'meta'> });
			console.log('Meta deleted successfully');
		} catch (error) {
			console.error('Error deleting meta:', error);
		}
	}

	async function handleUpdateMeta(id: Id<'meta'>, imgPath: string): Promise<void> {
		try {
			const response = await fetch('/api/update-image-meta', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json' // Set content type to plain text
				},
				body: JSON.stringify({ path: imgPath, sampleTags: sampleTags }) // Send the image path as plain text
			});
			if (!response.ok) {
				throw new Error('Failed to process image');
			}
			const dataWithExtra = await response.json();
			console.log('Image processed successfully:', dataWithExtra);
			const data = dataWithExtra.data;

			// Ensure the updateMeta mutation is called with the correct fields
			await client.mutation(api.meta.updateMeta, {
				id: id as Id<'meta'>,
				title: data.title,
				description: data.description,
				tags: data.tags,
				matching: data.matching,
				embedding: data.embedding,
				type: data.type
			});
		} catch (error) {
			console.error('Error processing image:', error);
		}
	}

	async function handleSimilarMeta(id: Id<'meta'>) {
		const similarMeta = await client.action(api.search.mostSimilarMeta, { id });
		similarImageId = similarMeta?._id ?? null;
	}

	async function processImageBatch(imgPaths: string[]): Promise<void> {
		try {
			const response = await fetch('/api/process-image-batch', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json' // Set content type to plain text
				},
				body: JSON.stringify({ paths: imgPaths, sampleTags: sampleTags }) // Send the image path as plain text
			});
			if (!response.ok) {
				throw new Error('Failed to process image');
			}
			const dataWithExtra = await response.json();
			console.log('Images processed successfully:', dataWithExtra);
			const data = dataWithExtra.data;

			for (const meta of data) {
				// Ensure the updateMeta mutation is called with the correct fields
				await client.mutation(api.meta.addMeta, {
					path: meta.path,
					type: meta.type,
					title: meta.title,
					description: meta.description,
					tags: meta.tags,
					matching: meta.matching,
					embedding: meta.embedding
				});
			}
		} catch (error) {
			console.error('Error processing image:', error);
		}
	}

	async function handleRunTsneVisualization(): Promise<void> {
		try {
			const response = await fetch('/api/run-tsne-visualization');
			if (!response.ok) {
				throw new Error('Failed to run t-SNE visualization');
			}
			const data = await response.json();
			console.log('t-SNE visualization run successfully:', data);
		} catch (error) {
			console.error('Error running t-SNE visualization:', error);
		}
	}

	function getUniqueTags(metaData: imageMeta[]): [string, number][] {
		const tagCounts: Record<string, number> = {};
		metaData.forEach((meta: imageMeta) => {
			meta.matching.forEach((tag: string) => {
				tagCounts[tag] = (tagCounts[tag] || 0) + 1;
			});
		});
		return Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
	}

	const uniqueTags = $derived(meta.data ? getUniqueTags(meta.data) : []);
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Synth" />
</svelte:head>

<header class="flex items-center justify-between bg-blue-500 p-4 text-white">
	<h1 class="text-2xl font-bold">Images Gallery with Tags and Description and Suggested Title</h1>
	<Button class="rounded bg-white px-4 py-2 text-blue-500" on:click={handleScanImageDirectory}>
		Process Image Directory
	</Button>
	<Button class="rounded bg-white px-4 py-2 text-blue-500" on:click={handleScanJsonDirectory}>
		Scan Json Directory
	</Button>
</header>

<main class="p-4">
	{#if meta.isLoading}
		<p>Loading images...</p>
	{:else if meta.error}
		<p>Error loading images: {meta.error}</p>
	{:else if meta.data && meta.data.length > 0}
		<div class="grid grid-cols-1 gap-4">
			{#each uniqueTags as [tag, count]}
				<div>
					<h2 class="mb-2 text-xl font-bold">{tag} ({count})</h2>
					<CardCarousel
						sortedMetaDataArray={meta.data.filter((m) => m.matching.includes(tag))}
						folderPath="db/media"
						{handleDeleteMeta}
						{handleUpdateMeta}
						{handleSimilarMeta}
						{similarImageId}
					/>
				</div>
			{/each}
		</div>
	{:else}
		<FolderForm data={data.form} {handleAddFolder} />
	{/if}

	<ToggleGroup.Root size="lg" type="multiple" bind:value={selectedTags}>
		{#each sampleTags as tag}
			<ToggleGroup.Item value={tag} aria-label="Toggle {tag}">
				<div
					style="display: inline-block; margin: 0 4px; cursor: pointer; background-color: {selectedTags.includes(
						tag
					)
						? '#007BFF'
						: 'initial'}; color: {selectedTags.includes(tag)
						? 'white'
						: 'initial'}; padding: 4px 8px; border-radius: 4px;"
				>
					{tag}
				</div>
			</ToggleGroup.Item>
		{/each}
	</ToggleGroup.Root>
</main>

<footer class="bg-gray-800 p-4 text-center text-white">
	<p>© 2023 Sample HTML Page. All rights reserved.</p>
</footer>
