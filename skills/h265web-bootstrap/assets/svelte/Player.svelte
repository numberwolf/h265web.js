<script>
  import {onMount} from 'svelte';
  import {createDemo} from '../common/h265web-demo.js';
  import {demoConfig} from '../demo-config.js';
  let root;
  onMount(() => {
    const demo = createDemo(root, demoConfig);
    return () => { void demo.destroy().catch(error => console.error(error.message)); };
  });
</script>
<div bind:this={root}></div>
