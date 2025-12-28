import { app, shell, BrowserWindow, ipcMain, session, dialog } from 'electron'
import { join } from 'path'
import { writeFile } from 'fs/promises'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { startOAuthFlow, refreshAccessToken, setOAuthConfig } from './oauth'

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

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // OAuth IPC 处理程序
  ipcMain.handle('start-oauth', async () => {
    try {
      const token = await startOAuthFlow()
      return token
    } catch (error: unknown) {
      console.error('OAuth 授权失败:', error)
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
