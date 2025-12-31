import { ElectronAPI } from '@electron-toolkit/preload'

// OAuth Token 接口
export interface OAuthToken {
  accessToken: string
  refreshToken?: string
  expiresAt: number
  tokenType: string
  email?: string
  projectId?: string
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

export interface AppSettings {
  storagePath: string
  imageSize: string
  aspectRatio: string
  presets?: unknown[]
  activeAuthId?: string
  lastSessionId?: string
}

export interface ChatSessionInfo {
  id: string
  name: string
  updatedAt: number
  createdAt?: number
}

export interface StoredChatMessage {
  id: string
  role: 'user' | 'model'
  content: string
  images?: string[]
  timestamp: number
}

export interface AuthSummary {
  id: string
  label: string
  email?: string
  projectId?: string
  expiresAt: number
  tokenType: string
  createdAt: number
  updatedAt: number
}

export interface AuthRecord {
  type: string
  label: string
  email?: string
  projectId?: string
  accessToken: string
  refreshToken?: string
  expiresAt: number
  tokenType: string
  createdAt: number
  updatedAt: number
}

// 自定义 API 接口
export interface CustomAPI {
  startOAuth: () => Promise<OAuthToken>
  createOAuthSession: () => Promise<{ sessionId: string; authUrl: string }>
  waitOAuthToken: (sessionId: string) => Promise<OAuthToken>
  refreshOAuthToken: (refreshToken: string) => Promise<OAuthToken>
  setOAuthConfig: (config: OAuthConfig) => Promise<{ success: boolean }>
  openExternal: (url: string) => Promise<{ success: boolean }>
  getSettings: () => Promise<AppSettings>
  updateSettings: (partial: Record<string, unknown>) => Promise<AppSettings>
  selectStoragePath: () => Promise<string | null>
  setStoragePath: (path: string, migrate?: boolean) => Promise<AppSettings>
  listChats: () => Promise<ChatSessionInfo[]>
  readChat: (
    sessionId: string
  ) => Promise<{ session: ChatSessionInfo; messages: StoredChatMessage[] }>
  writeChat: (sessionId: string, messages: StoredChatMessage[]) => Promise<ChatSessionInfo>
  createChat: (name?: string) => Promise<ChatSessionInfo>
  deleteChat: (sessionId: string) => Promise<{ success: boolean }>
  saveStorageImage: (
    base64Data: string,
    options?: Record<string, unknown>
  ) => Promise<{ relativePath: string; fileName: string }>
  getFileUrl: (relativePath: string) => Promise<string>
  readImageBase64: (relativePath: string) => Promise<string>
  listAuths: () => Promise<AuthSummary[]>
  readAuth: (authId: string) => Promise<AuthRecord | null>
  saveAuth: (record: Record<string, unknown>) => Promise<AuthSummary>
  deleteAuth: (authId: string) => Promise<{ success: boolean }>
  saveImage: (base64Data: string, defaultFileName?: string) => Promise<SaveImageResult>
  exportImage: (relativePath: string, defaultFileName?: string) => Promise<SaveImageResult>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: CustomAPI
  }
}
