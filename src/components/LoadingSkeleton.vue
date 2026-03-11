<script setup lang="ts">
withDefaults(
  defineProps<{
    rows?: number
  }>(),
  {
    rows: 4,
  },
)
</script>

<template>
  <div class="skeleton-wrap">
    <div v-for="row in rows" :key="row" class="skeleton-line"></div>
  </div>
</template>
