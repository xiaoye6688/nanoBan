<template>
  <BaseDialog v-model="dialogVisible" title="设置" width="600px" @close="handleClose">
    <BaseTabs v-model="activeTab">
      <BaseTabPane label="授权设置" name="auth">
        <div class="flex flex-col gap-4">
          <div class="text-sm font-semibold text-white/80">已保存的授权</div>
          <div
            v-if="authStore.auths.length === 0"
            class="rounded-xl bg-white/5 py-6 text-center text-[13px] text-white/40"
          >
            暂无授权信息
          </div>
          <div v-else class="flex flex-col gap-2.5">
            <div
              v-for="auth in authStore.auths"
              :key="auth.id"
              :class="[
                'flex items-center justify-between rounded-xl border p-3 transition-all',
                auth.id === authStore.activeAuthId
                  ? 'border-[#FFF9F2]/30 bg-[#FFF9F2]/10'
                  : 'border-white/10 hover:border-white/20'
              ]"
            >
              <div class="flex flex-col gap-1">
                <div class="text-sm font-semibold text-white/80">{{ auth.label }}</div>
                <div class="flex flex-col gap-0.5 text-xs text-white/50">
                  <span>{{ auth.email || auth.projectId || '未命名账号' }}</span>
                  <span>过期: {{ formatExpires(auth.expiresAt) }}</span>
                </div>
              </div>
              <div class="flex gap-2">
                <BaseButton
                  size="small"
                  type="primary"
                  :disabled="auth.id === authStore.activeAuthId"
                  @click="handleSelectAuth(auth.id)"
                >
                  使用
                </BaseButton>
                <BaseButton size="small" @click="handleRefreshToken(auth.id)">刷新</BaseButton>
                <BasePopconfirm
                  title="确定删除该授权？"
                  confirm-text="删除"
                  cancel-text="取消"
                  confirm-type="danger"
                  @confirm="handleRemoveAuth(auth.id)"
                >
                  <BaseButton size="small" type="danger" variant="ghost">删除</BaseButton>
                </BasePopconfirm>
              </div>
            </div>
          </div>
        </div>

        <hr class="my-6 border-white/10" />

        <div class="flex flex-col gap-4">
          <div class="text-sm font-semibold text-white/80">新增授权</div>
          <div class="flex items-center gap-2.5">
            <BaseButton type="success" :loading="linkLoading" @click="handleCreateAuthLink">
              生成授权链接
            </BaseButton>
            <BaseButton
              :disabled="!authStore.pendingAuthUrl"
              icon="mdi:link"
              @click="handleOpenAuthLink"
            >
              打开链接
            </BaseButton>
            <BaseButton
              :disabled="!authStore.pendingAuthUrl"
              icon="mdi:content-copy"
              @click="handleCopyAuthLink"
            >
              复制链接
            </BaseButton>
          </div>

          <BaseInput
            v-if="authStore.pendingAuthUrl"
            :model-value="authStore.pendingAuthUrl"
            readonly
            placeholder="等待生成授权链接"
          />

          <BaseAlert v-if="!authStore.pendingAuthUrl" type="info" :closable="false">
            点击"生成授权链接"后，将得到一个授权地址。选择打开浏览器或复制链接进行授权。
          </BaseAlert>

          <BaseAlert v-if="authStore.isAuthorizing" type="warning" :closable="false">
            <div class="flex items-center justify-between">
              <span>已生成授权链接，等待浏览器回调中…</span>
              <BaseButton size="small" variant="ghost" @click="handleCancelAuth"> 取消 </BaseButton>
            </div>
          </BaseAlert>
        </div>
      </BaseTabPane>

      <BaseTabPane label="常规设置" name="general">
        <div class="flex flex-col gap-4">
          <div class="text-sm font-semibold text-white/80">存储目录</div>

          <div class="flex gap-2">
            <BaseInput
              :model-value="storagePath"
              readonly
              placeholder="选择存储路径"
              class="flex-1"
            >
              <template #append>
                <button
                  class="flex h-full items-center rounded-r-lg border-l border-white/10 bg-white/5 px-3 text-white/50 transition-colors hover:bg-white/10 hover:text-white/70"
                  title="选择文件夹"
                  @click="handleSelectStorage"
                >
                  <Icon icon="mdi:folder" class="h-4 w-4" />
                </button>
              </template>
            </BaseInput>
          </div>

          <div class="flex items-center justify-between py-2">
            <div class="flex items-center gap-1.5 text-sm text-white/60">
              <span>迁移文件</span>
              <BaseTooltip
                content="开启后，修改存储目录时会自动将旧目录下的聊天记录和图片迁移到新目录。"
              >
                <Icon icon="mdi:help-circle" class="h-4 w-4 cursor-help text-white/30" />
              </BaseTooltip>
            </div>
            <BaseSwitch v-model="migrateFiles" />
          </div>

          <BaseAlert type="info" :closable="false">
            聊天记录、图片与授权文件将保存在该目录下。
          </BaseAlert>
        </div>
      </BaseTabPane>

      <BaseTabPane label="数据管理" name="data">
        <div class="flex flex-col gap-4">
          <div class="text-sm font-semibold text-white/80">数据维护</div>
          <div class="grid grid-cols-2 gap-4">
            <div
              class="flex items-center gap-3 rounded-xl border border-white/10 p-4 transition-all hover:border-[#FFF9F2]/30 hover:bg-white/5"
            >
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-900/30 text-xl text-green-400"
              >
                <Icon icon="mdi:download" />
              </div>
              <div class="flex-1">
                <div class="text-sm font-semibold text-white/80">导出数据</div>
                <div class="mt-0.5 text-xs text-white/50">备份所有对话记录</div>
              </div>
              <BaseButton size="small" @click="handleExportMessages">导出</BaseButton>
            </div>

            <div
              class="flex items-center gap-3 rounded-xl border border-white/10 p-4 transition-all hover:border-red-500/30 hover:bg-red-900/10"
            >
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-900/30 text-xl text-red-400"
              >
                <Icon icon="mdi:delete" />
              </div>
              <div class="flex-1">
                <div class="text-sm font-semibold text-white/80">清空数据</div>
                <div class="mt-0.5 text-xs text-white/50">删除所有历史记录</div>
              </div>
              <BasePopconfirm
                title="确定清空所有数据？不可恢复。"
                confirm-text="清空"
                cancel-text="取消"
                confirm-type="danger"
                @confirm="handleClearMessages"
              >
                <BaseButton size="small" type="danger" variant="outline">清空</BaseButton>
              </BasePopconfirm>
            </div>
          </div>
        </div>
      </BaseTabPane>
    </BaseTabs>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '../stores/auth'
import { useChatStore } from '../stores/chat'
import {
  BaseDialog,
  BaseTabs,
  BaseTabPane,
  BaseButton,
  BaseInput,
  BaseAlert,
  BaseSwitch,
  BaseTooltip,
  BasePopconfirm,
  toast
} from './ui'

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
    toast.success('授权链接已生成')
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '生成授权链接失败'
    toast.error(errorMessage)
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
    toast.success('授权链接已复制')
  } catch (error) {
    console.error('复制链接失败:', error)
    toast.error('复制链接失败')
  }
}

const handleSelectAuth = async (authId: string): Promise<void> => {
  try {
    await authStore.selectAuth(authId)
    toast.success('授权已切换')
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '切换失败'
    toast.error(errorMessage)
  }
}

const handleRemoveAuth = async (authId: string): Promise<void> => {
  try {
    await authStore.removeAuth(authId)
    toast.success('授权已删除')
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '删除失败'
    toast.error(errorMessage)
  }
}

const handleRefreshToken = async (authId: string): Promise<void> => {
  if (authId !== authStore.activeAuthId) {
    await handleSelectAuth(authId)
  }
  try {
    await authStore.refreshOAuthToken()
    toast.success('Token 已刷新')
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '刷新失败'
    toast.error(errorMessage)
  }
}

const handleCancelAuth = async (): Promise<void> => {
  await authStore.cancelOAuth()
  toast.info('已取消授权')
}

const handleSelectStorage = async (): Promise<void> => {
  const selected = await window.api.selectStoragePath()
  if (!selected) return

  try {
    const settings = await window.api.setStoragePath(selected, migrateFiles.value)
    storagePath.value = settings.storagePath
    await chatStore.initialize()
    await authStore.loadAuths()
    toast.success('存储目录已更新')
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '设置失败'
    toast.error(errorMessage)
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
    toast.success('对话历史已清空')
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
    toast.success('对话已导出')
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '导出失败'
    toast.error(errorMessage)
  }
}
</script>
