import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { ensureStorageDirs } from './storage'
import { setupIpc } from './ipc'
import { createWindow, getMainWindow } from './windows/main'
import { setupNetworkHeaders } from './network'
import { tokenManager } from './tokenManager'

// 当 Electron 完成初始化并准备创建浏览器窗口时调用
app.whenReady().then(() => {
  // 设置应用程序用户模型 ID（用于 Windows）
  electronApp.setAppUserModelId('com.electron')

  // 开发环境下通过 F12 打开/关闭开发者工具，生产环境忽略 Cmd/Ctrl + R
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 设置网络请求头（用于 Antigravity API）
  setupNetworkHeaders()

  // 确保存储目录存在
  ensureStorageDirs().catch((error) => {
    console.error('初始化存储目录失败:', error)
  })

  // 设置 IPC 处理程序
  setupIpc()

  // 创建主窗口
  createWindow()

  // 设置 TokenManager 的主窗口引用并启动定期检查
  const mainWindow = getMainWindow()
  if (mainWindow) {
    tokenManager.setMainWindow(mainWindow)
  }
  tokenManager.startPeriodicCheck()

  // macOS 下点击 dock 图标时重新创建窗口
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 所有窗口关闭时退出应用（macOS 除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    tokenManager.stopPeriodicCheck()
    app.quit()
  }
})
