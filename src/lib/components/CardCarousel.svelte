<script lang="ts">
	import type { Id } from '$convex/_generated/dataModel';

	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { onMount } from 'svelte';

	import Autoplay, { type AutoplayType } from 'embla-carousel-autoplay';
	import AutoHeight, { type AutoHeightType } from 'embla-carousel-auto-height';
	import ClassNames, { type ClassNamesType } from 'embla-carousel-class-names';
	import Fade, { type FadeType } from 'embla-carousel-fade';

	import { type CarouselAPI } from '$lib/components/ui/carousel/context.js';
	import * as Carousel from '$lib/components/ui/carousel/index.js';

	import { Button } from '$lib/components/ui/button';
	import FileCard from '$lib/components/FileCard.svelte';
	import { AspectRatio } from '$lib/components/ui/aspect-ratio';

	type EmblaPluginType = AutoplayType | AutoHeightType | ClassNamesType | FadeType;

	export let sortedMetaDataArray: Array<{
		_id: Id<'meta'>;
		_creationTime: number;
		originalPath: string;
		convertedPath: string;
		title: string;
		type: string;
		description: string;
		tags: string[];
		matching: string[];
		embedding: number[];
		processed: number;
	}> = [];

	export let folderPath: string;
	export let handleDeleteMeta: (id: Id<'meta'>) => Promise<void>;
	export let handleUpdateMeta: (id: Id<'meta'>, imgPath: string) => Promise<void>;
	export let handleSimilarMeta: (id: Id<'meta'>) => Promise<void>;
	export let similarImageId: Id<'meta'> | null = null;

	let api: CarouselAPI;
	let count = 0;
	let current = tweened(0, { duration: 400, easing: cubicOut });
	let autoplayEnabled = false; // Set to false by default
	let activeImg: string | null = null;
	let isCarouselActive = true;
	let activeImgPosition = { top: 0, left: 0, width: 0, height: 0 };
	let plugins: EmblaPluginType[] = [
		AutoHeight(),
		ClassNames({
			snapped: 'is-snapped',
			inView: 'is-in-view',
			draggable: 'is-draggable',
			dragging: 'is-dragging'
		}),
		Fade()
	];

	const toggleCarouselAutoplay = () => {
		autoplayEnabled = !autoplayEnabled;
		if (autoplayEnabled) {
			plugins = [...plugins, Autoplay({ delay: 2000 })];
		} else {
			plugins = plugins.filter((plugin) => plugin.name !== 'autoplay');
		}
		api?.reInit();
	};

	const setActiveImage = (imgUrl: string, event: Event) => {
		const mouseEvent = event as MouseEvent;
		activeImg = imgUrl;
		const rect = (mouseEvent.target as HTMLElement).getBoundingClientRect();
		activeImgPosition = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
	};

	$: if (api) {
		count = api.scrollSnapList().length;
		current.set(api.selectedScrollSnap() + 1);
		api.on('select', () => {
			current.set(api.selectedScrollSnap() + 1);
		});
	}

	$: if (similarImageId && api) {
		const index = sortedMetaDataArray.findIndex((meta) => meta._id === similarImageId);
		if (index !== -1) {
			api.scrollTo(index);
		}
	}

	$: {
		if (api && plugins) {
			api.reInit();
		}
	}

	onMount(() => {
		if (api) {
			api.on('select', () => {
				current.set(api.selectedScrollSnap() + 1);
			});
		}
	});
</script>

<!-- Autoplay Toggle Button -->
<Button on:click={toggleCarouselAutoplay} class="mt-2 rounded bg-green-500 p-2 text-white">
	{autoplayEnabled ? 'Stop Autoplay' : 'Start Autoplay'}
</Button>

<Carousel.Root bind:api {plugins}>
	<div class="mb-4 text-xl font-bold">{folderPath}</div>
	<div class="mb-2 text-sm">Slide {$current} of {count}</div>
	<Carousel.Content
		class="carousel-container -ml-2 md:-ml-4"
		on:drag={(e) => isCarouselActive && current.update((n) => n + (e.detail as any).dx * 0.05)}
		on:dragend={(e) =>
			isCarouselActive && current.set($current + (e.detail as any).velocityX * 0.05)}
	>
		{#each sortedMetaDataArray as metaData, i}
			<Carousel.Item
				class="carousel-item pl-2 md:pl-4"
				style="opacity: {1 - Math.abs($current - (i + 1)) * 0.5}"
				on:click={(e) => setActiveImage(metaData.convertedPath, e)}
				on:similarRequest={(event: CustomEvent<Id<'meta'>>) => handleSimilarMeta(event.detail)}
			>
				<div class:is-prev={i === $current - 2} class:is-next={i === $current}>
					<FileCard
						{metaData}
						{setActiveImage}
						{handleDeleteMeta}
						{handleUpdateMeta}
						{handleSimilarMeta}
					/>
				</div>
			</Carousel.Item>
		{/each}
	</Carousel.Content>
	<Carousel.Previous
		class="absolute left-2 top-1/2 -translate-y-1/2 transform rounded bg-blue-500 p-2 text-white"
	/>
	<Carousel.Next
		class="absolute right-2 top-1/2 -translate-y-1/2 transform rounded bg-blue-500 p-2 text-white"
	/>
</Carousel.Root>

<!-- Active Image Overlay -->
{#if activeImg}
	<div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
		<AspectRatio ratio={16 / 9} class="mx-auto h-1/2 w-1/2 bg-muted">
			<Button
				on:click={() => {
					activeImg = null;
				}}
				class="h-full w-full"
			>
				<!-- svelte-ignore a11y-img-redundant-alt -->
				<img src={activeImg} alt="Active image" class="h-full w-full rounded-md object-cover" />
			</Button>
		</AspectRatio>
	</div>
{/if}
