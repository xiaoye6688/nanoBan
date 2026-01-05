<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

interface Props {
  type?: 'success' | 'warning' | 'error' | 'info'
  title?: string
  closable?: boolean
  showIcon?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  closable: true,
  showIcon: true
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

const typeClasses = computed(() => {
  const types = {
    success: 'bg-green-900/30 border-green-700 text-green-300',
    warning: 'bg-yellow-900/30 border-yellow-700 text-yellow-300',
    error: 'bg-red-900/30 border-red-700 text-red-300',
    info: 'bg-blue-900/30 border-blue-700 text-blue-300'
  }
  return types[props.type]
})

const iconColors = {
  success: 'text-green-400',
  warning: 'text-yellow-400',
  error: 'text-red-400',
  info: 'text-blue-400'
}
</script>

<template>
  <div :class="['flex items-start gap-3 rounded-lg border p-4', typeClasses]">
    <Icon
      v-if="showIcon"
      :icon="icons[type]"
      :class="['h-5 w-5 shrink-0 mt-0.5', iconColors[type]]"
    />
    <div class="flex-1 min-w-0">
      <p v-if="title" class="font-medium mb-1">{{ title }}</p>
      <div class="text-sm opacity-90">
        <slot />
      </div>
    </div>
    <button
      v-if="closable"
      class="shrink-0 rounded p-0.5 opacity-70 transition-opacity hover:opacity-100"
      @click="emit('close')"
    >
      <Icon icon="mdi:close" class="h-4 w-4" />
    </button>
  </div>
</template>
