<template>
  <div class="flex h-screen w-full flex-col bg-[#050511] text-white overflow-hidden relative">
    <!-- 背景星空效果 -->
    <div
      class="absolute inset-0 z-0 pointer-events-none opacity-50"
      style="
        background-image: radial-gradient(white 1px, transparent 1px);
        background-size: 50px 50px;
      "
    ></div>

    <!-- 主内容区域 -->
    <main
      class="relative flex-1 z-10 w-full h-full flex flex-col transition-all duration-300 ease-out"
      :class="{ 'pl-0': !showSidebar, 'pl-0 md:pl-72': showSidebar }"
    >
      <!-- 顶部导航 -->
      <header
        class="flex justify-between items-center p-6 absolute top-0 right-0 z-20 transition-all duration-300 ease-in-out"
        :style="{ left: showSidebar ? '18rem' : '0' }"
      >
        <div class="flex items-center gap-4">
          <!-- 侧边栏开关 -->
          <button
            class="flex items-center justify-center h-10 w-10 rounded-full bg-white/15 border border-white/20 text-white hover:bg-white/25 transition-all active:scale-95"
            title="历史记录"
            @click="showSidebar = !showSidebar"
          >
            <Icon icon="mdi:history" class="text-xl" />
          </button>

          <h1 class="text-lg font-bold tracking-tight text-white/80">nanoBan</h1>
        </div>

        <div class="flex items-center gap-3">
          <button
            class="flex items-center justify-center h-8 w-8 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="设置"
            @click="showAuthDialog = true"
          >
            <Icon icon="mdi:cog" class="text-xl" />
          </button>
        </div>
      </header>

      <!-- 对话视图 -->
      <ChatView />

      <!-- 侧边栏 Drawer -->
      <div
        class="absolute top-0 left-0 bottom-0 w-72 bg-[#0A0A16] border-r border-white/5 shadow-2xl z-30 transition-transform duration-300 ease-in-out transform"
        :class="showSidebar ? 'translate-x-0' : '-translate-x-full'"
      >
        <SessionPanel @close="showSidebar = false" />
      </div>
    </main>

    <!-- 遮罩 (移动端显示) -->
    <div
      v-if="showSidebar"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 md:hidden animate-fade-in"
      @click="showSidebar = false"
    ></div>

    <!-- 设置对话框 -->
    <AuthDialog v-model="showAuthDialog" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useAuthStore } from './stores/auth'
import { useConfigStore } from './stores/config'
import { useChatStore } from './stores/chat'
import ChatView from './views/ChatView.vue'
import SessionPanel from './components/SessionPanel.vue'
import AuthDialog from './components/AuthDialog.vue'

const authStore = useAuthStore()
const configStore = useConfigStore()
const chatStore = useChatStore()
const showAuthDialog = ref(false)
const showSidebar = ref(false) // 默认收起侧边栏，保持沉浸式体验

// 初始化应用
onMounted(async () => {
  await authStore.loadFromStorage()
  await configStore.loadConfig()
  authStore.setupTokenRefreshListener()
  await chatStore.initialize()
})

// 清理事件监听
onUnmounted(() => {
  authStore.cleanupTokenRefreshListener()
})
</script>

<style>
/* 全局样式：图片预览器样式优化 */
.image-viewer-wrapper {
  z-index: 3000 !important;
}

.image-viewer-mask {
  background-color: rgba(0, 0, 0, 0.9) !important;
}
</style>
