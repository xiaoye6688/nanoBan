import { setupOAuthIPC } from './oauth'
import { setupStorageIPC } from './storage'
import { setupCommonIPC } from './common'

/**
 * 初始化所有 IPC 处理程序
 */
export function setupIpc(): void {
  setupOAuthIPC()
  setupStorageIPC()
  setupCommonIPC()
}
