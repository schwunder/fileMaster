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
	const meta = useQuery(api.meta.getAll, {}); // Destructure data, isLoading, and error from useQuery

	let { data }: { data: PageData } = $props();

	let similarImageId: Id<'meta'> | null = $state(null);
	let selectedTags: string[] = $state([...sampleTags]); // Initialize with all sample tags selected
	let sourceMeta: SourceMeta | null = $state(null); // Correct the type definition

	// Add console logs for debugging
	console.log('isLoading:', meta.isLoading);
	console.log('error:', meta.error);
	console.log('images:', meta.data);
	console.log('stale:', meta.isStale);

	async function handleAddFolder(folderPath: string): Promise<void> {
    console.log('folderPath:', folderPath);
    const absoluteDirectoryPath = folderPath;
    try {
        // Send a request to copy files to the db/media folder
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

        // Process only the newly added images
        if (data.newFiles && data.newFiles.length > 0) {
            await processImageBatch(data.newFiles);
        }

        // Trigger a refresh of the image data
        await handleScanImageDirectory();
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
			const metaItem = meta.data?.find(m => m._id === id);
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

	async function processImageBatch(imgPaths: string[]): Promise<void> {
    try {
        const response = await fetch('/api/process-image-batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ paths: imgPaths, sampleTags: sampleTags })
        });
        if (!response.ok) {
            throw new Error('Failed to process image');
        }
        const dataWithExtra = await response.json();
        console.log('Images processed successfully:', dataWithExtra);
        const data = dataWithExtra.data;

        for (const meta of data) {
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
	<Button class="rounded bg-white px-4 py-2 text-blue-500" on:click={handleDeleteAllMeta}>Delete All Meta Entries</Button>
</header>

<main class="p-4">
	{#if meta.isLoading}
		<p>Loading images...</p>
	{:else if meta.error}
		<p>Error loading images: {meta.error}</p>
	{:else if meta.data && meta.data.length > 0}
		<div class="grid grid-cols-1 gap-4">
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
					metaData={meta.data ? meta.data.map(m => ({
						path: m.path,
						title: m.title,
						type: m.type,
						description: m.description,
						tags: m.tags,
						matching: m.matching,
						embedding: m.embedding,
						processed: m.processed ?? 1 // Use the existing processed value or default to 1
					})) : []} 
					folderPath=""
				/>
			</div>
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