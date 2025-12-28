<template>
  <el-dialog v-model="dialogVisible" title="设置" width="640px" :before-close="handleClose">
    <el-tabs v-model="activeTab">
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
          <el-alert type="info" :closable="false" show-icon>
            点击“生成授权链接”后，将得到一个授权地址。你可以选择打开浏览器或复制链接进行授权。
          </el-alert>

          <div class="auth-link-actions">
            <el-button type="success" :loading="linkLoading" @click="handleCreateAuthLink">
              生成授权链接
            </el-button>
            <el-button
              :disabled="!authStore.pendingAuthUrl"
              @click="handleOpenAuthLink"
              :icon="Link"
            >
              打开链接
            </el-button>
            <el-button
              :disabled="!authStore.pendingAuthUrl"
              @click="handleCopyAuthLink"
              :icon="CopyDocument"
            >
              复制链接
            </el-button>
          </div>

          <el-input
            v-model="authStore.pendingAuthUrl"
            readonly
            placeholder="等待生成授权链接"
            class="auth-link-input"
          />

          <el-alert v-if="authStore.isAuthorizing" type="warning" :closable="false" show-icon>
            已生成授权链接，等待浏览器回调中…
          </el-alert>
        </div>
      </el-tab-pane>

      <el-tab-pane label="常规设置" name="general">
        <div class="section">
          <div class="section-title">存储目录</div>
          <el-input v-model="storagePath" readonly />
          <div class="storage-actions">
            <el-button type="primary" @click="handleSelectStorage">选择目录</el-button>
          </div>
          <el-alert type="info" :closable="false" show-icon>
            聊天记录、图片与授权文件将保存在该目录下。
          </el-alert>
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CopyDocument, Link } from '@element-plus/icons-vue'
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

  let migrate = false
  try {
    await ElMessageBox.confirm('是否迁移旧目录中的聊天记录、图片和授权文件？', '迁移数据', {
      confirmButtonText: '迁移',
      cancelButtonText: '不迁移',
      type: 'warning'
    })
    migrate = true
  } catch {
    migrate = false
  }

  try {
    const settings = await window.api.setStoragePath(selected, migrate)
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
</script>

<style scoped>
:deep(.el-dialog__body) {
  padding: 20px 24px 28px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-weight: 600;
  color: #303133;
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
  padding: 12px 14px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.auth-item.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.auth-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 320px;
}

.auth-name {
  font-weight: 600;
  font-size: 14px;
}

.auth-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.auth-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.auth-link-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.auth-link-input {
  margin-bottom: 8px;
}

.storage-actions {
  display: flex;
  gap: 12px;
}

.empty-state {
  padding: 16px 0;
  text-align: center;
  color: #909399;
  font-size: 12px;
}
</style>
