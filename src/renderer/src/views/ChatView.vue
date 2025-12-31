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
          <!-- 头像 -->
          <div class="avatar">
            <template v-if="message.role === 'model'">
              <div class="avatar-ai">
                <el-icon><Sugar /></el-icon>
              </div>
            </template>
            <template v-else>
              <div class="avatar-user">
                <el-icon><User /></el-icon>
              </div>
            </template>
          </div>

          <!-- 消息内容 -->
          <div class="message-content">
            <div v-if="message.role === 'model'" class="sender-name">Gemini</div>

            <!-- 文本内容 -->
            <div v-if="message.content" class="message-text">
              {{ message.content }}
            </div>

            <!-- 图片内容 -->
            <div v-if="message.imageUrls && message.imageUrls.length > 0" class="message-images">
              <div v-for="(img, idx) in message.imageUrls" :key="idx" class="message-image-wrapper">
                <el-image
                  :src="img"
                  :preview-src-list="message.imageUrls"
                  :initial-index="idx"
                  :preview-teleported="true"
                  :hide-on-click-modal="true"
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
                    @click="handleSaveImage(message.images?.[idx] || img, message.id, idx)"
                  />
                </div>
              </div>
            </div>

            <div v-if="false" class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty v-else description="暂无对话记录" :image-size="120" />
    </el-scrollbar>

    <!-- 底部输入区域 -->
    <div class="input-section">
      <!-- 参考图片预览栏 -->
      <div v-if="chatStore.referenceImages.length > 0" class="reference-bar">
        <div v-for="(img, index) in chatStore.referenceImages" :key="index" class="reference-item">
          <el-image :src="img" fit="cover" class="reference-thumb" />
          <div class="remove-btn" @click="removeReferenceImage(index)">
            <el-icon><Close /></el-icon>
          </div>
        </div>
      </div>

      <!-- 输入工具栏 -->
      <div class="input-toolbar">
        <div class="toolbar-left">
          <el-upload
            :auto-upload="false"
            :show-file-list="false"
            accept="image/*"
            :on-change="handleImageUpload"
            multiple
            :disabled="chatStore.isGenerating"
          >
            <el-button link class="tool-btn" :disabled="chatStore.isGenerating" title="上传参考图">
              <el-icon :size="20"><Picture /></el-icon>
            </el-button>
          </el-upload>
        </div>

        <div class="input-wrapper">
          <el-input
            v-model="promptInput"
            type="textarea"
            class="chat-input"
            :autosize="{ minRows: 1, maxRows: 5 }"
            resize="none"
            placeholder="输入画面描述..."
            :disabled="chatStore.isGenerating"
            @keydown.enter.prevent="handleEnterKey"
          />
        </div>

        <div class="toolbar-right">
          <el-button
            v-if="chatStore.isGenerating"
            type="danger"
            circle
            class="action-btn"
            title="停止生成"
            @click="handleStop"
          >
            <el-icon><VideoPause /></el-icon>
          </el-button>
          <el-button
            v-else
            type="primary"
            circle
            class="action-btn"
            :disabled="!canGenerate"
            title="发送"
            @click="handleGenerate"
          >
            <el-icon><Position /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useChatStore } from '../stores/chat'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'
import {
  Picture,
  Close,
  Download,
  Sugar,
  User,
  Position,
  VideoPause
} from '@element-plus/icons-vue'
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

const handleEnterKey = (e: KeyboardEvent): void => {
  if (!e.shiftKey) {
    handleGenerate()
  }
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

  const prompt = promptInput.value.trim()
  promptInput.value = ''

  nextTick(() => {
    scrollToBottom()
  })

  try {
    const refImages =
      chatStore.referenceImages.length > 0 ? [...chatStore.referenceImages] : undefined

    chatStore.clearReferenceImages()

    await chatStore.generateImage(prompt, refImages)
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'CanceledError') {
      return
    }
  }
}

// 停止生成
const handleStop = async (): Promise<void> => {
  await chatStore.stopGeneration()
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
  imageSource: string,
  messageId: string,
  imageIndex: number
): Promise<void> => {
  try {
    const defaultFileName = `gemini_image_${messageId}_${imageIndex + 1}.png`
    const result = imageSource.startsWith('data:')
      ? await window.api.saveImage(imageSource, defaultFileName)
      : await window.api.exportImage(imageSource, defaultFileName)

    if (result.success) {
      ElMessage.success('图片保存成功')
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '未知错误'
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
  background: #f5f5f5;
}

.messages-container {
  flex: 1;
  padding: 20px;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 900px;
  margin: 0 auto;
}

.message-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.message-item.user {
  flex-direction: row-reverse;
}

.avatar {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 4px;
  overflow: hidden;
}

.avatar-ai {
  width: 100%;
  height: 100%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409eff;
  font-size: 20px;
  border: 1px solid #e4e7ed;
}

.avatar-user {
  width: 100%;
  height: 100%;
  background: #95d475;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
}

.message-content {
  display: flex;
  flex-direction: column;
  max-width: 85%;
  align-items: flex-start;
}

.message-item.user .message-content {
  align-items: flex-end;
}

.sender-name {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.message-text {
  padding: 10px 14px;
  border-radius: 4px;
  line-height: 1.6;
  font-size: 14px;
  word-break: break-all;
  white-space: pre-wrap;
  width: fit-content;
  position: relative;
}

.message-item.model .message-text {
  background: #fff;
  color: #303133;
  border: 1px solid #e4e7ed;
}

.message-item.user .message-text {
  background: #95d475;
  color: #303133;
  border: 1px solid #8bc96d;
}

.message-images {
  margin-top: 12px;
  background: transparent;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.message-image-wrapper {
  position: relative;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;
  border: 1px solid #ebeef5;
}

.message-image-wrapper:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.message-image {
  width: 100%;
  height: auto;
  display: block;
}

.image-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  opacity: 0;
  transition: opacity 0.2s;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  padding: 4px;
  border-radius: 20px;
  display: flex;
  align-items: center;
}

.message-image-wrapper:hover .image-actions {
  opacity: 1;
}

.input-section {
  background: #f5f5f5;
  border-top: 1px solid #e4e7ed;
  padding: 10px 20px 20px;
}

.reference-bar {
  display: flex;
  gap: 10px;
  padding: 0 0 10px;
  overflow-x: auto;
}

.reference-item {
  position: relative;
  width: 60px;
  height: 60px;
  flex-shrink: 0;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #e4e7ed;
}

.reference-thumb {
  width: 100%;
  height: 100%;
}

.remove-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  cursor: pointer;
}

.input-toolbar {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  background: #fff;
  border-radius: 4px; /* Slightly rounded */
  padding: 8px;
  max-width: 900px;
  margin: 0 auto;
}

.tool-btn {
  color: #606266;
  padding: 4px;
}

.tool-btn:hover {
  color: #303133;
}

.input-wrapper {
  flex: 1;
}

.chat-input :deep(.el-textarea__inner) {
  box-shadow: none;
  border: none;
  background: transparent;
  padding: 4px 0;
  min-height: 40px !important;
}

.chat-input :deep(.el-textarea__inner:focus) {
  box-shadow: none;
}

.action-btn {
  width: 32px;
  height: 32px;
  min-width: 32px;
}

.messages-container :deep(.el-empty) {
  padding: 40px 0;
  margin: auto;
}
</style>
