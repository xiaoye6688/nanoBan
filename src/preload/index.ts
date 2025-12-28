import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  startOAuth: () => ipcRenderer.invoke('start-oauth'),
  createOAuthSession: () => ipcRenderer.invoke('create-oauth-session'),
  waitOAuthToken: (sessionId: string) => ipcRenderer.invoke('wait-oauth-token', sessionId),
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
  listAuths: () => ipcRenderer.invoke('list-auths'),
  readAuth: (authId: string) => ipcRenderer.invoke('read-auth', authId),
  saveAuth: (record: Record<string, unknown>) => ipcRenderer.invoke('save-auth', record),
  deleteAuth: (authId: string) => ipcRenderer.invoke('delete-auth', authId),
  saveImage: (base64Data: string, defaultFileName?: string) =>
    ipcRenderer.invoke('save-image', base64Data, defaultFileName),
  exportImage: (relativePath: string, defaultFileName?: string) =>
    ipcRenderer.invoke('export-image', relativePath, defaultFileName)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
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
