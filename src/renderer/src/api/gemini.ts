import axios from 'axios'
import type { ImageConfig } from '../types/gemini'

// Antigravity API 配置（与 CLIProxyAPI 保持一致）
const ANTIGRAVITY_BASE_URL = 'https://cloudcode-pa.googleapis.com'

interface AntigravityAuthConfig {
  accessToken: string
  refreshToken?: string
  expiresAt: number
  projectId?: string
  onTokenRefresh?: (newToken: { accessToken: string; expiresAt: number }) => Promise<void>
}

interface RequestPart {
  text?: string
  inlineData?: {
    data: string
    mimeType: string
  }
  thoughtSignature?: string // Gemini 3 需要的 thought signature
}

export interface ConversationMessage {
  role: 'user' | 'model'
  content?: string
  images?: string[]
  thoughtSignatures?: string[] // 用于传递每个 part 的 thoughtSignature
}

interface AntigravityRequest {
  model: string
  userAgent: string
  project: string
  requestId: string
  request: {
    sessionId: string
    contents: Array<{
      role: string
      parts: RequestPart[]
    }>
    generationConfig: {
      responseModalities: string[]
      imageConfig: {
        aspectRatio: string
        imageSize: string
      }
    }
    toolConfig: {
      functionCallingConfig: {
        mode: string
      }
    }
  }
}

export class GeminiAPI {
  private authConfig: AntigravityAuthConfig | null = null

  /**
   * 设置 Antigravity OAuth 认证配置
   * @param accessToken - OAuth access token
   * @param refreshToken - OAuth refresh token
   * @param expiresAt - Token 过期时间戳
   * @param projectId - GCP project ID
   * @param onTokenRefresh - Token 刷新回调
   */
  setAntigravityAuth(
    accessToken: string,
    refreshToken: string,
    expiresAt: number,
    projectId?: string,
    onTokenRefresh?: (newToken: { accessToken: string; expiresAt: number }) => Promise<void>
  ): void {
    this.authConfig = { accessToken, refreshToken, expiresAt, projectId, onTokenRefresh }
  }

  /**
   * 检查 API 是否已初始化
   */
  isInitialized(): boolean {
    return this.authConfig !== null && this.authConfig.accessToken !== ''
  }

  /**
   * 确保 Access Token 有效（自动刷新）
   * 如果 token 将在 50 分钟内过期，自动刷新
   */
  private async ensureValidToken(): Promise<void> {
    if (!this.authConfig) {
      throw new Error('API 未初始化，请先设置 OAuth 认证')
    }

    const REFRESH_SKEW = 50 * 60 * 1000 // 50分钟（毫秒）
    const now = Date.now()
    const timeUntilExpiry = this.authConfig.expiresAt - now

    // 如果 token 还有效且不在刷新窗口期内，直接返回
    if (timeUntilExpiry > REFRESH_SKEW) {
      return
    }

    // 需要刷新 token
    console.log('Token 即将过期，自动刷新...')
    if (!this.authConfig.refreshToken) {
      throw new Error('没有可用的 Refresh Token')
    }

    try {
      const newToken = await this.refreshAccessToken(this.authConfig.refreshToken)

      // 更新本地配置
      this.authConfig.accessToken = newToken.accessToken
      this.authConfig.expiresAt = newToken.expiresAt

      // 通知外部更新存储
      if (this.authConfig.onTokenRefresh) {
        await this.authConfig.onTokenRefresh(newToken)
      }

      console.log('Token 刷新成功')
    } catch (error) {
      console.error('自动刷新 Token 失败:', error)
      throw error
    }
  }

  /**
   * 刷新 Access Token
   */
  private async refreshAccessToken(
    refreshToken: string
  ): Promise<{ accessToken: string; expiresAt: number }> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: '1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com',
        client_secret: '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',
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`刷新 Token 失败: ${errorText}`)
    }

    const data = await response.json()
    return {
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000
    }
  }

  /**
   * 生成随机 Project ID（如果没有真实的）
   */
  private generateProjectId(): string {
    const adjectives = ['useful', 'bright', 'swift', 'calm', 'bold']
    const nouns = ['fuze', 'wave', 'spark', 'flow', 'core']
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    const randomPart = Math.random().toString(36).substring(2, 7)
    return `${adj}-${noun}-${randomPart}`
  }

  /**
   * 生成随机 Request ID
   */
  private generateRequestId(): string {
    return `agent-${crypto.randomUUID()}`
  }

  /**
   * 生成稳定的 Session ID（基于提示词）
   */
  private generateSessionId(prompt: string): string {
    // 使用提示词生成一个稳定的 session ID
    let hash = 0
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return `-${Math.abs(hash)}`
  }

  private normalizeSessionId(sessionId?: string, fallbackPrompt?: string): string {
    if (sessionId && sessionId.trim() !== '') {
      return sessionId.replace(/\.json$/i, '')
    }
    return fallbackPrompt ? this.generateSessionId(fallbackPrompt) : `-${Date.now()}`
  }

  /**
   * 构建 Antigravity API 请求体
   * 注意：Antigravity API 使用特殊的包装结构，与标准 Gemini API 不同
   */
  private buildAntigravityRequest(
    prompt: string,
    imageConfig: ImageConfig,
    referenceImages?: string[],
    options?: { sessionId?: string; history?: ConversationMessage[] }
  ): AntigravityRequest {
    // 构建内容部分
    const contents =
      options?.history && options.history.length > 0
        ? this.buildContentsFromHistory(options.history)
        : this.buildContentsFromPrompt(prompt, referenceImages)

    const projectId = this.authConfig?.projectId || this.generateProjectId()

    // Antigravity API 使用包装结构：顶层包含 model, userAgent, project, requestId
    // 实际的 Gemini 请求在 request 字段内
    return {
      model: 'gemini-3-pro-image', // API内部使用的模型名称(不是preview别名)
      userAgent: 'antigravity',
      project: projectId,
      requestId: this.generateRequestId(),
      request: {
        sessionId: this.normalizeSessionId(options?.sessionId, prompt),
        contents,
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: {
            aspectRatio: imageConfig.aspectRatio,
            imageSize: imageConfig.imageSize
          }
        },
        toolConfig: {
          functionCallingConfig: {
            mode: 'VALIDATED'
          }
        }
      }
    }
  }

  private buildContentsFromPrompt(
    prompt: string,
    referenceImages?: string[]
  ): Array<{ role: string; parts: RequestPart[] }> {
    const parts: RequestPart[] = [{ text: prompt }]

    if (referenceImages && referenceImages.length > 0) {
      for (const imageBase64 of referenceImages) {
        const { data, mimeType } = this.parseImageData(imageBase64)
        parts.push({
          inlineData: {
            data,
            mimeType
          }
        })
      }
    }

    return [
      {
        role: 'user',
        parts
      }
    ]
  }

  private buildContentsFromHistory(
    history: ConversationMessage[]
  ): Array<{ role: string; parts: RequestPart[] }> {
    return history
      .map((message) => {
        const parts: RequestPart[] = []
        let signatureIndex = 0 // 跟踪 thoughtSignature 的索引

        if (message.content) {
          const textPart: RequestPart = { text: message.content }
          // 只有模型返回的消息才添加 thoughtSignature
          // 用户消息不应该有 thoughtSignature
          if (
            message.role === 'model' &&
            message.thoughtSignatures &&
            message.thoughtSignatures[signatureIndex]
          ) {
            textPart.thoughtSignature = message.thoughtSignatures[signatureIndex]
          }
          parts.push(textPart)
          signatureIndex++
        }

        if (message.images && message.images.length > 0) {
          for (const imageBase64 of message.images) {
            const { data, mimeType } = this.parseImageData(imageBase64)
            const imagePart: RequestPart = {
              inlineData: {
                data,
                mimeType
              }
            }
            // 只有模型返回的消息才添加 thoughtSignature
            // 用户消息不应该有 thoughtSignature
            if (
              message.role === 'model' &&
              message.thoughtSignatures &&
              message.thoughtSignatures[signatureIndex]
            ) {
              imagePart.thoughtSignature = message.thoughtSignatures[signatureIndex]
            }
            parts.push(imagePart)
            signatureIndex++
          }
        }
        return { role: message.role, parts }
      })
      .filter((message) => message.parts.length > 0)
  }

  private parseImageData(imageBase64: string): { data: string; mimeType: string } {
    const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
    if (match) {
      return { mimeType: match[1], data: match[2] }
    }
    return { mimeType: 'image/jpeg', data: imageBase64 }
  }

  /**
   * 使用 Antigravity API 生成图像
   */
  async generateImage(
    prompt: string,
    imageConfig: ImageConfig,
    referenceImages?: string[],
    options?: { sessionId?: string; history?: ConversationMessage[]; signal?: AbortSignal }
  ): Promise<{ text?: string; images: string[]; thoughtSignatures?: string[] }> {
    // 自动检查并刷新 token（如果需要）
    await this.ensureValidToken()

    if (!this.authConfig) {
      throw new Error('API 未初始化，请先设置 OAuth 认证')
    }

    const requestBody = this.buildAntigravityRequest(prompt, imageConfig, referenceImages, options)

    const response = await axios.post(
      `${ANTIGRAVITY_BASE_URL}/v1internal:generateContent`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authConfig.accessToken}`,
          Accept: 'application/json'
        },
        signal: options?.signal,
        timeout: 120000 // 2分钟超时
      }
    )

    // 解析响应
    const data = response.data
    const images: string[] = []
    const thoughtSignatures: string[] = []
    let text: string | undefined

    // 检查响应格式
    const responseData = data.response || data
    if (responseData.candidates && responseData.candidates.length > 0) {
      const parts = responseData.candidates[0].content?.parts || []

      for (const part of parts) {
        // 保存 thoughtSignature（如果存在）
        if (part.thoughtSignature || part.thought_signature) {
          thoughtSignatures.push(part.thoughtSignature || part.thought_signature)
        } else {
          // 即使没有 signature，也要占位以保持索引对应
          thoughtSignatures.push('')
        }

        if (part.text) {
          text = part.text
        } else if (part.inlineData || part.inline_data) {
          const inlineData = part.inlineData || part.inline_data
          images.push(`data:${inlineData.mimeType || 'image/png'};base64,${inlineData.data}`)
        }
      }
    }

    console.log('使用 Antigravity API 成功')
    return {
      text,
      images,
      thoughtSignatures: thoughtSignatures.length > 0 ? thoughtSignatures : undefined
    }
  }
}

// 导出单例
export const geminiAPI = new GeminiAPI()
