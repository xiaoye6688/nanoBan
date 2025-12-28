import { ElectronAPI } from '@electron-toolkit/preload'

// OAuth Token 接口
export interface OAuthToken {
  accessToken: string
  refreshToken?: string
  expiresAt: number
  tokenType: string
}

// OAuth 配置接口
export interface OAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri?: string
}

// 保存图片结果接口
export interface SaveImageResult {
  success: boolean
  canceled?: boolean
  filePath?: string
}

// 自定义 API 接口
export interface CustomAPI {
  startOAuth: () => Promise<OAuthToken>
  refreshOAuthToken: (refreshToken: string) => Promise<OAuthToken>
  setOAuthConfig: (config: OAuthConfig) => Promise<{ success: boolean }>
  saveImage: (base64Data: string, defaultFileName?: string) => Promise<SaveImageResult>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: CustomAPI
  }
}
