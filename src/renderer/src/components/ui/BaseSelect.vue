<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'

interface Option {
  label: string
  value: string
}

interface Props {
  modelValue: string
  options: Option[]
  placeholder?: string
  disabled?: boolean
  size?: 'small' | 'default' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择',
  disabled: false,
  size: 'default'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isOpen = ref(false)
const selectRef = ref<HTMLElement>()
const dropdownRef = ref<HTMLElement>()

const selectedLabel = computed(() => {
  const option = props.options.find((o) => o.value === props.modelValue)
  return option?.label || ''
})

const sizeClasses = computed(() => {
  const sizes = {
    small: 'px-2.5 py-1 text-xs',
    default: 'px-3 py-2 text-sm',
    large: 'px-4 py-2.5 text-base'
  }
  return sizes[props.size]
})

function toggle(): void {
  if (!props.disabled) {
    isOpen.value = !isOpen.value
  }
}

function select(value: string): void {
  emit('update:modelValue', value)
  isOpen.value = false
}

function handleClickOutside(e: MouseEvent): void {
  if (
    isOpen.value &&
    selectRef.value &&
    !selectRef.value.contains(e.target as Node) &&
    dropdownRef.value &&
    !dropdownRef.value.contains(e.target as Node)
  ) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="selectRef" class="relative inline-block w-full">
    <button
      type="button"
      :disabled="disabled"
      :class="[
        'flex w-full items-center justify-between rounded-md border border-dark-border bg-dark-bg text-left',
        'transition-colors duration-200',
        'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
        'disabled:cursor-not-allowed disabled:opacity-50',
        isOpen && 'border-primary-500 ring-1 ring-primary-500',
        sizeClasses
      ]"
      @click="toggle"
    >
      <span :class="selectedLabel ? 'text-dark-text' : 'text-dark-muted'">
        {{ selectedLabel || placeholder }}
      </span>
      <Icon
        icon="mdi:chevron-down"
        :class="['h-4 w-4 text-dark-muted transition-transform', isOpen && 'rotate-180']"
      />
    </button>

    <Transition name="dropdown">
      <div
        v-if="isOpen"
        ref="dropdownRef"
        class="absolute z-50 mt-1 w-full rounded-md border border-dark-border bg-dark-bg-soft py-1 shadow-lg"
      >
        <button
          v-for="option in options"
          :key="option.value"
          type="button"
          :class="[
            'w-full px-3 py-2 text-left text-sm transition-colors',
            option.value === modelValue
              ? 'bg-primary-900/30 text-primary-400'
              : 'text-dark-text hover:bg-dark-border'
          ]"
          @click="select(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
