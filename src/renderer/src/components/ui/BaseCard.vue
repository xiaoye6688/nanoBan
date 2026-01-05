<script setup lang="ts">
interface Props {
  shadow?: 'always' | 'hover' | 'never'
  bodyStyle?: Record<string, string>
}

withDefaults(defineProps<Props>(), {
  shadow: 'always'
})
</script>

<template>
  <div
    :class="[
      'rounded-lg border border-dark-border bg-dark-bg-soft',
      shadow === 'always' && 'shadow-md',
      shadow === 'hover' && 'transition-shadow hover:shadow-md'
    ]"
  >
    <div v-if="$slots.header" class="border-b border-dark-border px-5 py-4">
      <slot name="header" />
    </div>
    <div class="p-5" :style="bodyStyle">
      <slot />
    </div>
  </div>
</template>
