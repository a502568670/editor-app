
<template>
  <div class="w-full h-full bg-gray-200 flex justify-center items-center">
    <img class="h-[640px]" :src="kf_url" />
  </div>
</template>
<script setup>
import { ref, reactive, toRefs, computed } from 'vue'
import { useStore } from 'vuex'
const store = useStore()
const kf_url = store.state.config?.kf_url
console.log("kf_url", kf_url)
</script>
