import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  startOAuth: () => ipcRenderer.invoke('start-oauth'),
  refreshOAuthToken: (refreshToken: string) =>
    ipcRenderer.invoke('refresh-oauth-token', refreshToken),
  setOAuthConfig: (config: { clientId: string; clientSecret: string; redirectUri?: string }) =>
    ipcRenderer.invoke('set-oauth-config', config),
  saveImage: (base64Data: string, defaultFileName?: string) =>
    ipcRenderer.invoke('save-image', base64Data, defaultFileName)
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
