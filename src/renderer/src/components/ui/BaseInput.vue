<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: string | number
  type?: 'text' | 'password' | 'number'
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  size?: 'small' | 'default' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  placeholder: '',
  disabled: false,
  readonly: false,
  size: 'default'
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const sizeClasses = computed(() => {
  const sizes = {
    small: 'px-2.5 py-1 text-xs',
    default: 'px-3 py-2 text-sm',
    large: 'px-4 py-2.5 text-base'
  }
  return sizes[props.size]
})

function handleInput(e: Event): void {
  const target = e.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="relative flex items-center">
    <slot name="prepend" />
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :class="[
        'w-full rounded-lg border border-white/10 bg-white/5 text-white/80 placeholder-white/30',
        'transition-colors duration-200',
        'focus:border-[#FFF9F2]/30 focus:outline-none focus:ring-1 focus:ring-[#FFF9F2]/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'read-only:bg-white/5',
        sizeClasses,
        $slots.prepend ? 'rounded-l-none' : '',
        $slots.append ? 'rounded-r-none' : ''
      ]"
      @input="handleInput"
    />
    <slot name="append" />
  </div>
</template>
