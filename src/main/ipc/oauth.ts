import { ipcMain } from 'electron'
import {
  createOAuthSession,
  waitForOAuthToken,
  startOAuthFlow,
  refreshAccessToken,
  setOAuthConfig
} from '../oauth'

/**
 * 设置 OAuth 相关的 IPC 处理程序
 */
export function setupOAuthIPC(): void {
  // 启动 OAuth 授权流程
  ipcMain.handle('start-oauth', async () => {
    try {
      const token = await startOAuthFlow()
      return token
    } catch (error: unknown) {
      console.error('OAuth 授权失败:', error)
      throw error
    }
  })

  // 创建 OAuth 会话
  ipcMain.handle('create-oauth-session', () => {
    try {
      return createOAuthSession()
    } catch (error: unknown) {
      console.error('创建 OAuth 会话失败:', error)
      throw error
    }
  })

  // 等待 OAuth Token
  ipcMain.handle('wait-oauth-token', async (_, sessionId: string) => {
    try {
      return await waitForOAuthToken(sessionId)
    } catch (error: unknown) {
      console.error('等待 OAuth Token 失败:', error)
      throw error
    }
  })

  // 刷新访问令牌
  ipcMain.handle('refresh-oauth-token', async (_, refreshToken: string) => {
    try {
      const token = await refreshAccessToken(refreshToken)
      return token
    } catch (error: unknown) {
      console.error('刷新令牌失败:', error)
      throw error
    }
  })

  // 设置 OAuth 配置（客户端 ID、密钥等）
  ipcMain.handle(
    'set-oauth-config',
    async (_, config: { clientId: string; clientSecret: string; redirectUri?: string }) => {
      try {
        setOAuthConfig(config.clientId, config.clientSecret, config.redirectUri)
        return { success: true }
      } catch (error: unknown) {
        console.error('设置 OAuth 配置失败:', error)
        throw error
      }
    }
  )
}
