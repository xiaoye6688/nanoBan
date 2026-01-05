<script setup lang="ts">
import { computed } from 'vue'

interface Option {
  label: string
  value: string
}

interface Props {
  modelValue: string
  options: Option[]
  size?: 'small' | 'default' | 'large'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'default',
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const sizeClasses = computed(() => {
  const sizes = {
    small: 'px-2.5 py-1 text-xs',
    default: 'px-4 py-2 text-sm',
    large: 'px-5 py-2.5 text-base'
  }
  return sizes[props.size]
})

function select(value: string): void {
  if (!props.disabled) {
    emit('update:modelValue', value)
  }
}
</script>

<template>
  <div class="inline-flex rounded-md overflow-hidden border border-dark-border">
    <button
      v-for="(option, index) in options"
      :key="option.value"
      type="button"
      :disabled="disabled"
      :class="[
        'transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset',
        'disabled:cursor-not-allowed disabled:opacity-50',
        modelValue === option.value
          ? 'bg-primary-600 text-white'
          : 'bg-dark-bg text-dark-text hover:bg-dark-border',
        index > 0 && 'border-l border-dark-border',
        sizeClasses
      ]"
      @click="select(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
