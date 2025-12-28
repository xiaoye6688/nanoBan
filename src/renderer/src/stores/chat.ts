import { defineStore } from 'pinia'
import { ref } from 'vue'
import { geminiAPI } from '../api/gemini'
import { useConfigStore } from './config'
import { useAuthStore } from './auth'
import type { ChatMessage } from '../types/gemini'

export const useChatStore = defineStore('chat', () => {
  // 状态
  const messages = ref<ChatMessage[]>([])
  const isGenerating = ref<boolean>(false)
  const currentPrompt = ref<string>('')
  const referenceImages = ref<string[]>([]) // 用于图生图的参考图片

  // 方法

  /**
   * 添加用户消息
   */
  function addUserMessage(content: string, images?: string[]): void {
    const message: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content,
      images,
      timestamp: Date.now()
    }
    messages.value.push(message)
    saveMessages()
  }

  /**
   * 添加模型响应消息
   */
  function addModelMessage(content: string, images?: string[]): void {
    const message: ChatMessage = {
      id: generateMessageId(),
      role: 'model',
      content,
      images,
      timestamp: Date.now()
    }
    messages.value.push(message)
    saveMessages()
  }

  /**
   * 生成图像
   */
  async function generateImage(prompt: string, refImages?: string[]): Promise<void> {
    const authStore = useAuthStore()
    const configStore = useConfigStore()

    if (!authStore.isAuthenticated) {
      throw new Error('请先进行认证')
    }

    isGenerating.value = true
    currentPrompt.value = prompt

    try {
      // 添加用户消息
      addUserMessage(prompt, refImages)

      // 获取当前配置
      const imageConfig = configStore.getCurrentImageConfig()

      // 调用 API 生成图像
      const result = await geminiAPI.generateImage(prompt, imageConfig, refImages)

      // 添加模型响应
      addModelMessage(result.text || '图像生成成功', result.images)
    } catch (error: unknown) {
      console.error('生成图像失败:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      addModelMessage(`生成失败: ${errorMessage}`)
      throw error
    } finally {
      isGenerating.value = false
      currentPrompt.value = ''
    }
  }

  /**
   * 设置参考图片（图生图）
   */
  function setReferenceImages(images: string[]): void {
    referenceImages.value = images
  }

  /**
   * 添加参考图片
   */
  function addReferenceImage(image: string): void {
    referenceImages.value.push(image)
  }

  /**
   * 移除参考图片
   */
  function removeReferenceImage(index: number): void {
    referenceImages.value.splice(index, 1)
  }

  /**
   * 清空参考图片
   */
  function clearReferenceImages(): void {
    referenceImages.value = []
  }

  /**
   * 清空对话历史
   */
  function clearMessages(): void {
    messages.value = []
    saveMessages()
  }

  /**
   * 删除指定消息
   */
  function deleteMessage(id: string): void {
    const index = messages.value.findIndex((msg) => msg.id === id)
    if (index !== -1) {
      messages.value.splice(index, 1)
      saveMessages()
    }
  }

  /**
   * 重新生成最后一张图片
   */
  async function regenerateLastImage(): Promise<void> {
    if (messages.value.length === 0) {
      throw new Error('没有可重新生成的消息')
    }

    // 找到最后一条用户消息
    for (let i = messages.value.length - 1; i >= 0; i--) {
      const msg = messages.value[i]
      if (msg.role === 'user') {
        await generateImage(msg.content, msg.images)
        break
      }
    }
  }

  /**
   * 保存消息到本地存储
   */
  function saveMessages(): void {
    localStorage.setItem('chat_messages', JSON.stringify(messages.value))
  }

  /**
   * 从本地存储加载消息
   */
  function loadMessages(): void {
    const saved = localStorage.getItem('chat_messages')
    if (saved) {
      try {
        messages.value = JSON.parse(saved)
      } catch (error) {
        console.error('加载消息失败:', error)
        messages.value = []
      }
    }
  }

  /**
   * 导出对话历史
   */
  function exportMessages(): string {
    return JSON.stringify(messages.value, null, 2)
  }

  /**
   * 导入对话历史
   */
  function importMessages(json: string): void {
    try {
      const imported = JSON.parse(json) as ChatMessage[]
      messages.value = imported
      saveMessages()
    } catch (error) {
      console.error('导入消息失败:', error)
      throw new Error('无效的 JSON 格式')
    }
  }

  /**
   * 生成消息 ID
   */
  function generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  return {
    // 状态
    messages,
    isGenerating,
    currentPrompt,
    referenceImages,
    // 方法
    addUserMessage,
    addModelMessage,
    generateImage,
    setReferenceImages,
    addReferenceImage,
    removeReferenceImage,
    clearReferenceImages,
    clearMessages,
    deleteMessage,
    regenerateLastImage,
    saveMessages,
    loadMessages,
    exportMessages,
    importMessages
  }
})
