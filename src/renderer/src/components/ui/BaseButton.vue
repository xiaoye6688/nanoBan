<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

interface Props {
  type?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'small' | 'default' | 'large'
  variant?: 'solid' | 'outline' | 'ghost' | 'link'
  loading?: boolean
  disabled?: boolean
  icon?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'default',
  size: 'default',
  variant: 'solid',
  loading: false,
  disabled: false
})

const baseClasses =
  'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0A16] disabled:opacity-50 disabled:cursor-not-allowed'

const sizeClasses = computed(() => {
  const sizes = {
    small: 'px-3 py-1.5 text-xs rounded-lg',
    default: 'px-4 py-2 text-sm rounded-lg',
    large: 'px-6 py-2.5 text-base rounded-xl'
  }
  return sizes[props.size]
})

const typeClasses = computed(() => {
  const types = {
    default: {
      solid: 'bg-white/10 text-white/80 hover:bg-white/15 focus:ring-white/30',
      outline: 'border border-white/20 text-white/70 hover:bg-white/5 focus:ring-white/30',
      ghost: 'text-white/70 hover:bg-white/10 focus:ring-white/30',
      link: 'text-white/70 hover:text-white underline-offset-4 hover:underline focus:ring-white/30 p-0'
    },
    primary: {
      solid: 'bg-[#3E3029] text-[#FFF9F2] hover:bg-[#4A3B32] focus:ring-[#FFF9F2]/30 shadow-sm',
      outline:
        'border border-[#FFF9F2]/30 text-[#FFF9F2] hover:bg-[#FFF9F2]/10 focus:ring-[#FFF9F2]/30',
      ghost: 'text-[#FFF9F2] hover:bg-[#FFF9F2]/10 focus:ring-[#FFF9F2]/30',
      link: 'text-[#FFF9F2] hover:text-white underline-offset-4 hover:underline focus:ring-[#FFF9F2]/30 p-0'
    },
    success: {
      solid: 'bg-green-600 text-white hover:bg-green-500 focus:ring-green-500',
      outline: 'border border-green-500 text-green-400 hover:bg-green-900/30 focus:ring-green-500',
      ghost: 'text-green-400 hover:bg-green-900/30 focus:ring-green-500',
      link: 'text-green-400 hover:text-green-300 underline-offset-4 hover:underline focus:ring-green-500 p-0'
    },
    warning: {
      solid: 'bg-yellow-600 text-white hover:bg-yellow-500 focus:ring-yellow-500',
      outline:
        'border border-yellow-500 text-yellow-400 hover:bg-yellow-900/30 focus:ring-yellow-500',
      ghost: 'text-yellow-400 hover:bg-yellow-900/30 focus:ring-yellow-500',
      link: 'text-yellow-400 hover:text-yellow-300 underline-offset-4 hover:underline focus:ring-yellow-500 p-0'
    },
    danger: {
      solid: 'bg-red-600 text-white hover:bg-red-500 focus:ring-red-500',
      outline: 'border border-red-500 text-red-400 hover:bg-red-900/30 focus:ring-red-500',
      ghost: 'text-red-400 hover:bg-red-900/30 focus:ring-red-500',
      link: 'text-red-400 hover:text-red-300 underline-offset-4 hover:underline focus:ring-red-500 p-0'
    },
    info: {
      solid: 'bg-blue-600 text-white hover:bg-blue-500 focus:ring-blue-500',
      outline: 'border border-blue-500 text-blue-400 hover:bg-blue-900/30 focus:ring-blue-500',
      ghost: 'text-blue-400 hover:bg-blue-900/30 focus:ring-blue-500',
      link: 'text-blue-400 hover:text-blue-300 underline-offset-4 hover:underline focus:ring-blue-500 p-0'
    }
  }
  return types[props.type][props.variant]
})

const buttonClasses = computed(() => {
  return [baseClasses, sizeClasses.value, typeClasses.value]
})
</script>

<template>
  <button :class="buttonClasses" :disabled="disabled || loading">
    <Icon v-if="loading" icon="mdi:loading" class="mr-2 h-4 w-4 animate-spin" />
    <Icon v-else-if="icon" :icon="icon" class="mr-2 h-4 w-4" />
    <slot />
  </button>
</template>
