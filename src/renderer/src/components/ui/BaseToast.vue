<script setup lang="ts">
import { Icon } from '@iconify/vue'

interface Props {
  message: string
  type?: 'success' | 'warning' | 'error' | 'info'
}

withDefaults(defineProps<Props>(), {
  type: 'info'
})

const emit = defineEmits<{
  close: []
}>()

const icons = {
  success: 'mdi:check-circle',
  warning: 'mdi:alert',
  error: 'mdi:close-circle',
  info: 'mdi:information'
}

const colors = {
  success: 'bg-green-900/90 text-green-200 border-green-700',
  warning: 'bg-yellow-900/90 text-yellow-200 border-yellow-700',
  error: 'bg-red-900/90 text-red-200 border-red-700',
  info: 'bg-blue-900/90 text-blue-200 border-blue-700'
}

const iconColors = {
  success: 'text-green-400',
  warning: 'text-yellow-400',
  error: 'text-red-400',
  info: 'text-blue-400'
}
</script>

<template>
  <div
    :class="[
      'flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm',
      colors[type]
    ]"
  >
    <Icon :icon="icons[type]" :class="['h-5 w-5 shrink-0', iconColors[type]]" />
    <span class="text-sm font-medium">{{ message }}</span>
    <button
      class="ml-auto rounded p-0.5 opacity-70 transition-opacity hover:opacity-100"
      @click="emit('close')"
    >
      <Icon icon="mdi:close" class="h-4 w-4" />
    </button>
  </div>
</template>
