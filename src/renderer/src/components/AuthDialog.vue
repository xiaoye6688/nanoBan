<template>
  <el-dialog v-model="dialogVisible" title="设置认证" width="500px" :before-close="handleClose">
    <el-tabs v-model="activeTab">
      <!-- API Key 认证 -->
      <el-tab-pane label="API Key" name="apikey">
        <el-form label-width="100px">
          <el-form-item label="API Key">
            <el-input
              v-model="apiKeyInput"
              type="password"
              placeholder="请输入 Google AI API Key"
              show-password
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="loading" @click="handleSetApiKey">
              保存 API Key
            </el-button>
            <el-link
              href="https://ai.google.dev/"
              target="_blank"
              type="primary"
              style="margin-left: 12px"
            >
              获取 API Key
            </el-link>
          </el-form-item>
          <el-alert title="提示" type="info" :closable="false" show-icon>
            请前往 Google AI Studio 获取 API Key
          </el-alert>
        </el-form>
      </el-tab-pane>

      <!-- OAuth 2.0 认证 -->
      <el-tab-pane label="Antigravity OAuth" name="oauth">
        <el-form label-width="120px">
          <el-alert
            title="关于 Antigravity OAuth"
            type="info"
            :closable="false"
            show-icon
            style="margin-bottom: 20px"
          >
            <p>Antigravity OAuth 使用 Google 账号进行认证，无需手动配置 Client ID 和 Secret。</p>
            <p>点击下方按钮后，将打开浏览器窗口进行 Google 账号授权。</p>
          </el-alert>

          <el-form-item>
            <el-button
              type="success"
              size="large"
              :loading="loading"
              style="width: 100%"
              @click="handleStartOAuth"
            >
              <el-icon style="margin-right: 8px"><UserFilled /></el-icon>
              使用 Google 账号登录
            </el-button>
          </el-form-item>

          <el-divider />

          <el-descriptions title="功能说明" :column="1" border size="small">
            <el-descriptions-item label="认证方式"> Google OAuth 2.0 </el-descriptions-item>
            <el-descriptions-item label="所需权限">
              云平台访问、用户信息、Gemini API
            </el-descriptions-item>
            <el-descriptions-item label="数据存储"> Token 仅保存在本地 </el-descriptions-item>
          </el-descriptions>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'
import { UserFilled } from '@element-plus/icons-vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const authStore = useAuthStore()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const activeTab = ref('apikey')
const loading = ref(false)

// API Key 输入
const apiKeyInput = ref('')

// 设置 API Key
const handleSetApiKey = (): void => {
  if (!apiKeyInput.value.trim()) {
    ElMessage.warning('请输入 API Key')
    return
  }

  try {
    authStore.setApiKey(apiKeyInput.value.trim())
    ElMessage.success('API Key 设置成功')
    dialogVisible.value = false
    apiKeyInput.value = ''
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '设置失败'
    ElMessage.error(errorMessage)
  }
}

// 开始 OAuth 授权
const handleStartOAuth = async (): Promise<void> => {
  loading.value = true
  try {
    await authStore.startOAuthFlow()
    ElMessage.success('Antigravity OAuth 授权成功')
    dialogVisible.value = false
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'OAuth 授权失败'
    ElMessage.error(errorMessage)
  } finally {
    loading.value = false
  }
}

// 关闭对话框
const handleClose = (): void => {
  dialogVisible.value = false
}
</script>

<style scoped>
:deep(.el-dialog__body) {
  padding: 20px 20px 30px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-alert) {
  margin-top: 12px;
}
</style>
