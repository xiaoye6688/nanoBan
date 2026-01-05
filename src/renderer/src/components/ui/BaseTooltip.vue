<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Props {
  content: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

const props = withDefaults(defineProps<Props>(), {
  placement: 'top'
})

const visible = ref(false)
const triggerRef = ref<HTMLElement>()
const tooltipRef = ref<HTMLElement>()

function show(): void {
  visible.value = true
  requestAnimationFrame(positionTooltip)
}

function hide(): void {
  visible.value = false
}

function positionTooltip(): void {
  if (!triggerRef.value || !tooltipRef.value) return

  const triggerRect = triggerRef.value.getBoundingClientRect()
  const tooltip = tooltipRef.value
  const tooltipRect = tooltip.getBoundingClientRect()

  let top = 0
  let left = 0

  switch (props.placement) {
    case 'top':
      top = triggerRect.top - tooltipRect.height - 8
      left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
      break
    case 'bottom':
      top = triggerRect.bottom + 8
      left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
      break
    case 'left':
      top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2
      left = triggerRect.left - tooltipRect.width - 8
      break
    case 'right':
      top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2
      left = triggerRect.right + 8
      break
  }

  tooltip.style.top = `${top}px`
  tooltip.style.left = `${left}px`
}

onMounted(() => {
  window.addEventListener('scroll', positionTooltip, true)
  window.addEventListener('resize', positionTooltip)
})

onUnmounted(() => {
  window.removeEventListener('scroll', positionTooltip, true)
  window.removeEventListener('resize', positionTooltip)
})
</script>

<template>
  <div class="inline-block">
    <div ref="triggerRef" @mouseenter="show" @mouseleave="hide" @focus="show" @blur="hide">
      <slot />
    </div>

    <Teleport to="body">
      <Transition name="tooltip">
        <div
          v-if="visible"
          ref="tooltipRef"
          class="fixed z-9999 max-w-xs rounded-lg bg-[#1A1A2E] border border-white/10 px-3 py-2 text-xs text-white/80 shadow-lg"
        >
          {{ content }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.15s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
}
</style>
