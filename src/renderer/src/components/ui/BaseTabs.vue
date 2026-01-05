<script setup lang="ts">
import { provide, computed, useSlots, type VNode } from 'vue'

interface Props {
  modelValue: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const slots = useSlots()

const activeTab = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 从 slot 中提取 tab 信息，保证顺序与模板一致
const tabs = computed(() => {
  const defaultSlot = slots.default?.()
  if (!defaultSlot) return []

  const extractTabs = (vnodes: VNode[]): { name: string; label: string }[] => {
    const result: { name: string; label: string }[] = []
    for (const vnode of vnodes) {
      // 处理 BaseTabPane 组件
      if (vnode.props?.name && vnode.props?.label) {
        result.push({
          name: vnode.props.name as string,
          label: vnode.props.label as string
        })
      }
      // 递归处理 Fragment 或数组子节点
      if (Array.isArray(vnode.children)) {
        result.push(...extractTabs(vnode.children as VNode[]))
      }
    }
    return result
  }

  return extractTabs(defaultSlot)
})

provide('tabs', {
  activeTab,
  setActiveTab: (name: string) => {
    activeTab.value = name
  }
})
</script>

<template>
  <div class="w-full">
    <!-- 使用胶囊式标签页，与主界面风格统一 -->
    <div class="flex gap-1 p-1 bg-white/5 rounded-xl">
      <button
        v-for="tab in tabs"
        :key="tab.name"
        :class="[
          'flex-1 px-4 py-2 text-sm font-medium transition-all rounded-lg',
          activeTab === tab.name
            ? 'bg-[#FFF9F2] text-[#4A3B32] shadow-sm'
            : 'text-white/60 hover:text-white hover:bg-white/5'
        ]"
        @click="activeTab = tab.name"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="pt-5">
      <slot />
    </div>
  </div>
</template>
