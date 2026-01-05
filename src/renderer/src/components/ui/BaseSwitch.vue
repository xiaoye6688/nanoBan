<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: boolean
  disabled?: boolean
  size?: 'small' | 'default' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  size: 'default'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const sizeClasses = computed(() => {
  const sizes = {
    small: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4' },
    default: { track: 'w-10 h-5', thumb: 'w-4 h-4', translate: 'translate-x-5' },
    large: { track: 'w-12 h-6', thumb: 'w-5 h-5', translate: 'translate-x-6' }
  }
  return sizes[props.size]
})

function toggle(): void {
  if (!props.disabled) {
    emit('update:modelValue', !props.modelValue)
  }
}
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :disabled="disabled"
    :class="[
      'relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
      'focus:outline-none focus:ring-2 focus:ring-[#FFF9F2]/30 focus:ring-offset-2 focus:ring-offset-[#0A0A16]',
      'disabled:cursor-not-allowed disabled:opacity-50',
      modelValue ? 'bg-[#4A3B32]' : 'bg-white/20',
      sizeClasses.track
    ]"
    @click="toggle"
  >
    <span
      :class="[
        'pointer-events-none inline-block transform rounded-full bg-[#FFF9F2] shadow ring-0 transition duration-200 ease-in-out',
        modelValue ? sizeClasses.translate : 'translate-x-0',
        sizeClasses.thumb
      ]"
    />
  </button>
</template>
