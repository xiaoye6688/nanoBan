<script setup lang="ts">
import { inject, computed } from 'vue'

interface Props {
  label: string
  name: string
}

const props = defineProps<Props>()

const tabsContext = inject<{
  activeTab: { value: string }
  setActiveTab: (name: string) => void
}>('tabs')

const isActive = computed(() => tabsContext?.activeTab.value === props.name)
</script>

<template>
  <div v-show="isActive">
    <slot />
  </div>
</template>
