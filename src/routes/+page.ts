/*
<script lang="ts">
  import { onMount } from 'svelte';

  let container1: HTMLDivElement;
  let container2: HTMLDivElement;
  let container3: HTMLDivElement;
  let container4: HTMLDivElement;
  let container5: HTMLDivElement;
  let container6: HTMLDivElement;
  let container7: HTMLDivElement;
  let container8: HTMLDivElement;

  onMount(async () => {
    // Example 1: Basic Canvas and Circle using @antv/g
    const basicCanvasResponse = await fetch('/api/basic-canvas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ container: container1 })
    });
    const basicCanvasResult = await basicCanvasResponse.json();
    console.log('Basic Canvas Result:', basicCanvasResult);

    // Example 2: Graph visualization using @antv/g6
    const graphData = {
      nodes: [
        { id: 'node1', label: 'Node 1' },
        { id: 'node2', label: 'Node 2' }
      ],
      edges: [{ source: 'node1', target: 'node2' }]
    };
    const graphResponse = await fetch('/api/graph', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ container: container2, data: graphData })
    });
    const graphResult = await graphResponse.json();
    console.log('Graph Result:', graphResult);

    // Example 3: Pivot table using @antv/s2
    const s2DataConfig = {
      fields: {
        rows: ['province', 'city'],
        columns: ['type'],
        values: ['price'],
      },
      data: [
        { province: 'Zhejiang', city: 'Hangzhou', type: 'Pen', price: 1 },
        { province: 'Zhejiang', city: 'Hangzhou', type: 'Paper', price: 2 },
        // More data...
      ],
    };
    const s2Options = {
      width: 600,
      height: 400,
    };
    const pivotSheetResponse = await fetch('/api/pivot-sheet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ container: container3, data: s2DataConfig, options: s2Options })
    });
    const pivotSheetResult = await pivotSheetResponse.json();
    console.log('Pivot Sheet Result:', pivotSheetResult);

    // Example 4: Hierarchy visualization using @antv/hierarchy
    const hierarchyData = {
      id: 'Root',
      children: [
        { id: 'Child 1' },
        { id: 'Child 2', children: [{ id: 'Child 2-1' }] }
      ],
    };
    const hierarchyResponse = await fetch('/api/hierarchy-layout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: hierarchyData })
    });
    const hierarchyResult = await hierarchyResponse.json();
    console.log('Hierarchy Layout Result:', hierarchyResult);

    // Example 6: Basic chart using @antv/g2
    const chartData = [
      { year: '1991', value: 3 },
      { year: '1992', value: 4 },
      { year: '1993', value: 3.5 },
      { year: '1994', value: 5 },
      { year: '1995', value: 4.9 },
      { year: '1996', value: 6 },
      { year: '1997', value: 7 },
      { year: '1998', value: 9 },
      { year: '1999', value: 13 },
    ];
    const g2ChartResponse = await fetch('/api/g2-chart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ container: container4, data: chartData })
    });
    const g2ChartResult = await g2ChartResponse.json();
    console.log('G2 Chart Result:', g2ChartResult);

    // Example 7: 3D map visualization using @antv/l7
    const l7Data = [
      { lng: 120.19382669582967, lat: 30.258134, value: Math.random() * 100 },
    ];
    const l7SceneResponse = await fetch('/api/l7-scene', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ container: container5, data: l7Data })
    });
    const l7SceneResult = await l7SceneResponse.json();
    console.log('L7 Scene Result:', l7SceneResult);

    // Example 8: Tree graph using @antv/g6
    const treeData = {
      nodes: [
        { id: 'root' },
        { id: 'child1' },
        { id: 'child2' },
        { id: 'child1.1' },
        { id: 'child1.2' }
      ],
      edges: [
        { source: 'root', target: 'child1' },
        { source: 'root', target: 'child2' },
        { source: 'child1', target: 'child1.1' },
        { source: 'child1', target: 'child1.2' }
      ]
    };
    const treeGraphResponse = await fetch('/api/tree-graph', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ container: container6, data: treeData })
    });
    const treeGraphResult = await treeGraphResponse.json();
    console.log('Tree Graph Result:', treeGraphResult);

    // Example 9: Heatmap using @antv/g2
    const heatmapData = [];
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        heatmapData.push({
          x: i,
          y: j,
          value: Math.random() * 10
        });
      }
    }
    const heatmapResponse = await fetch('/api/heatmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ container: container7, data: heatmapData })
    });
    const heatmapResult = await heatmapResponse.json();
    console.log('Heatmap Result:', heatmapResult);

    // Example 10: 3D globe using @antv/l7
    const worldDataResponse = await fetch('https://gw.alipayobjects.com/os/bmw-prod/c5dba875-b6ea-4e88-b778-66a862906c93.json');
    const worldData = await worldDataResponse.json();
    const globeResponse = await fetch('/api/3d-globe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ container: container8, worldData })
    });
    const globeResult = await globeResponse.json();
    console.log('3D Globe Result:', globeResult);
  });
</script>

<style>
  .visualization-container {
    margin-bottom: 20px;
  }
</style>

<div class="visualization-container" bind:this={container1}></div>
<div class="visualization-container" bind:this={container2}></div>
<div class="visualization-container" bind:this={container3}></div>
<div class="visualization-container" bind:this={container4}></div>
<div class="visualization-container" bind:this={container5}></div>
<div class="visualization-container" bind:this={container6}></div>
<div class="visualization-container" bind:this={container7}></div>
<div class="visualization-container" bind:this={container8}></div>
*/
