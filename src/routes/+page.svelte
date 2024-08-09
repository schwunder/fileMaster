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
	import Tsne from '$lib/components/Tsne.svelte';
	import ShowExistingData from '$lib/components/ShowExistingData.svelte';
	import type { SourceMeta } from '$lib/utilities/extraction';

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
	let meta = $state(useQuery(api.meta.getAll, {}));

	// Create derived values for meta properties
	const metaData = $derived(meta.data);
	const metaIsLoading = $derived(meta.isLoading);
	const metaError = $derived(meta.error);
	const metaIsStale = $derived(meta.isStale);

	// Add console logs for debugging
	$effect(() => {
		console.log('isLoading:', metaIsLoading);
		console.log('error:', metaError);
		console.log('images:', metaData);
		console.log('stale:', metaIsStale);
	});

	let { data }: { data: PageData } = $props();

	let similarImageId: Id<'meta'> | null = $state(null);
	let selectedTags: string[] = $state([...sampleTags]); // Initialize with all sample tags selected
	let sourceMeta: SourceMeta | null = $state(null); // Correct the type definition

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

			if (data.newFiles && data.newFiles.length > 0) {
				console.log('New files copied:', data.newFiles);
				await processImageBatch(data.newFiles);
			} else {
				console.log('No new files copied');
			}

			await client.query(api.meta.getAll, {});
		} catch (error) {
			console.error('Error adding folder:', error);
		}
	}

	async function processImageBatch(imgPaths: string[]): Promise<void> {
		try {
			console.log('Processing image batch:', imgPaths);

			const response = await fetch('/api/process-image-batch', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ paths: imgPaths, sampleTags })
			});
			if (!response.ok) {
				throw new Error('Failed to process images');
			}
			const dataWithExtra = await response.json();
			console.log('Images processed successfully:', dataWithExtra);
			const data = dataWithExtra.data;

			for (const meta of data) {
				try {
					await client.mutation(api.meta.addMeta, {
						path: meta.path,
						type: meta.type,
						title: meta.title,
						description: meta.description,
						tags: meta.tags,
						matching: meta.matching,
						embedding: meta.embedding,
						processed: meta.processed
					});
					console.log(`Metadata added for ${meta.path}`);
				} catch (error) {
					console.error(`Error adding metadata for ${meta.path}:`, error);
				}
			}
		} catch (error) {
			console.error('Error processing image batch:', error);
		}
	}

	async function handleScanImageDirectory(): Promise<void> {
		try {
			const response = await fetch('/api/scan-image-directory');
			if (!response.ok) {
				throw new Error('Failed to scan directory');
			}
			const data = await response.json();
			console.log('Scanned directory data:', data);

			if (data.files && data.files.length > 0) {
				await processImageBatch(data.files);
			} else {
				console.log('No new files to process');
			}

			// Trigger a refetch of the data
			await client.query(api.meta.getAll, {});
		} catch (error) {
			console.error('Error scanning image directory:', error);
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
					const parsedMeta = imageMetaSchema.parse({...meta, processed: 1});
					await client.mutation(api.meta.addMeta, parsedMeta);
				}
			}
			console.log('Jsons added successfully');
		} catch (error) {
			console.error('Error scanning directory:', error);
		}
	}

	async function handleExtractSourceMeta(): Promise<void> {
		try {
			const response = await fetch('/api/extract-source-meta');
			if (!response.ok) {
				throw new Error('Failed to extract source metadata');
			}
			const data = await response.json();
			sourceMeta = data.results as SourceMeta;
			console.log('Source metadata extracted successfully:', sourceMeta);
		} catch (error) {
			console.error('Error extracting source metadata:', error);
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

	async function handleDeleteAllMeta() {
		try {
			await client.mutation(api.meta.deleteAllMeta, {});
			console.log("All meta entries deleted");
			// Optionally, refresh your data here
		} catch (error) {
			console.error("Error deleting meta entries:", error);
		}
	}

	async function handleUpdateMeta(id: Id<'meta'>, imgPath: string): Promise<void> {
		try {
			const response = await fetch('/api/update-image-meta', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ path: imgPath, sampleTags: sampleTags })
			});
			if (!response.ok) {
				throw new Error('Failed to process image');
			}
			const dataWithExtra = await response.json();
			console.log('Image processed successfully:', dataWithExtra);
			const data = dataWithExtra.data;

			// Ensure the updateMeta mutation is called with the correct fields
			const metaItem = metaData?.find(m => m._id === id);
			if (metaItem) {
				// Use the processed field if it exists, otherwise default to 1
				const processed = 'processed' in metaItem ? metaItem.processed : 1;
				await client.mutation(api.meta.updateMeta, {
					id: id as Id<'meta'>,
					title: data.title,
					description: data.description,
					tags: data.tags,
					matching: data.matching,
					embedding: data.embedding,
					type: data.type,
					processed: processed
				});
			}
		} catch (error) {
			console.error('Error processing image:', error);
		}
	}

	async function handleSimilarMeta(id: Id<'meta'>) {
		const similarMeta = await client.action(api.search.mostSimilarMeta, { id });
		similarImageId = similarMeta?._id ?? null;
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

	const uniqueTags = $derived(metaData ? getUniqueTags(metaData) : []);
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
	<Button class="rounded bg-white px-4 py-2 text-blue-500" on:click={handleDeleteAllMeta}>Delete All Meta Entries</Button>
</header>

<main class="p-4">
	<div class="space-y-8">
		<!-- FolderForm -->
		<div>
			<FolderForm data={data.form} {handleAddFolder} />
		</div>

		<!-- Existing content -->
		<div>
			{#if metaIsLoading}
				<p>Loading images...</p>
			{:else if metaError}
				<p>Error loading images: {metaError}</p>
			{:else if metaData && metaData.length > 0}
				<div class="space-y-8">
					{#if sourceMeta}
						<ShowExistingData {sourceMeta} />
					{:else}
						<Button on:click={handleExtractSourceMeta}>
							Extract Source Meta
						</Button>
					{/if}
					<div>
						<h2>Tsne</h2>
						<Tsne 
							metaData={metaData.map(m => ({
								path: m.path,
								title: m.title,
								type: m.type,
								description: m.description,
								tags: m.tags,
								matching: m.matching,
								embedding: m.embedding,
								processed: m.processed ?? 1
							}))} 
							folderPath=""
						/>
					</div>
					{#each uniqueTags as [tag, count]}
						<div>
							<h2 class="mb-2 text-xl font-bold">{tag} ({count})</h2>
							<CardCarousel
								sortedMetaDataArray={metaData.filter((m) => m.matching.includes(tag))}
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
				<p>No images found. Add a folder to get started.</p>
			{/if}
		</div>
	</div>

	<ToggleGroup.Root size="lg" type="multiple" bind:value={selectedTags} style="padding-top: 20px;">
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