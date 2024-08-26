<script>
    import { onMount } from 'svelte';
    export let count = 0;
  
    onMount(() => {
      console.log('Component has mounted');
    });
  
    function handleClick() {
      count += 1;
    }
  </script>
  
  <button on:click={handleClick}>
    Clicked {count} {count === 1 ? 'time' : 'times'}
  </button>
  