<template>
  <div class="session-panel">
    <el-card shadow="never" :body-style="{ padding: '0' }">
      <template #header>
        <div class="panel-header">
          <span>对话记录</span>
          <el-button type="primary" link size="small" @click="handleCreateSession">新建</el-button>
        </div>
      </template>

      <el-scrollbar max-height="300px">
        <div v-if="chatStore.sessions.length === 0" class="empty-state">暂无聊天记录</div>
        <div v-else class="session-list">
          <div
            v-for="session in displayedSessions"
            :key="session.id"
            :class="['session-item', { active: session.id === chatStore.currentSessionId }]"
            @click="handleOpenSession(session.id)"
          >
            <div class="session-content">
              <div class="session-icon">
                <el-icon><ChatDotSquare /></el-icon>
              </div>
              <div class="session-info">
                <div class="session-name">{{ session.name }}</div>
                <div class="session-meta">{{ formatTime(session.updatedAt) }}</div>
              </div>
            </div>

            <el-popconfirm
              title="确定删除这条记录？"
              confirm-button-text="删除"
              cancel-button-text="取消"
              @confirm="handleDeleteSession(session.id)"
            >
              <template #reference>
                <el-icon class="delete-icon" @click.stop><Delete /></el-icon>
              </template>
            </el-popconfirm>
          </div>
          
          <!-- 查看更多按钮 -->
          <div v-if="chatStore.sessions.length > 4" class="see-more-btn">
            <el-button link type="info" @click="showHistoryDialog = true">
              看看更多
            </el-button>
          </div>
        </div>
      </el-scrollbar>
    </el-card>

    <!-- 历史记录弹窗 -->
    <el-dialog
      v-model="showHistoryDialog"
      title="历史对话记录"
      width="500px"
      append-to-body
      destroy-on-close
    >
      <el-scrollbar max-height="60vh">
        <div class="session-list">
          <div
            v-for="session in chatStore.sessions"
            :key="session.id"
            :class="['session-item', { active: session.id === chatStore.currentSessionId }]"
            @click="handleOpenSession(session.id)"
          >
            <div class="session-content">
              <div class="session-icon">
                <el-icon><ChatDotSquare /></el-icon>
              </div>
              <div class="session-info">
                <div class="session-name">{{ session.name }}</div>
                <div class="session-meta">{{ formatTime(session.updatedAt) }}</div>
              </div>
            </div>

            <el-popconfirm
              title="确定删除这条记录？"
              confirm-button-text="删除"
              cancel-button-text="取消"
              @confirm="handleDeleteSession(session.id)"
            >
              <template #reference>
                <el-icon class="delete-icon" @click.stop><Delete /></el-icon>
              </template>
            </el-popconfirm>
          </div>
        </div>
      </el-scrollbar>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useChatStore } from '../stores/chat'
import { ChatDotSquare, Delete } from '@element-plus/icons-vue'

const chatStore = useChatStore()
const showHistoryDialog = ref(false)

const displayedSessions = computed(() => {
  return chatStore.sessions.slice(0, 4)
})

const handleCreateSession = async (): Promise<void> => {
  await chatStore.createSession()
}

const handleOpenSession = async (sessionId: string): Promise<void> => {
  await chatStore.openSession(sessionId)
}

const handleDeleteSession = async (sessionId: string): Promise<void> => {
  await chatStore.deleteSession(sessionId)
}

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  // Check if today
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
.session-panel {
  width: 100%;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  font-size: 14px;
}

.session-list {
  display: flex;
  flex-direction: column;
}

.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid #f2f6fc;
}

.session-item:last-child {
  border-bottom: none;
}

.session-item:hover {
  background: #f5f7fa;
}

.session-item.active {
  background: #ecf5ff;
  border-right: 3px solid #409eff;
}

.session-content {
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
  flex: 1;
}

.session-icon {
  color: #909399;
  display: flex;
  align-items: center;
}

.session-item.active .session-icon {
  color: #409eff;
}

.session-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
  flex: 1;
}

.session-name {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.session-meta {
  font-size: 11px;
  color: #909399;
}

.delete-icon {
  display: none;
  color: #f56c6c;
  padding: 4px;
  border-radius: 4px;
}

.delete-icon:hover {
  background-color: rgba(245, 108, 108, 0.1);
}

.session-item:hover .delete-icon {
  display: block;
}

.empty-state {
  padding: 32px 0;
  text-align: center;
  color: #909399;
  font-size: 12px;
}

:deep(.el-card__header) {
  padding: 10px 16px;
  border-bottom: 1px solid #f2f6fc;
}

.see-more-btn {
  text-align: center;
  padding: 8px 0;
  border-top: 1px solid #f2f6fc;
}
</style>
