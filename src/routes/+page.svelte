<script lang="ts">
	import type { PageData } from './$types';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api.js';
	import type { Id } from '$convex/_generated/dataModel';
	import { Button } from '$lib/components/ui/button';
	import { imageMetaSchema, type imageMeta, sampleTags } from '$lib/schemas';
	import CardCarousel from '$lib/components/CardCarousel.svelte';
	import FolderForm from '$lib/components/FolderForm.svelte';
	import Tsne from '$lib/components/Tsne.svelte';
	import ShowExistingData from '$lib/components/ShowExistingData.svelte';
	import TagSelector from '$lib/components/TagSelector.svelte';
	import type { SourceMeta } from '$lib/utilities/metadata-extraction/extraction';
	import Antv from '$lib/components/Antv.svelte';

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
	let sourceMeta: SourceMeta = $state([]);

	const handleAddFolder = async (folderPath: string): Promise<void> => {
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
				// Filter out existing files
				const existingFiles = await client.query(api.meta.getAllPaths, {});
				const filesToProcess = data.newFiles.filter((file: string) => !existingFiles.includes(file));
				
				if (filesToProcess.length > 0) {
					console.log('Files to process:', filesToProcess);
					await processImageBatch(filesToProcess);
				} else {
					console.log('All files already exist in the library');
				}
			} else {
				console.log('No new files copied');
			}

			await client.query(api.meta.getAll, {});
		} catch (error) {
			console.error('Error adding folder:', error);
		}
	};

	const processImageBatch = async (imgPaths: string[]): Promise<void> => {
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
						originalPath: meta.originalPath,
						convertedPath: meta.convertedPath,
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
	};

	const handleScanImageDirectory = async (): Promise<void> => {
		try {
			const response = await fetch('/api/scan-image-directory');
			if (!response.ok) {
				throw new Error('Failed to scan directory');
			}
			const data = await response.json();
			console.log('Scanned directory data:', data);

			if (data.files && data.files.length > 0) {
				// Use the new getNewPaths query to filter out existing paths
				const newFiles = await client.query(api.meta.getNewPaths, { scannedPaths: data.files });
				console.log('New files to process:', newFiles);

				if (newFiles.length > 0) {
					await processImageBatch(newFiles);
				} else {
					console.log('No new files to process');
				}
			} else {
				console.log('No files found in the scanned directory');
			}

			// Trigger a refetch of the data
			await client.query(api.meta.getAll, {});
		} catch (error) {
			console.error('Error scanning image directory:', error);
		}
	};

	const handleScanJsonDirectory = async (): Promise<void> => {
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
					const parsedMeta = imageMetaSchema.parse({
						...meta,
						originalPath: meta.path, // Add this line
						convertedPath: meta.path, // Add this line
						processed: 1
					});
					await client.mutation(api.meta.addMeta, parsedMeta);
				}
			}
			console.log('Jsons added successfully');
		} catch (error) {
			console.error('Error scanning directory:', error);
		}
	};

	const handleExtractSourceMeta = async (): Promise<void> => {
		try {
			const response = await fetch('/api/extract-source-meta');
			if (!response.ok) {
				throw new Error('Failed to extract source metadata');
			}
			const data = await response.json();
			if (data.success && Array.isArray(data.results)) {
				sourceMeta = data.results;
				console.log('Source metadata extracted successfully:', sourceMeta);
				console.log('sourceMeta length:', sourceMeta.length);
			} else {
				throw new Error('Invalid response format');
			}
		} catch (error) {
			console.error('Error extracting source metadata:', error);
			sourceMeta = [];
		}
	};

	const handleDeleteMeta = async (id: Id<'meta'>): Promise<void> => {
		try {
			client.mutation(api.meta.deleteMeta, { id: id as Id<'meta'> });
			console.log('Meta deleted successfully');
		} catch (error) {
			console.error('Error deleting meta:', error);
		}
	};

	const handleDeleteAllMeta = async () => {
		try {
			await client.mutation(api.meta.deleteAllMeta, {});
			console.log("All meta entries deleted");
			// Optionally, refresh your data here
		} catch (error) {
			console.error("Error deleting meta entries:", error);
		}
	};

	const handleUpdateMeta = async (id: Id<'meta'>, imgPath: string): Promise<void> => {
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
					originalPath: data.originalPath,
					convertedPath: data.convertedPath,
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
	};

	const handleSimilarMeta = async (id: Id<'meta'>) => {
		const similarMeta = await client.action(api.search.mostSimilarMeta, { id });
		similarImageId = similarMeta?._id ?? null;
	};

	const handleRunTsneVisualization = async (): Promise<void> => {
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
	};

	const getUniqueTags = (metaData: imageMeta[]): [string, number][] => {
		const tagCounts: Record<string, number> = {};
		metaData.forEach((meta: imageMeta) => {
			meta.matching.forEach((tag: string) => {
				tagCounts[tag] = (tagCounts[tag] || 0) + 1;
			});
		});
		return Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
	};

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
		<Antv />

		<!-- Existing content -->
		<div>
			{#if metaIsLoading}
				<p>Loading images...</p>
			{:else if metaError}
				<p>Error loading images: {metaError}</p>
			{:else if metaData && metaData.length > 0}
				<div class="space-y-8">
					<ShowExistingData 
					sourceMeta={sourceMeta}
					onHide={() => sourceMeta = []}
					onExtract={handleExtractSourceMeta}
				/>
				<Tsne 
					metaData={metaData.map(m => ({
						originalPath: m.originalPath,
						convertedPath: m.convertedPath,
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
					{#each uniqueTags as [tag, count]}
						<CardCarousel
							tag={tag}
							count={count}
							sortedMetaDataArray={metaData.filter((m) => m.matching.includes(tag))}
							folderPath="db/media"
							{handleDeleteMeta}
							{handleUpdateMeta}
							{handleSimilarMeta}
							{similarImageId}
						/>
					{/each}
				</div>
			{:else}
				<p>No images found. Add a folder to get started.</p>
			{/if}
		</div>
	</div>

	<TagSelector 
	tags={sampleTags} 
	bind:selectedTags 
	onTagsChange={(newTags) => { selectedTags = newTags; }}
/>
</main>

<footer class="bg-gray-800 p-4 text-center text-white">
	<p>© 2023 Sample HTML Page. All rights reserved.</p>
</footer>