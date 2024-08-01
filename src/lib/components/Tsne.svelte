<script>
	import { tick } from 'svelte';
	// import { tsneVisualization } from '../api';
	// import { normalizeCoordinates, renderEmbedding } from '../utilities';
	import { Button } from '$lib/components/ui/button';

	let canvas;
	let showCanvas = false;
	let showButton = true;
	let marginPx = 75; // Default margin in pixels
	let canvasSize = 800; // Canvas size in pixels
	let imageSize = 75; // Image size in pixels

	async function handleTsneVisualization() {
		try {
			const response = {}; //await tsneVisualization();
			//if (!Array.isArray(response.coordinates)) {
			throw new Error('Invalid coordinates format');
			//}

			// Normalize coordinates to fit within the range [0, 1] with a margin
			const adjustedCoordinates = {}; // normalizeCoordinates(response.coordinates, 0, 1, marginPx, canvasSize);

			showCanvas = true;
			showButton = false;
			await tick(); // Wait for the DOM to update
			// const context = canvas.getContext('2d');
			// renderEmbedding(context, adjustedCoordinates, imageSize, canvas);
		} catch (err) {
			console.error('Visualization error:', err);
		}
	}
</script>

{#if showButton}
	<Button on:click={handleTsneVisualization}>Start t-SNE Visualization</Button>
{/if}
{#if showCanvas}
	<canvas bind:this={canvas} width={canvasSize} height={canvasSize}></canvas>
{/if}Íß
