<template>
  <div class="session-panel">
    <el-card shadow="never">
      <template #header>
        <div class="panel-header">
          <span>对话记录</span>
          <el-button type="primary" size="small" @click="handleCreateSession">新建</el-button>
        </div>
      </template>

      <el-scrollbar max-height="320px">
        <div v-if="chatStore.sessions.length === 0" class="empty-state">暂无聊天记录</div>
        <div v-else class="session-list">
          <div
            v-for="session in chatStore.sessions"
            :key="session.id"
            :class="['session-item', { active: session.id === chatStore.currentSessionId }]"
            @click="handleOpenSession(session.id)"
          >
            <div class="session-info">
              <div class="session-name">{{ session.name }}</div>
              <div class="session-meta">{{ formatTime(session.updatedAt) }}</div>
            </div>
            <el-popconfirm
              title="确定删除这条记录？"
              confirm-button-text="删除"
              cancel-button-text="取消"
              @confirm="handleDeleteSession(session.id)"
            >
              <template #reference>
                <el-button type="danger" text size="small" @click.stop> 删除 </el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>
      </el-scrollbar>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useChatStore } from '../stores/chat'

const chatStore = useChatStore()

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
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
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
}

.session-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.session-item:hover {
  border-color: #409eff;
  background: #ecf5ff;
}

.session-item.active {
  border-color: #409eff;
  background: #e6f1ff;
}

.session-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}

.session-name {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  max-width: 180px;
}

.session-meta {
  font-size: 12px;
  color: #909399;
}

.empty-state {
  padding: 24px 0;
  text-align: center;
  color: #909399;
  font-size: 12px;
}

:deep(.el-card__header) {
  padding: 12px 16px;
}
</style>
