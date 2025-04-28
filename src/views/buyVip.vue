
<template>
  <iframe height="100%" width="100%" :src="$store.state.config?.vip_url+$store.state.user?.token"></iframe>
</template>
<script setup>
import { ref, reactive, toRefs, computed } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

</script>
