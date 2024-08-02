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
	let canvasSize = 800;
	let imageSize = 40; // Adjust this value to change thumbnail size

	async function handleTsneVisualization() {
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
            const imagePaths = metaData.map(meta => meta.path);
            await renderEmbedding(context, adjustedCoordinates, imageSize, canvas, imagePaths, folderPath);
        }
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
{/if}