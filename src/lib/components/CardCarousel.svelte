<script lang="ts">
    import { type CarouselAPI } from "$lib/components/ui/carousel/context.js";
    import * as Carousel from "$lib/components/ui/carousel/index.js";
    import { Button } from "$lib/components/ui/button";
    import Autoplay, { type AutoplayType } from "embla-carousel-autoplay";
    import AutoHeight, { type AutoHeightType } from "embla-carousel-auto-height";
    import ClassNames, { type ClassNamesType } from 'embla-carousel-class-names';
    import Fade, { type FadeType } from 'embla-carousel-fade';
    import { tweened } from 'svelte/motion';
    import { cubicOut } from 'svelte/easing';
    import { onMount } from 'svelte';
    import FileCard from '$lib/components/FileCard.svelte';         
    import { AspectRatio } from "$lib/components/ui/aspect-ratio";
    
    type EmblaPluginType = AutoplayType | AutoHeightType | ClassNamesType | FadeType;

    export let sortedMetaDataArray: Array<{
      _id: string;
      _creationTime: string;
      path: string;
      title: string;
      description: string;
      tags: string[];
      matching: string[];
    }> = [];
    export let folderPath: string;
    export let handleDeleteMeta: (id: string) => Promise<void>;
    export let handleUpdateMeta: (id: string, imgPath: string) => Promise<void>;
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
  
    $: if (api) {
      count = api.scrollSnapList().length;
      current.set(api.selectedScrollSnap() + 1);
      api.on("select", () => {
        current.set(api.selectedScrollSnap() + 1);
      });
    }
  
    onMount(() => {
      if (api) {
        api.on("select", () => {
          current.set(api.selectedScrollSnap() + 1);
        });
      }
    });
  
    const toggleCarouselAutoplay = () => {
      autoplayEnabled = !autoplayEnabled;
      if (autoplayEnabled) {
        plugins = [...plugins, Autoplay({ delay: 2000 })];
      } else {
        plugins = plugins.filter(plugin => plugin.name !== 'autoplay');
      }
      api?.reInit();
    };
  
    const setActiveImage = (imgUrl: string, event: Event) => {
      const mouseEvent = event as MouseEvent;
      activeImg = imgUrl;
      const rect = (mouseEvent.target as HTMLElement).getBoundingClientRect();
      activeImgPosition = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
    };
  
    const closeActiveImageOverlay = () => {
      console.log("Closing the active image overlay");
      activeImg = null;
    };
  
    $: {
      if (api && plugins) {
        api.reInit();
      }
    }
  </script>
  
  <!-- Autoplay Toggle Button -->
  <Button on:click={toggleCarouselAutoplay} class="bg-green-500 text-white p-2 rounded mt-2">
    {autoplayEnabled ? 'Stop Autoplay' : 'Start Autoplay'}
  </Button>
  
  <Carousel.Root bind:api {plugins}>
    <div class="text-xl font-bold mb-4">{folderPath}</div>
    <div class="text-sm mb-2">Slide {$current} of {count}</div>
    <Carousel.Content class="carousel-container -ml-2 md:-ml-4"
                      on:drag={(e) => isCarouselActive && current.update(n => n + (e.detail as any).dx * 0.05)}
                      on:dragend={(e) => isCarouselActive && current.set($current + (e.detail as any).velocityX * 0.05)}>
      {#each sortedMetaDataArray as metaData, i}
        <Carousel.Item class="carousel-item pl-2 md:pl-4"
                       style="opacity: {1 - Math.abs($current - (i + 1)) * 0.5}"
                       on:click={(e) => setActiveImage(metaData.path, e)}>
          <div class:is-prev={i === $current - 2} class:is-next={i === $current}>
            <FileCard 
            {metaData} 
            onFileClick={setActiveImage} 
            handleDeleteMeta={handleDeleteMeta}
            handleUpdateMeta={handleUpdateMeta}
            />
          </div>
        </Carousel.Item>
      {/each}
    </Carousel.Content>
    <Carousel.Previous class="bg-blue-500 text-white p-2 rounded absolute left-2 top-1/2 transform -translate-y-1/2" />
    <Carousel.Next class="bg-blue-500 text-white p-2 rounded absolute right-2 top-1/2 transform -translate-y-1/2" />
  </Carousel.Root>
  
  <!-- Active Image Overlay -->
  {#if activeImg}
    <div class="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
      <AspectRatio ratio={16 / 9} class="bg-muted w-1/2 h-1/2 mx-auto">
        <Button on:click={closeActiveImageOverlay} class="w-full h-full">
          <!-- svelte-ignore a11y-img-redundant-alt -->
          <img
            src={activeImg}
            alt="Active image"
            class="h-full w-full rounded-md object-cover"
          />
        </Button>
      </AspectRatio>
    </div>
  {/if}