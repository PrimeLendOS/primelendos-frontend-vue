<script setup lang="ts">
defineProps<{
  items: Array<{ label: string; value: string | number }>
}>()
</script>

<template>
  <section class="kpi-strip">
    <article v-for="item in items" :key="item.label" class="kpi-item">
      <p class="kpi-label">{{ item.label }}</p>
      <p class="kpi-value">{{ item.value }}</p>
    </article>
  </section>
</template>
