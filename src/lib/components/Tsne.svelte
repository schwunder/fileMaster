<script lang="ts">
	import { tick } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { runTsneVisualization, normalizeCoordinates, renderEmbedding } from '$lib/utilities/tsne';
	import type { imageMeta } from '$lib/schemas';

	export let metaData: imageMeta[];
	export let folderPath: string;

	let canvas: HTMLCanvasElement;
	let showCanvas = false;
	let showButton = true;
	let marginPx = 75;
	let canvasSize = 5000; // Increased from 800 to 5000
	let imageSize = 250; // Increased from 40 to 250
	// TODO: similiar motiv batching. 
	// maybe use the coordinates to group the images
	// and then add that to the meta data.
	// smth like cluter 1 cluster 2 cluster 3 etc.
	// and then use that to group the images
	// then have a button to run a other ai api call over that cluster.
	const handleTsneVisualization = async () => {
		try {
			const embeddingData = metaData.map(meta => meta.embedding);
			const coordinates = runTsneVisualization(embeddingData);
			if (!Array.isArray(coordinates)) {
				throw new Error('Invalid coordinates format');
			}

			const adjustedCoordinates = normalizeCoordinates(coordinates, 0, 1, marginPx, canvasSize);

			showCanvas = true;
			showButton = false;
			await tick();
			const context = canvas.getContext('2d');
			if (context) {
				const imagePaths = metaData.map(meta => meta.originalPath);
				await renderEmbedding(context, adjustedCoordinates, imageSize, canvas, imagePaths, folderPath);
			}
		} catch (err) {
			console.error('Visualization error:', err);
		}
	};
</script>

<div class="flex flex-col items-center justify-center">
	{#if showButton}
	<Button on:click={handleTsneVisualization}>Start t-SNE Visualization</Button>
{/if}
{#if showCanvas}
	<canvas bind:this={canvas} width={canvasSize} height={canvasSize}></canvas>
{/if}
</div>