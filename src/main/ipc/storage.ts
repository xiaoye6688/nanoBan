import { ipcMain } from 'electron'
import {
  getSettings,
  updateSettings,
  selectStoragePath,
  setStoragePath,
  listChatSessions,
  readChatSession,
  writeChatSession,
  createChatSession,
  deleteChatSession,
  saveImageToStorage,
  readImageAsBase64,
  listAuths,
  readAuth,
  saveAuth,
  deleteAuth,
  getFileUrl
} from '../storage'

/**
 * 设置存储相关的 IPC 处理程序
 * 包括设置管理、聊天会话管理、图片管理、授权管理等
 */
export function setupStorageIPC(): void {
  // ========== 设置管理 ==========
  ipcMain.handle('get-settings', () => {
    try {
      return getSettings()
    } catch (error: unknown) {
      console.error('读取设置失败:', error)
      throw error
    }
  })

  ipcMain.handle('update-settings', (_, partial: Record<string, unknown>) => {
    try {
      return updateSettings(partial)
    } catch (error: unknown) {
      console.error('更新设置失败:', error)
      throw error
    }
  })

  ipcMain.handle('select-storage-path', async () => {
    try {
      return await selectStoragePath()
    } catch (error: unknown) {
      console.error('选择存储目录失败:', error)
      throw error
    }
  })

  ipcMain.handle('set-storage-path', async (_, path: string, migrate?: boolean) => {
    try {
      return await setStoragePath(path, { migrate })
    } catch (error: unknown) {
      console.error('设置存储目录失败:', error)
      throw error
    }
  })

  // ========== 聊天会话管理 ==========

  ipcMain.handle('list-chats', async () => {
    try {
      return await listChatSessions()
    } catch (error: unknown) {
      console.error('读取聊天列表失败:', error)
      throw error
    }
  })

  ipcMain.handle('read-chat', async (_, sessionId: string) => {
    try {
      return await readChatSession(sessionId)
    } catch (error: unknown) {
      console.error('读取聊天记录失败:', error)
      throw error
    }
  })

  ipcMain.handle('write-chat', async (_, sessionId: string, messages: unknown[]) => {
    try {
      return await writeChatSession(sessionId, messages as never)
    } catch (error: unknown) {
      console.error('保存聊天记录失败:', error)
      throw error
    }
  })

  ipcMain.handle('create-chat', async (_, name?: string) => {
    try {
      return await createChatSession(name)
    } catch (error: unknown) {
      console.error('创建聊天记录失败:', error)
      throw error
    }
  })

  ipcMain.handle('delete-chat', async (_, sessionId: string) => {
    try {
      await deleteChatSession(sessionId)
      return { success: true }
    } catch (error: unknown) {
      console.error('删除聊天记录失败:', error)
      throw error
    }
  })

  // ========== 图片管理 ==========

  ipcMain.handle('save-storage-image', async (_, base64Data: string, options?: object) => {
    try {
      return await saveImageToStorage(base64Data, options as never)
    } catch (error: unknown) {
      console.error('保存图片失败:', error)
      throw error
    }
  })

  ipcMain.handle('get-file-url', (_, relativePath: string) => {
    try {
      return getFileUrl(relativePath)
    } catch (error: unknown) {
      console.error('生成文件链接失败:', error)
      throw error
    }
  })

  ipcMain.handle('read-image-base64', async (_, relativePath: string) => {
    try {
      return await readImageAsBase64(relativePath)
    } catch (error: unknown) {
      console.error('读取图片失败:', error)
      throw error
    }
  })

  // ========== 授权管理 ==========

  ipcMain.handle('list-auths', async () => {
    try {
      return await listAuths()
    } catch (error: unknown) {
      console.error('读取授权列表失败:', error)
      throw error
    }
  })

  ipcMain.handle('read-auth', async (_, authId: string) => {
    try {
      return await readAuth(authId)
    } catch (error: unknown) {
      console.error('读取授权失败:', error)
      throw error
    }
  })

  ipcMain.handle('save-auth', async (_, record: Record<string, unknown>) => {
    try {
      return await saveAuth(record as never)
    } catch (error: unknown) {
      console.error('保存授权失败:', error)
      throw error
    }
  })

  ipcMain.handle('delete-auth', async (_, authId: string) => {
    try {
      await deleteAuth(authId)
      return { success: true }
    } catch (error: unknown) {
      console.error('删除授权失败:', error)
      throw error
    }
  })
}
