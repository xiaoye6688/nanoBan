import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { geminiAPI, type ConversationMessage } from '../api/gemini'
import { useConfigStore } from './config'
import { useAuthStore } from './auth'
import type { ChatMessage } from '../types/gemini'

export const useChatStore = defineStore('chat', () => {
  // 状态
  const messages = ref<ChatMessage[]>([])
  const sessions = ref<
    Array<{
      id: string
      name: string
      updatedAt: number
      createdAt?: number
    }>
  >([])
  const currentSessionId = ref<string | null>(null)
  const isGenerating = ref<boolean>(false)
  const currentPrompt = ref<string>('')
  const referenceImages = ref<string[]>([]) // 用于图生图的参考图片
  const isLoadingSessions = ref<boolean>(false)
  const abortController = ref<AbortController | null>(null)

  // 方法
  const currentSession = computed(() =>
    sessions.value.find((session) => session.id === currentSessionId.value)
  )

  async function initialize(): Promise<void> {
    await loadSessions()
    const settings = await window.api.getSettings()
    if (settings.lastSessionId) {
      const opened = await openSession(settings.lastSessionId)
      if (opened) return
    }

    if (sessions.value.length > 0) {
      await openSession(sessions.value[0].id)
      return
    }

    await createSession()
  }

  async function loadSessions(): Promise<void> {
    isLoadingSessions.value = true
    try {
      sessions.value = await window.api.listChats()
    } finally {
      isLoadingSessions.value = false
    }
  }

  async function createSession(name?: string): Promise<void> {
    const session = await window.api.createChat(name)
    upsertSession(session)
    await openSession(session.id)
  }

  async function openSession(sessionId: string): Promise<boolean> {
    try {
      const result = await window.api.readChat(sessionId)
      messages.value = await hydrateMessages(result.messages)
      currentSessionId.value = result.session.id
      upsertSession(result.session)
      await window.api.updateSettings({ lastSessionId: result.session.id })
      return true
    } catch (error) {
      console.error('加载聊天记录失败:', error)
      return false
    }
  }

  async function deleteSession(sessionId: string): Promise<void> {
    await window.api.deleteChat(sessionId)
    sessions.value = sessions.value.filter((session) => session.id !== sessionId)
    if (currentSessionId.value === sessionId) {
      currentSessionId.value = null
      messages.value = []
      if (sessions.value.length > 0) {
        await openSession(sessions.value[0].id)
      } else {
        await createSession()
      }
    }
  }

  function upsertSession(session: {
    id: string
    name: string
    updatedAt: number
    createdAt?: number
  }): void {
    const index = sessions.value.findIndex((item) => item.id === session.id)
    if (index >= 0) {
      sessions.value.splice(index, 1, session)
    } else {
      sessions.value.unshift(session)
    }
  }

  function stripRuntimeFields(message: ChatMessage): ChatMessage {
    return {
      id: message.id,
      role: message.role,
      content: message.content,
      images: message.images ? [...message.images] : undefined,
      thoughtSignatures: message.thoughtSignatures ? [...message.thoughtSignatures] : undefined,
      timestamp: message.timestamp
    }
  }

  async function hydrateMessages(rawMessages: ChatMessage[]): Promise<ChatMessage[]> {
    const hydrated = await Promise.all(
      rawMessages.map(async (msg) => {
        if (!msg.images || msg.images.length === 0) {
          return msg
        }
        const imageUrls = await resolveImageUrls(msg.images)
        return { ...msg, imageUrls }
      })
    )
    return hydrated
  }

  async function resolveImageUrls(images: string[]): Promise<string[]> {
    return Promise.all(
      images.map(async (img) => {
        if (img.startsWith('data:')) {
          return img
        }
        return window.api.readImageBase64(img)
      })
    )
  }

  async function resolveImagesAsBase64(images: string[]): Promise<string[]> {
    return Promise.all(
      images.map(async (img) => {
        if (img.startsWith('data:')) {
          return img
        }
        return window.api.readImageBase64(img)
      })
    )
  }

  async function buildConversationHistory(): Promise<ConversationMessage[]> {
    const history = await Promise.all(
      messages.value.map(async (msg) => {
        const images = msg.images ? await resolveImagesAsBase64(msg.images) : undefined
        return {
          role: msg.role,
          content: msg.content,
          images,
          thoughtSignatures: msg.thoughtSignatures // 传递 thought signatures
        }
      })
    )
    return history.filter((item) => item.content || (item.images && item.images.length > 0))
  }

  async function persistImages(images?: string[], prefix?: string): Promise<string[] | undefined> {
    if (!images || images.length === 0) {
      return undefined
    }
    const saved = await Promise.all(
      images.map((image) => window.api.saveStorageImage(image, { prefix }))
    )
    return saved.map((result) => result.relativePath)
  }

  /**
   * 添加用户消息
   */
  async function addUserMessage(content: string, images?: string[]): Promise<void> {
    const message: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content,
      images: await persistImages(images, 'prompt'),
      timestamp: Date.now()
    }
    if (message.images && message.images.length > 0) {
      message.imageUrls = await resolveImageUrls(message.images)
    }
    messages.value.push(message)
    await saveMessages()
  }

  /**
   * 添加模型响应消息
   */
  async function addModelMessage(
    content: string,
    images?: string[],
    thoughtSignatures?: string[]
  ): Promise<void> {
    const message: ChatMessage = {
      id: generateMessageId(),
      role: 'model',
      content,
      images: await persistImages(images, 'generated'),
      thoughtSignatures, // 保存 thought signatures
      timestamp: Date.now()
    }
    if (message.images && message.images.length > 0) {
      message.imageUrls = await resolveImageUrls(message.images)
    }
    messages.value.push(message)
    await saveMessages()
  }

  /**
   * 停止生成
   */
  async function stopGeneration(): Promise<void> {
    if (abortController.value) {
      abortController.value.abort()
      abortController.value = null
    }
    isGenerating.value = false
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

    // Cancel previous request if any
    if (abortController.value) {
      abortController.value.abort()
    }
    abortController.value = new AbortController()

    isGenerating.value = true
    currentPrompt.value = prompt

    try {
      if (!currentSessionId.value) {
        await createSession()
      }
      // 添加用户消息
      await addUserMessage(prompt, refImages)

      // 获取当前配置
      const imageConfig = configStore.getCurrentImageConfig()

      // 调用 API 生成图像
      let history: ConversationMessage[] | undefined
      try {
        history = await buildConversationHistory()
      } catch (error) {
        console.warn('构建历史消息失败，将使用当前提示词:', error)
      }

      // 调用 API 生成图像
      const result = await geminiAPI.generateImage(prompt, imageConfig, refImages, {
        sessionId: currentSessionId.value || undefined,
        history,
        signal: abortController.value.signal
      })

      // 添加模型响应
      await addModelMessage(result.text || '图像生成成功', result.images, result.thoughtSignatures)
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'CanceledError') {
        console.log('生成已取消')
        return
      }
      console.error('生成图像失败:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      await addModelMessage(`生成失败: ${errorMessage}`)
      throw error
    } finally {
      isGenerating.value = false
      currentPrompt.value = ''
      abortController.value = null
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
    void saveMessages()
  }

  /**
   * 删除指定消息
   */
  function deleteMessage(id: string): void {
    const index = messages.value.findIndex((msg) => msg.id === id)
    if (index !== -1) {
      messages.value.splice(index, 1)
      void saveMessages()
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
        let refImages: string[] | undefined
        if (msg.images && msg.images.length > 0) {
          refImages = await Promise.all(
            msg.images.map((img) =>
              img.startsWith('data:') ? Promise.resolve(img) : window.api.readImageBase64(img)
            )
          )
        }
        await generateImage(msg.content, refImages)
        break
      }
    }
  }

  /**
   * 保存消息到本地存储
   */
  async function saveMessages(): Promise<void> {
    if (!currentSessionId.value) return
    const storedMessages = messages.value.map(stripRuntimeFields)
    const session = await window.api.writeChat(currentSessionId.value, storedMessages)
    upsertSession(session)
  }

  /**
   * 从本地存储加载消息
   */
  async function loadMessages(): Promise<void> {
    if (!currentSessionId.value) return
    await openSession(currentSessionId.value)
  }

  /**
   * 导出对话历史
   */
  function exportMessages(): string {
    const storedMessages = messages.value.map(stripRuntimeFields)
    return JSON.stringify(storedMessages, null, 2)
  }

  /**
   * 导入对话历史
   */
  async function importMessages(json: string): Promise<void> {
    try {
      const imported = JSON.parse(json) as ChatMessage[]
      messages.value = await hydrateMessages(imported)
      await saveMessages()
    } catch (error) {
      console.error('导入消息失败:', error)
      throw new Error('无效的 JSON 格式')
    }
  }

  /**
   * 生成消息 ID
   */
  function generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  return {
    // 状态
    messages,
    sessions,
    currentSessionId,
    currentSession,
    isGenerating,
    currentPrompt,
    referenceImages,
    isLoadingSessions,
    // 方法
    initialize,
    loadSessions,
    createSession,
    openSession,
    deleteSession,
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
    importMessages,
    stopGeneration
  }
})
