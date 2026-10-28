<script setup>
import {onMounted, onBeforeUnmount, onActivated, onDeactivated, ref, watch} from 'vue';
import {createDemo} from '../common/h265web-demo.js';
import {demoConfig} from '../demo-config.js';
const props = defineProps({source: {type: String, default: demoConfig.mediaUrl}});
const root = ref(null);
let demo = null, mounted = false;
const sessionState = {};
function replace() {
  if (!mounted) return;
  const previous = demo;
  demo = createDemo(root.value, {...demoConfig, mediaUrl: props.source, sessionState});
  void previous?.destroy().catch(error => console.error(error.message));
}
onMounted(() => { mounted = true; replace(); });
watch(() => props.source, replace);
function suspend() {
  mounted = false;
  const previous = demo; demo = null;
  void previous?.destroy().catch(error => console.error(error.message));
}
// This starter releases cached players while inactive. Apps that retain streams
// should adapt deactivation to pause UI/controls instead.
onDeactivated(suspend);
onActivated(() => { if (!mounted) { mounted = true; replace(); } });
onBeforeUnmount(suspend);
</script>
<template><div ref="root"/></template>
