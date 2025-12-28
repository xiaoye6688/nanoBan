<template>
  <div class="chat-view">
    <!-- 消息列表区域 -->
    <el-scrollbar ref="scrollbarRef" class="messages-container">
      <div v-if="chatStore.messages.length > 0" class="messages-list">
        <div
          v-for="message in chatStore.messages"
          :key="message.id"
          :class="['message-item', message.role]"
        >
          <div class="message-content">
            <div class="message-header">
              <span class="message-role">{{ message.role === 'user' ? '用户' : 'Gemini' }}</span>
              <span class="message-time">{{ formatTime(message.timestamp) }}</span>
            </div>

            <!-- 文本内容 -->
            <div v-if="message.content" class="message-text">
              {{ message.content }}
            </div>

            <!-- 图片内容 -->
            <div v-if="message.images && message.images.length > 0" class="message-images">
              <div v-for="(img, idx) in message.images" :key="idx" class="message-image-wrapper">
                <el-image
                  :src="img"
                  :preview-src-list="message.images"
                  :initial-index="idx"
                  fit="cover"
                  class="message-image"
                  lazy
                />
                <div class="image-actions">
                  <el-button
                    :icon="Download"
                    circle
                    size="small"
                    type="primary"
                    title="保存图片"
                    @click="handleSaveImage(img, message.id, idx)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty v-else description="暂无对话记录" />
    </el-scrollbar>

    <!-- 输入区域 -->
    <div class="input-area">
      <!-- 参考图片预览 -->
      <div v-if="chatStore.referenceImages.length > 0" class="reference-images">
        <div class="reference-title">参考图片:</div>
        <div class="reference-list">
          <div
            v-for="(img, index) in chatStore.referenceImages"
            :key="index"
            class="reference-item"
          >
            <el-image :src="img" fit="cover" class="reference-thumb" />
            <el-icon class="remove-icon" @click="removeReferenceImage(index)">
              <Close />
            </el-icon>
          </div>
        </div>
      </div>

      <!-- 输入框和按钮 -->
      <div class="input-controls">
        <el-upload
          :auto-upload="false"
          :show-file-list="false"
          accept="image/*"
          :on-change="handleImageUpload"
          multiple
        >
          <el-button :icon="Picture" circle title="上传参考图片" />
        </el-upload>

        <el-input
          v-model="promptInput"
          type="textarea"
          :rows="3"
          placeholder="输入图片描述..."
          @keydown.ctrl.enter="handleGenerate"
        />

        <el-button
          type="primary"
          :loading="chatStore.isGenerating"
          :disabled="!canGenerate"
          @click="handleGenerate"
        >
          {{ chatStore.isGenerating ? '生成中...' : '生成图片' }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useChatStore } from '../stores/chat'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'
import { Picture, Close, Download } from '@element-plus/icons-vue'
import type { UploadFile } from 'element-plus'

const chatStore = useChatStore()
const authStore = useAuthStore()

const scrollbarRef = ref()
const promptInput = ref('')

// 是否可以生成
const canGenerate = computed(() => {
  return authStore.isAuthenticated && promptInput.value.trim() !== '' && !chatStore.isGenerating
})

// 处理图片上传
const handleImageUpload = (file: UploadFile): void => {
  const reader = new FileReader()
  reader.onload = (e): void => {
    const base64 = e.target?.result as string
    chatStore.addReferenceImage(base64)
  }
  if (file.raw) {
    reader.readAsDataURL(file.raw)
  }
}

// 移除参考图片
const removeReferenceImage = (index: number): void => {
  chatStore.removeReferenceImage(index)
}

// 生成图片
const handleGenerate = async (): Promise<void> => {
  if (!canGenerate.value) {
    if (!authStore.isAuthenticated) {
      ElMessage.warning('请先设置认证')
    } else if (!promptInput.value.trim()) {
      ElMessage.warning('请输入提示词')
    }
    return
  }

  try {
    const prompt = promptInput.value.trim()
    const refImages =
      chatStore.referenceImages.length > 0 ? [...chatStore.referenceImages] : undefined

    await chatStore.generateImage(prompt, refImages)

    // 清空输入
    promptInput.value = ''
    chatStore.clearReferenceImages()

    // 滚动到底部
    nextTick(() => {
      scrollToBottom()
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '生成失败'
    ElMessage.error(errorMessage)
  }
}

// 滚动到底部
const scrollToBottom = (): void => {
  if (scrollbarRef.value) {
    const scrollElement = scrollbarRef.value.$el.querySelector('.el-scrollbar__wrap')
    if (scrollElement) {
      scrollElement.scrollTop = scrollElement.scrollHeight
    }
  }
}

// 格式化时间
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 保存图片
const handleSaveImage = async (
  imageBase64: string,
  messageId: string,
  imageIndex: number
): Promise<void> => {
  try {
    const defaultFileName = `gemini_image_${messageId}_${imageIndex + 1}.png`
    const result = await window.api.saveImage(imageBase64, defaultFileName)

    if (result.success) {
      ElMessage.success('图片保存成功')
    } else if (result.canceled) {
      // 用户取消了保存
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    console.error('保存图片失败:', error)
    ElMessage.error(`保存失败: ${errorMessage}`)
  }
}

// 监听消息变化，自动滚动
watch(
  () => chatStore.messages.length,
  () => {
    nextTick(() => {
      scrollToBottom()
    })
  }
)
</script>

<style scoped>
.chat-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.messages-container {
  flex: 1;
  padding: 20px;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  display: flex;
}

.message-item.user {
  justify-content: flex-end;
}

.message-item.model {
  justify-content: flex-start;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 8px;
}

.message-item.user .message-content {
  background: #409eff;
  color: #fff;
}

.message-item.model .message-content {
  background: #f4f4f5;
  color: #303133;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
}

.message-item.user .message-header {
  color: rgba(255, 255, 255, 0.9);
}

.message-item.model .message-header {
  color: #909399;
}

.message-role {
  font-weight: 600;
}

.message-time {
  opacity: 0.8;
}

.message-text {
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
  margin-top: 8px;
}

.message-image-wrapper {
  position: relative;
  width: 100%;
  height: 200px;
}

.message-image-wrapper:hover .image-actions {
  opacity: 1;
}

.message-image {
  width: 100%;
  height: 200px;
  border-radius: 4px;
  cursor: pointer;
}

.image-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-actions .el-button {
  background: rgba(0, 0, 0, 0.6);
  border-color: transparent;
}

.image-actions .el-button:hover {
  background: rgba(0, 0, 0, 0.8);
}

.input-area {
  border-top: 1px solid #e4e7ed;
  padding: 16px 20px;
  background: #fff;
}

.reference-images {
  margin-bottom: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.reference-title {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}

.reference-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.reference-item {
  position: relative;
  width: 80px;
  height: 80px;
}

.reference-thumb {
  width: 100%;
  height: 100%;
  border-radius: 4px;
}

.remove-icon {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  background: #f56c6c;
  color: #fff;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.input-controls {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

:deep(.el-textarea__inner) {
  resize: none;
}

:deep(.el-empty) {
  padding: 100px 0;
}
</style>
