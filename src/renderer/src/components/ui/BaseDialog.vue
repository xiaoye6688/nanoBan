<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'

interface Props {
  modelValue: boolean
  title?: string
  width?: string
  closeOnClickMask?: boolean
  showClose?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  width: '500px',
  closeOnClickMask: true,
  showClose: true
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const dialogWidth = computed(() => {
  if (props.width.includes('%') || props.width.includes('px')) {
    return props.width
  }
  return `${props.width}px`
})

function close(): void {
  emit('update:modelValue', false)
  emit('close')
}

function handleMaskClick(): void {
  if (props.closeOnClickMask) {
    close()
  }
}

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape' && props.modelValue) {
    close()
  }
}

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
)

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click="handleMaskClick"
      >
        <!-- Mask -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <!-- Dialog -->
        <div
          class="relative z-10 max-h-[90vh] overflow-hidden rounded-2xl bg-[#0A0A16] border border-white/10 shadow-2xl"
          :style="{ width: dialogWidth, maxWidth: '90vw' }"
          @click.stop
        >
          <!-- Header -->
          <div
            v-if="title || $slots.header || showClose"
            class="flex items-center justify-between border-b border-white/5 px-6 py-4"
          >
            <slot name="header">
              <h3 class="text-lg font-bold tracking-tight text-white/80">{{ title }}</h3>
            </slot>
            <button
              v-if="showClose"
              class="flex items-center justify-center h-8 w-8 rounded-full text-white/60 transition-all hover:bg-white/10 hover:text-white"
              @click="close"
            >
              <Icon icon="mdi:close" class="h-5 w-5" />
            </button>
          </div>

          <!-- Body -->
          <div class="custom-scrollbar max-h-[calc(90vh-140px)] overflow-y-auto px-6 py-5">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="border-t border-white/5 px-6 py-4">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dialog-enter-active,
.dialog-leave-active {
  transition: all 0.2s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from > div:last-child,
.dialog-leave-to > div:last-child {
  transform: scale(0.95);
}
</style>
