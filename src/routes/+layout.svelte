<script lang="ts">
	import '../app.css';

	import { setupConvex } from 'convex-svelte';
	import { PUBLIC_CONVEX_URL } from '$env/static/public';
	import { setContext } from 'svelte';
	const convexStore = setupConvex(PUBLIC_CONVEX_URL);

	setContext('convex', convexStore);
</script>

<div class="flex min-h-screen flex-col">
	<main class=" flex w-full flex-1 flex-col p-4">
		<slot />
	</main>

	<footer
		class="flex flex-col items-center justify-center bg-purple-200 p-3 dark:bg-purple-800 sm:p-3"
	>
		<p class="text-white">
			<span class="font-bold">visit</span>
			<span class="font-bold text-blue-600 dark:text-blue-400">ABC</span>
		</p>
	</footer>
</div>
