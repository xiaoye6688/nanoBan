import { ipcMain, dialog, shell } from 'electron'
import { writeFile, copyFile } from 'fs/promises'
import { resolveStoragePath } from '../storage'

/**
 * 设置通用 IPC 处理程序
 */
export function setupCommonIPC(): void {
  // 打开外部链接
  ipcMain.handle('open-external', async (_, url: string) => {
    try {
      await shell.openExternal(url)
      return { success: true }
    } catch (error: unknown) {
      console.error('打开外部链接失败:', error)
      throw error
    }
  })

  // 保存 base64 图片到用户选择的位置
  ipcMain.handle('save-image', async (_, base64Data: string, defaultFileName?: string) => {
    try {
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

      const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '')
      const imageBuffer = Buffer.from(base64Image, 'base64')
      await writeFile(result.filePath, imageBuffer)

      return { success: true, filePath: result.filePath }
    } catch (error: unknown) {
      console.error('保存图片失败:', error)
      throw error
    }
  })

  // 导出存储目录中的图片到用户选择的位置
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

  // 用于测试 IPC 通信
  ipcMain.on('ping', () => console.log('pong'))
}
