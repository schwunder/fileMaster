<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import Add from "carbon-icons-svelte/lib/Add.svelte";
	import Close from "carbon-icons-svelte/lib/Close.svelte";

	export let title: string;
	export let onClick: () => void = () => {};
	export let iconType: 'default' | 'x' = 'default';
</script>

<Button variant="ghost" class="ml-2 h-8 w-8 p-1" {title} on:click={onClick}>
	{#if iconType === 'x'}
		<Close size={16} />
	{:else}
		<Add size={16} />
	{/if}
</Button>