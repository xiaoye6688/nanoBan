<template>
  <el-dialog
    v-model="dialogVisible"
    title="设置"
    width="600px"
    :before-close="handleClose"
    destroy-on-close
  >
    <el-tabs v-model="activeTab" class="settings-tabs">
      <el-tab-pane label="授权设置" name="auth">
        <div class="section">
          <div class="section-title">已保存的授权</div>
          <div v-if="authStore.auths.length === 0" class="empty-state">暂无授权信息</div>
          <div v-else class="auth-list">
            <div
              v-for="auth in authStore.auths"
              :key="auth.id"
              :class="['auth-item', { active: auth.id === authStore.activeAuthId }]"
            >
              <div class="auth-info">
                <div class="auth-name">{{ auth.label }}</div>
                <div class="auth-meta">
                  <span>{{ auth.email || auth.projectId || '未命名账号' }}</span>
                  <span>过期: {{ formatExpires(auth.expiresAt) }}</span>
                </div>
              </div>
              <div class="auth-actions">
                <el-button
                  size="small"
                  type="primary"
                  :disabled="auth.id === authStore.activeAuthId"
                  @click="handleSelectAuth(auth.id)"
                >
                  使用
                </el-button>
                <el-button size="small" @click="handleRefreshToken(auth.id)">刷新</el-button>
                <el-popconfirm
                  title="确定删除该授权？"
                  confirm-button-text="删除"
                  cancel-button-text="取消"
                  @confirm="handleRemoveAuth(auth.id)"
                >
                  <template #reference>
                    <el-button size="small" type="danger" text>删除</el-button>
                  </template>
                </el-popconfirm>
              </div>
            </div>
          </div>
        </div>

        <el-divider />

        <div class="section">
          <div class="section-title">新增授权</div>
          <div class="auth-link-actions">
            <el-button type="success" :loading="linkLoading" @click="handleCreateAuthLink">
              生成授权链接
            </el-button>
            <el-button
              :disabled="!authStore.pendingAuthUrl"
              :icon="Link"
              @click="handleOpenAuthLink"
            >
              打开链接
            </el-button>
            <el-button
              :disabled="!authStore.pendingAuthUrl"
              :icon="CopyDocument"
              @click="handleCopyAuthLink"
            >
              复制链接
            </el-button>
          </div>

          <el-input
            v-if="authStore.pendingAuthUrl"
            v-model="authStore.pendingAuthUrl"
            readonly
            placeholder="等待生成授权链接"
            class="auth-link-input"
          />

          <el-alert
            v-if="!authStore.pendingAuthUrl"
            type="info"
            :closable="false"
            show-icon
            style="margin-top: 10px"
          >
            点击“生成授权链接”后，将得到一个授权地址。选择打开浏览器或复制链接进行授权。
          </el-alert>

          <el-alert
            v-if="authStore.isAuthorizing"
            type="warning"
            :closable="false"
            show-icon
            style="margin-top: 10px"
          >
            已生成授权链接，等待浏览器回调中…
          </el-alert>
        </div>
      </el-tab-pane>

      <el-tab-pane label="常规设置" name="general">
        <div class="section">
          <div class="section-title">存储目录</div>

          <div class="storage-path-control">
            <el-input v-model="storagePath" readonly placeholder="选择存储路径">
              <template #append>
                <el-button :icon="Folder" title="选择文件夹" @click="handleSelectStorage" />
              </template>
            </el-input>
          </div>

          <div class="setting-item">
            <div class="setting-label">
              <span>迁移文件</span>
              <el-tooltip
                content="开启后，修改存储目录时会自动将旧目录下的聊天记录和图片迁移到新目录。"
                placement="top"
              >
                <el-icon class="help-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
            <el-switch v-model="migrateFiles" />
          </div>

          <el-alert type="info" :closable="false" show-icon style="margin-top: 8px">
            聊天记录、图片与授权文件将保存在该目录下。
          </el-alert>
        </div>
      </el-tab-pane>

      <el-tab-pane label="数据管理" name="data">
        <div class="section">
          <div class="section-title">数据维护</div>
          <div class="data-actions-grid">
            <div class="data-card">
              <div class="data-card-icon export">
                <el-icon><Download /></el-icon>
              </div>
              <div class="data-card-content">
                <div class="title">导出数据</div>
                <div class="desc">备份所有对话记录</div>
              </div>
              <el-button size="small" @click="handleExportMessages">导出</el-button>
            </div>

            <div class="data-card">
              <div class="data-card-icon delete">
                <el-icon><Delete /></el-icon>
              </div>
              <div class="data-card-content">
                <div class="title">清空数据</div>
                <div class="desc">删除所有历史记录</div>
              </div>
              <el-popconfirm
                title="确定清空所有数据？不可恢复。"
                confirm-button-text="清空"
                cancel-button-text="取消"
                @confirm="handleClearMessages"
              >
                <template #reference>
                  <el-button size="small" type="danger" plain>清空</el-button>
                </template>
              </el-popconfirm>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  CopyDocument,
  Link,
  Folder,
  QuestionFilled,
  Download,
  Delete
} from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { useChatStore } from '../stores/chat'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const authStore = useAuthStore()
const chatStore = useChatStore()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const activeTab = ref('auth')
const linkLoading = ref(false)
const storagePath = ref('')
const migrateFiles = ref(true) // Default to true

watch(
  () => dialogVisible.value,
  async (visible) => {
    if (!visible) return
    try {
      const settings = await window.api.getSettings()
      storagePath.value = settings.storagePath
      await authStore.loadAuths()
    } catch (error) {
      console.error('加载设置失败:', error)
    }
  }
)

const handleCreateAuthLink = async (): Promise<void> => {
  linkLoading.value = true
  try {
    await authStore.createOAuthLink()
    ElMessage.success('授权链接已生成')
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '生成授权链接失败'
    ElMessage.error(errorMessage)
  } finally {
    linkLoading.value = false
  }
}

const handleOpenAuthLink = async (): Promise<void> => {
  if (!authStore.pendingAuthUrl) return
  await window.api.openExternal(authStore.pendingAuthUrl)
}

const handleCopyAuthLink = async (): Promise<void> => {
  if (!authStore.pendingAuthUrl) return
  try {
    await navigator.clipboard.writeText(authStore.pendingAuthUrl)
    ElMessage.success('授权链接已复制')
  } catch (error) {
    console.error('复制链接失败:', error)
    ElMessage.error('复制链接失败')
  }
}

const handleSelectAuth = async (authId: string): Promise<void> => {
  try {
    await authStore.selectAuth(authId)
    ElMessage.success('授权已切换')
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '切换失败'
    ElMessage.error(errorMessage)
  }
}

const handleRemoveAuth = async (authId: string): Promise<void> => {
  try {
    await authStore.removeAuth(authId)
    ElMessage.success('授权已删除')
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '删除失败'
    ElMessage.error(errorMessage)
  }
}

const handleRefreshToken = async (authId: string): Promise<void> => {
  if (authId !== authStore.activeAuthId) {
    await handleSelectAuth(authId)
  }
  try {
    await authStore.refreshOAuthToken()
    ElMessage.success('Token 已刷新')
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '刷新失败'
    ElMessage.error(errorMessage)
  }
}

const handleSelectStorage = async (): Promise<void> => {
  const selected = await window.api.selectStoragePath()
  if (!selected) return

  try {
    const settings = await window.api.setStoragePath(selected, migrateFiles.value)
    storagePath.value = settings.storagePath
    await chatStore.initialize()
    await authStore.loadAuths()
    ElMessage.success('存储目录已更新')
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '设置失败'
    ElMessage.error(errorMessage)
  }
}

const formatExpires = (expiresAt: number): string => {
  const date = new Date(expiresAt)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 关闭对话框
const handleClose = (): void => {
  dialogVisible.value = false
}

// 清空对话历史
const handleClearMessages = async (): Promise<void> => {
  try {
    chatStore.clearMessages()
    ElMessage.success('对话历史已清空')
  } catch (error) {
    console.error(error)
  }
}

// 导出对话
const handleExportMessages = (): void => {
  try {
    const json = chatStore.exportMessages()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gemini-chat-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('对话已导出')
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '导出失败'
    ElMessage.error(errorMessage)
  }
}
</script>

<style scoped>
:deep(.el-dialog__body) {
  padding: 10px 24px 24px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
  margin-bottom: 4px;
}

.auth-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.auth-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.2s;
}

.auth-item:hover {
  border-color: #c0c4cc;
}

.auth-item.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.auth-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.auth-name {
  font-weight: 600;
  font-size: 14px;
}

.auth-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: #909399;
}

.auth-actions {
  display: flex;
  gap: 8px;
}

.auth-link-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.auth-link-input {
  margin-top: 8px;
}

.empty-state {
  padding: 24px 0;
  text-align: center;
  color: #909399;
  font-size: 13px;
  background: #f5f7fa;
  border-radius: 8px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #606266;
}

.help-icon {
  color: #909399;
  font-size: 16px;
  cursor: help;
}

.data-actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.data-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;
}

.data-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.data-card-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.data-card-icon.export {
  background: #f0f9eb;
  color: #67c23a;
}

.data-card-icon.delete {
  background: #fef0f0;
  color: #f56c6c;
}

.data-card-content {
  flex: 1;
}

.data-card-content .title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.data-card-content .desc {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}
</style>
