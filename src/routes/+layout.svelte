<script lang="ts">
	import '../app.css'
	
  import { setupConvex } from 'convex-svelte';
  import { PUBLIC_CONVEX_URL } from '$env/static/public';
  import { setContext } from 'svelte';
  const convexStore = setupConvex(PUBLIC_CONVEX_URL);
  
  setContext('convex', convexStore);
  
  </script>
  
  <div class="flex flex-col min-h-screen">
  
	<main class="flex-1 flex flex-col p-4 w-full max-w-4xl mx-auto">
	  <slot />
	</main>
  
	<footer
	  class="bg-purple-200 dark:bg-purple-800 flex flex-col justify-center items-center p-3 sm:p-3"
	>
	  <p class="text-white">
		<span class="font-bold">visit</span>
		<span class="text-blue-600 dark:text-blue-400 font-bold">ABC</span>
	  </p>
	</footer>
  </div>
  