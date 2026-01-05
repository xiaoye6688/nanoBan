<template>
  <div class="flex h-full w-full flex-col overflow-hidden bg-[#0A0A16] text-white">
    <!-- 顶部标题栏 - 与主界面 header 的 p-6 对齐 -->
    <div class="flex items-center justify-between p-6 border-b border-white/5">
      <div class="flex items-center gap-4">
        <!-- 收起按钮 - 与主界面历史记录按钮完全一致 -->
        <button
          class="flex items-center justify-center h-10 w-10 rounded-full bg-white/15 border border-white/20 text-white hover:bg-white/25 transition-all active:scale-95"
          title="收起"
          @click="$emit('close')"
        >
          <Icon icon="mdi:chevron-left" class="text-xl" />
        </button>
        <span class="text-lg font-bold tracking-tight text-white/80">历史记录</span>
      </div>
      <button
        class="flex items-center gap-1.5 text-xs font-medium text-[#FFF9F2] bg-[#3E3029] hover:bg-[#4A3B32] px-3 py-1.5 rounded-full transition-all shadow-sm"
        @click="handleCreateSession"
      >
        <Icon icon="mdi:plus" class="text-sm" />
        <span>新建</span>
      </button>
    </div>

    <!-- 会话列表 -->
    <div class="flex-1 overflow-y-auto custom-scrollbar p-3">
      <!-- 空状态 -->
      <div
        v-if="chatStore.sessions.length === 0"
        class="flex flex-col items-center justify-center py-16 text-white/30 gap-3"
      >
        <div
          class="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10"
        >
          <Icon icon="mdi:message-off-outline" class="text-2xl" />
        </div>
        <span class="text-xs">暂无聊天记录</span>
      </div>

      <!-- 会话列表 -->
      <div v-else class="flex flex-col gap-1.5">
        <div
          v-for="session in chatStore.sessions"
          :key="session.id"
          class="group relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 transition-all"
          :class="
            session.id === chatStore.currentSessionId
              ? 'bg-[#FFF9F2]/10 text-white shadow-sm border border-[#FFF9F2]/20'
              : 'text-white/70 hover:bg-white/5 border border-transparent'
          "
          @click="handleOpenSession(session.id)"
        >
          <!-- 图标 -->
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors"
            :class="
              session.id === chatStore.currentSessionId
                ? 'bg-[#FFF9F2] text-[#4A3B32]'
                : 'bg-white/5 text-white/40'
            "
          >
            <Icon
              :icon="
                session.id === chatStore.currentSessionId
                  ? 'mdi:message-text'
                  : 'mdi:message-outline'
              "
              class="text-base"
            />
          </div>

          <!-- 内容 -->
          <div class="flex flex-1 flex-col gap-0.5 overflow-hidden">
            <span
              :class="[
                'truncate text-sm font-medium',
                session.id === chatStore.currentSessionId ? 'text-white' : 'text-white/80'
              ]"
            >
              {{ session.name || '未命名对话' }}
            </span>
            <span class="text-[10px] text-white/40">{{ formatTime(session.updatedAt) }}</span>
          </div>

          <!-- 删除按钮 -->
          <button
            class="absolute right-2 opacity-0 transition-all group-hover:opacity-100 p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
            title="删除"
            @click.stop="handleDeleteSession(session.id)"
          >
            <Icon icon="mdi:delete-outline" class="text-sm" />
          </button>
        </div>
      </div>
    </div>

    <!-- 底部信息 -->
    <div class="px-5 py-3 border-t border-white/5 text-center">
      <span class="text-[10px] text-white/20">nanoBan · Gemini 图像生成</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useChatStore } from '../stores/chat'

const chatStore = useChatStore()
defineEmits(['close'])

const handleCreateSession = async (): Promise<void> => {
  await chatStore.createSession()
}

const handleOpenSession = async (sessionId: string): Promise<void> => {
  await chatStore.openSession(sessionId)
}

const handleDeleteSession = async (sessionId: string): Promise<void> => {
  const confirmed = confirm('确定要删除这条记录吗？')
  if (confirmed) {
    await chatStore.deleteSession(sessionId)
  }
}

const formatTime = (timestamp: number): string => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  if (isToday) {
    return date.toLocaleString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit'
  })
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
