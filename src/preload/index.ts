import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

/**
 * 自定义 API，暴露给渲染进程
 */
const api = {
  startOAuth: () => ipcRenderer.invoke('start-oauth'),
  createOAuthSession: () => ipcRenderer.invoke('create-oauth-session'),
  waitOAuthToken: (sessionId: string) => ipcRenderer.invoke('wait-oauth-token', sessionId),
  cancelOAuthSession: () => ipcRenderer.invoke('cancel-oauth-session'),
  refreshOAuthToken: (refreshToken: string) =>
    ipcRenderer.invoke('refresh-oauth-token', refreshToken),
  setOAuthConfig: (config: { clientId: string; clientSecret: string; redirectUri?: string }) =>
    ipcRenderer.invoke('set-oauth-config', config),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (partial: Record<string, unknown>) =>
    ipcRenderer.invoke('update-settings', partial),
  selectStoragePath: () => ipcRenderer.invoke('select-storage-path'),
  setStoragePath: (path: string, migrate?: boolean) =>
    ipcRenderer.invoke('set-storage-path', path, migrate),
  listChats: () => ipcRenderer.invoke('list-chats'),
  readChat: (sessionId: string) => ipcRenderer.invoke('read-chat', sessionId),
  writeChat: (sessionId: string, messages: unknown[]) =>
    ipcRenderer.invoke('write-chat', sessionId, messages),
  createChat: (name?: string) => ipcRenderer.invoke('create-chat', name),
  deleteChat: (sessionId: string) => ipcRenderer.invoke('delete-chat', sessionId),
  saveStorageImage: (base64Data: string, options?: Record<string, unknown>) =>
    ipcRenderer.invoke('save-storage-image', base64Data, options),
  getFileUrl: (relativePath: string) => ipcRenderer.invoke('get-file-url', relativePath),
  readImageBase64: (relativePath: string) => ipcRenderer.invoke('read-image-base64', relativePath),
  getImageStats: (relativePath: string) => ipcRenderer.invoke('get-image-stats', relativePath),
  listAuths: () => ipcRenderer.invoke('list-auths'),
  readAuth: (authId: string) => ipcRenderer.invoke('read-auth', authId),
  saveAuth: (record: Record<string, unknown>) => ipcRenderer.invoke('save-auth', record),
  deleteAuth: (authId: string) => ipcRenderer.invoke('delete-auth', authId),
  saveImage: (base64Data: string, defaultFileName?: string) =>
    ipcRenderer.invoke('save-image', base64Data, defaultFileName),
  exportImage: (relativePath: string, defaultFileName?: string) =>
    ipcRenderer.invoke('export-image', relativePath, defaultFileName),

  // Token Manager API
  getValidToken: (authId: string) => ipcRenderer.invoke('get-valid-token', authId),
  refreshToken: (authId: string, refreshToken?: string) =>
    ipcRenderer.invoke('refresh-token', authId, refreshToken),
  checkAllTokens: () => ipcRenderer.invoke('check-all-tokens'),
  startTokenCheck: () => ipcRenderer.invoke('start-token-check'),
  stopTokenCheck: () => ipcRenderer.invoke('stop-token-check'),

  // 监听 token 刷新事件
  onTokenRefreshed: (
    callback: (data: { authId: string; accessToken: string; expiresAt: number }) => void
  ) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      data: { authId: string; accessToken: string; expiresAt: number }
    ): void => {
      callback(data)
    }
    ipcRenderer.on('token-refreshed', listener)
    return () => ipcRenderer.removeListener('token-refreshed', listener)
  }
}

/**
 * 使用 contextBridge API 暴露 Electron API 给渲染进程
 * 仅在启用上下文隔离时使用，否则直接添加到 DOM 全局对象
 */
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
