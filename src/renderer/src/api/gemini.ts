import axios from 'axios'
import type { ImageConfig } from '../types/gemini'

// Antigravity API 配置
const ANTIGRAVITY_BASE_URLS = [
  'https://daily-cloudcode-pa.googleapis.com',
  'https://daily-cloudcode-pa.sandbox.googleapis.com',
  'https://cloudcode-pa.googleapis.com'
]

interface AntigravityAuthConfig {
  accessToken: string
  projectId?: string
}

interface RequestPart {
  text?: string
  inlineData?: {
    data: string
    mimeType: string
  }
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
   * @param projectId - GCP project ID
   */
  setAntigravityAuth(accessToken: string, projectId?: string): void {
    this.authConfig = { accessToken, projectId }
  }

  /**
   * 检查 API 是否已初始化
   */
  isInitialized(): boolean {
    return this.authConfig !== null && this.authConfig.accessToken !== ''
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

  /**
   * Decide whether to try another endpoint after a failure.
   */
  private shouldTryNextEndpoint(error: unknown): boolean {
    if (!axios.isAxiosError(error)) {
      return true
    }

    const status = error.response?.status

    if (status === 400 || status === 401 || status === 403) {
      return false
    }

    if (status === undefined) {
      return true
    }

    if (status === 404 || status === 429) {
      return true
    }

    return status >= 500 && status <= 599
  }

  /**
   * 构建 Antigravity API 请求体
   * 注意：Antigravity API 使用特殊的包装结构，与标准 Gemini API 不同
   */
  private buildAntigravityRequest(
    prompt: string,
    imageConfig: ImageConfig,
    referenceImages?: string[]
  ): AntigravityRequest {
    // 构建内容部分
    const parts: RequestPart[] = [{ text: prompt }]

    // 如果有参考图片，添加到请求中
    if (referenceImages && referenceImages.length > 0) {
      for (const imageBase64 of referenceImages) {
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: 'image/jpeg'
          }
        })
      }
    }

    const projectId = this.authConfig?.projectId || this.generateProjectId()

    // Antigravity API 使用包装结构：顶层包含 model, userAgent, project, requestId
    // 实际的 Gemini 请求在 request 字段内
    return {
      model: 'gemini-3-pro-image', // 内部模型名（不带 -preview）
      userAgent: 'antigravity',
      project: projectId,
      requestId: this.generateRequestId(),
      request: {
        sessionId: this.generateSessionId(prompt),
        contents: [
          {
            role: 'user',
            parts
          }
        ],
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

  /**
   * 使用 Antigravity API 生成图像
   */
  async generateImage(
    prompt: string,
    imageConfig: ImageConfig,
    referenceImages?: string[]
  ): Promise<{ text?: string; images: string[] }> {
    if (!this.authConfig) {
      throw new Error('API 未初始化，请先设置 OAuth 认证')
    }

    const requestBody = this.buildAntigravityRequest(prompt, imageConfig, referenceImages)

    // 尝试多个 base URL
    let lastError: unknown = null
    for (const baseUrl of ANTIGRAVITY_BASE_URLS) {
      try {
        const response = await axios.post(`${baseUrl}/v1internal:generateContent`, requestBody, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.authConfig.accessToken}`,
            Accept: 'application/json'
          },
          timeout: 120000 // 2分钟超时
        })

        // 解析响应
        const data = response.data
        const images: string[] = []
        let text: string | undefined

        // 检查响应格式
        const responseData = data.response || data
        if (responseData.candidates && responseData.candidates.length > 0) {
          const parts = responseData.candidates[0].content?.parts || []

          for (const part of parts) {
            if (part.text) {
              text = part.text
            } else if (part.inlineData || part.inline_data) {
              const inlineData = part.inlineData || part.inline_data
              images.push(`data:${inlineData.mimeType || 'image/png'};base64,${inlineData.data}`)
            }
          }
        }

        console.log(`使用 Antigravity API 成功: ${baseUrl}`)
        return { text, images }
      } catch (error: unknown) {
        const errorMessage = axios.isAxiosError(error) ? error.message : '未知错误'
        console.warn(`尝试 ${baseUrl} 失败:`, errorMessage)
        lastError = error

        if (!this.shouldTryNextEndpoint(error)) {
          throw error
        }
      }
    }

    // 所有 URL 都失败了
    throw lastError || new Error('所有 Antigravity API 端点都失败了')
  }

  /**
   * 流式生成（Antigravity 流式 API）
   */
  async generateImageStream(
    prompt: string,
    imageConfig: ImageConfig,
    onChunk: (chunk: { text?: string; image?: string }) => void
  ): Promise<void> {
    if (!this.authConfig) {
      throw new Error('API 未初始化，请先设置 OAuth 认证')
    }

    const requestBody = this.buildAntigravityRequest(prompt, imageConfig)

    // 尝试多个 base URL
    let lastError: unknown = null
    for (const baseUrl of ANTIGRAVITY_BASE_URLS) {
      try {
        const response = await axios.post(
          `${baseUrl}/v1internal:streamGenerateContent?alt=sse`,
          requestBody,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.authConfig.accessToken}`,
              Accept: 'text/event-stream'
            },
            responseType: 'stream',
            timeout: 120000
          }
        )

        // 处理 SSE 流
        const stream = response.data
        stream.on('data', (chunk: Buffer) => {
          const lines = chunk.toString().split('\n')
          for (const line of lines) {
            if (line.trim() && line.startsWith('data: ')) {
              try {
                const jsonData = JSON.parse(line.substring(6))
                const responseData = jsonData.response || jsonData

                if (responseData.candidates && responseData.candidates.length > 0) {
                  const parts = responseData.candidates[0].content?.parts || []
                  for (const part of parts) {
                    if (part.text) {
                      onChunk({ text: part.text })
                    } else if (part.inlineData || part.inline_data) {
                      const inlineData = part.inlineData || part.inline_data
                      onChunk({
                        image: `data:${inlineData.mimeType || 'image/png'};base64,${inlineData.data}`
                      })
                    }
                  }
                }
              } catch (e) {
                console.error('解析 SSE 数据失败:', e)
              }
            }
          }
        })

        return
      } catch (error: unknown) {
        const errorMessage = axios.isAxiosError(error) ? error.message : '未知错误'
        console.warn(`流式请求失败 ${baseUrl}:`, errorMessage)
        lastError = error

        if (!this.shouldTryNextEndpoint(error)) {
          throw error
        }
      }
    }

    throw lastError || new Error('所有 Antigravity API 端点都失败了')
  }
}

// 导出单例
export const geminiAPI = new GeminiAPI()
