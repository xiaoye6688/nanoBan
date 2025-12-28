import { app, shell, BrowserWindow, ipcMain, session, dialog } from 'electron'
import { join } from 'path'
import { writeFile, copyFile } from 'fs/promises'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import {
  createOAuthSession,
  waitForOAuthToken,
  startOAuthFlow,
  refreshAccessToken,
  setOAuthConfig
} from './oauth'
import {
  ensureStorageDirs,
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
  getFileUrl,
  resolveStoragePath,
  readImageAsBase64,
  listAuths,
  readAuth,
  saveAuth,
  deleteAuth
} from './storage'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const antigravityHosts = new Set([
    'daily-cloudcode-pa.googleapis.com',
    'daily-cloudcode-pa.sandbox.googleapis.com',
    'cloudcode-pa.googleapis.com'
  ])
  const antigravityUserAgent = 'antigravity/1.104.0 darwin/arm64'
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    try {
      const hostname = new URL(details.url).hostname
      if (antigravityHosts.has(hostname)) {
        details.requestHeaders['User-Agent'] = antigravityUserAgent
      }
    } catch {
      // Ignore URL parsing failures and keep original headers.
    }
    callback({ requestHeaders: details.requestHeaders })
  })

  ensureStorageDirs().catch((error) => {
    console.error('初始化存储目录失败:', error)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // OAuth IPC 处理程序
  ipcMain.handle('start-oauth', async () => {
    try {
      const token = await startOAuthFlow(false)
      return token
    } catch (error: unknown) {
      console.error('OAuth 授权失败:', error)
      throw error
    }
  })

  ipcMain.handle('create-oauth-session', () => {
    try {
      return createOAuthSession()
    } catch (error: unknown) {
      console.error('创建 OAuth 会话失败:', error)
      throw error
    }
  })

  ipcMain.handle('wait-oauth-token', async (_, sessionId: string) => {
    try {
      return await waitForOAuthToken(sessionId)
    } catch (error: unknown) {
      console.error('等待 OAuth Token 失败:', error)
      throw error
    }
  })

  ipcMain.handle('refresh-oauth-token', async (_, refreshToken: string) => {
    try {
      const token = await refreshAccessToken(refreshToken)
      return token
    } catch (error: unknown) {
      console.error('刷新令牌失败:', error)
      throw error
    }
  })

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

  ipcMain.handle('open-external', async (_, url: string) => {
    try {
      await shell.openExternal(url)
      return { success: true }
    } catch (error: unknown) {
      console.error('打开外部链接失败:', error)
      throw error
    }
  })

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

  // 保存图片 IPC 处理程序
  ipcMain.handle('save-image', async (_, base64Data: string, defaultFileName?: string) => {
    try {
      // 显示保存对话框
      const result = await dialog.showSaveDialog({
        title: '保存图片',
        defaultPath: defaultFileName || `image_${Date.now()}.png`,
        filters: [
          { name: '图片', extensions: ['png', 'jpg', 'jpeg', 'webp'] },
          { name: '所有文件', extensions: ['*'] }
        ]
      })

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true }
      }

      // 从 base64 数据中提取实际的图片数据
      const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '')
      const imageBuffer = Buffer.from(base64Image, 'base64')

      // 保存文件
      await writeFile(result.filePath, imageBuffer)

      return { success: true, filePath: result.filePath }
    } catch (error: unknown) {
      console.error('保存图片失败:', error)
      throw error
    }
  })

  ipcMain.handle('export-image', async (_, relativePath: string, defaultFileName?: string) => {
    try {
      const result = await dialog.showSaveDialog({
        title: '导出图片',
        defaultPath: defaultFileName || `image_${Date.now()}.png`,
        filters: [
          { name: '图片', extensions: ['png', 'jpg', 'jpeg', 'webp'] },
          { name: '所有文件', extensions: ['*'] }
        ]
      })

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true }
      }

      await copyFile(resolveStoragePath(relativePath), result.filePath)
      return { success: true, filePath: result.filePath }
    } catch (error: unknown) {
      console.error('导出图片失败:', error)
      throw error
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
