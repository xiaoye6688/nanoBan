<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import BaseButton from './BaseButton.vue'

interface Props {
  title: string
  confirmText?: string
  cancelText?: string
  confirmType?: 'primary' | 'danger'
}

withDefaults(defineProps<Props>(), {
  confirmText: '确定',
  cancelText: '取消',
  confirmType: 'primary'
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const visible = ref(false)
const triggerRef = ref<HTMLElement>()
const popoverRef = ref<HTMLElement>()

function toggle(): void {
  visible.value = !visible.value
  if (visible.value) {
    nextTick(() => {
      positionPopover()
    })
  }
}

function positionPopover(): void {
  if (!triggerRef.value || !popoverRef.value) return

  const triggerRect = triggerRef.value.getBoundingClientRect()
  const popover = popoverRef.value

  popover.style.left = `${triggerRect.left + triggerRect.width / 2}px`
  popover.style.top = `${triggerRect.top - 8}px`
}

function handleConfirm(): void {
  visible.value = false
  emit('confirm')
}

function handleCancel(): void {
  visible.value = false
  emit('cancel')
}

function handleClickOutside(e: MouseEvent): void {
  if (
    visible.value &&
    triggerRef.value &&
    popoverRef.value &&
    !triggerRef.value.contains(e.target as Node) &&
    !popoverRef.value.contains(e.target as Node)
  ) {
    visible.value = false
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
  <div class="inline-block">
    <div ref="triggerRef" @click="toggle">
      <slot />
    </div>

    <Teleport to="body">
      <Transition name="popover">
        <div
          v-if="visible"
          ref="popoverRef"
          class="fixed z-50 -translate-x-1/2 -translate-y-full rounded-xl border border-white/10 bg-[#0A0A16] p-4 shadow-xl"
        >
          <p class="mb-3 text-sm text-white/80">{{ title }}</p>
          <div class="flex justify-end gap-2">
            <BaseButton size="small" variant="ghost" @click="handleCancel">
              {{ cancelText }}
            </BaseButton>
            <BaseButton size="small" :type="confirmType" @click="handleConfirm">
              {{ confirmText }}
            </BaseButton>
          </div>
          <!-- Arrow -->
          <div
            class="absolute left-1/2 top-full -translate-x-1/2 border-8 border-transparent border-t-[#0A0A16]"
          />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.popover-enter-active,
.popover-leave-active {
  transition: all 0.15s ease;
}

.popover-enter-from,
.popover-leave-to {
  opacity: 0;
  transform: translate(-50%, calc(-100% + 8px));
}
</style>
