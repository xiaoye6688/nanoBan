// Gemini API 相关类型定义

// 图像分辨率选项
export type ImageSize = '1K' | '2K' | '4K'

// 宽高比选项
export type AspectRatio =
  | '1:1'
  | '2:3'
  | '3:2'
  | '3:4'
  | '4:3'
  | '4:5'
  | '5:4'
  | '9:16'
  | '16:9'
  | '21:9'

// 图像配置
export interface ImageConfig {
  aspectRatio: AspectRatio
  imageSize: ImageSize
}

// 生成配置
export interface GenerateContentConfig {
  responseModalities: string[]
  imageConfig?: ImageConfig
  temperature?: number
  topP?: number
  topK?: number
  maxOutputTokens?: number
}

// 对话消息类型
export interface ChatMessage {
  id: string
  role: 'user' | 'model'
  content: string
  images?: string[] // Base64 编码的图片
  timestamp: number
}

// API 响应的图片部分
export interface ImagePart {
  inlineData: {
    mimeType: string
    data: string // Base64
  }
}

// API 响应的文本部分
export interface TextPart {
  text: string
}

// 内容部分（可以是文本或图片）
export type ContentPart = TextPart | ImagePart

// API 响应结构
export interface GeminiResponse {
  candidates: {
    content: {
      parts: ContentPart[]
    }
  }[]
  usageMetadata?: {
    promptTokenCount: number
    candidatesTokenCount: number
    totalTokenCount: number
  }
}

// 预设配置模板
export interface PresetConfig {
  name: string
  imageSize: ImageSize
  aspectRatio: AspectRatio
  description?: string
}

// OAuth Token 信息
export interface OAuthToken {
  accessToken: string
  refreshToken?: string
  expiresAt: number
  tokenType: string
  email?: string
  projectId?: string
}
