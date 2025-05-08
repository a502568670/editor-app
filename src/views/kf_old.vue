
<template>
  <iframe height="100%" width="100%" :src="$store.state.config?.kf_url"></iframe>
</template>
<script setup>
import { ref, reactive, toRefs, computed } from 'vue'
import { useStore } from 'vuex'
const store = useStore()
console.log('store.state.config?.kf_url=>', store.state.config?.kf_url)
</script>
