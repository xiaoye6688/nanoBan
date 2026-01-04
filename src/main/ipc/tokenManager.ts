import { ipcMain } from 'electron'
import { tokenManager } from '../tokenManager'

/**
 * 设置 TokenManager 相关的 IPC 处理程序
 */
export function setupTokenManagerIPC(): void {
  // 获取有效的 token（自动刷新如果需要）
  ipcMain.handle('get-valid-token', async (_, authId: string) => {
    try {
      return await tokenManager.getValidToken(authId)
    } catch (error: unknown) {
      console.error('获取有效 token 失败:', error)
      throw error
    }
  })

  // 手动刷新 token
  ipcMain.handle('refresh-token', async (_, authId: string) => {
    try {
      return await tokenManager.refreshTokenWithRetryForAuth(authId)
    } catch (error: unknown) {
      console.error('刷新 token 失败:', error)
      throw error
    }
  })

  // 检查所有 token 状态
  ipcMain.handle('check-all-tokens', async () => {
    try {
      return await tokenManager.checkAllTokens()
    } catch (error: unknown) {
      console.error('检查 token 状态失败:', error)
      throw error
    }
  })

  // 启动定期检查
  ipcMain.handle('start-token-check', () => {
    try {
      tokenManager.startPeriodicCheck()
      return { success: true }
    } catch (error: unknown) {
      console.error('启动 token 检查失败:', error)
      throw error
    }
  })

  // 停止定期检查
  ipcMain.handle('stop-token-check', () => {
    try {
      tokenManager.stopPeriodicCheck()
      return { success: true }
    } catch (error: unknown) {
      console.error('停止 token 检查失败:', error)
      throw error
    }
  })
}
