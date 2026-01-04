import axios from 'axios'
import { BrowserWindow } from 'electron'
import { ANTIGRAVITY_OAUTH_CONFIG } from './oauth'
import { readAuth, saveAuth, listAuths, getSettings } from './storage'

// Token 刷新配置
const TOKEN_REFRESH_CONFIG = {
  // 提前刷新的时间窗口（毫秒）：在过期前 10 分钟刷新
  refreshSkew: 10 * 60 * 1000,
  // 最大重试次数
  maxRetries: 3,
  // 定期检查间隔（毫秒）：每 5 分钟检查一次
  checkInterval: 5 * 60 * 1000,
  // 重试基础延迟（毫秒）
  baseRetryDelay: 1000
}

export interface RefreshedToken {
  accessToken: string
  expiresAt: number
  refreshToken?: string
}

/**
 * Token 管理器
 * 参考 CLIProxyAPI 的设计，提供自动刷新、重试机制
 */
class TokenManager {
  private checkTimer: NodeJS.Timeout | null = null
  private refreshPromises = new Map<string, Promise<RefreshedToken>>()
  private mainWindow: BrowserWindow | null = null

  /**
   * 设置主窗口引用（用于发送刷新事件）
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window
  }

  /**
   * 启动定期检查 token 过期状态
   */
  startPeriodicCheck(): void {
    if (this.checkTimer) {
      return
    }

    console.log('[TokenManager] 启动定期 token 检查')

    // 立即执行一次检查
    void this.checkAndRefreshActiveToken()

    // 设置定期检查
    this.checkTimer = setInterval(() => {
      void this.checkAndRefreshActiveToken()
    }, TOKEN_REFRESH_CONFIG.checkInterval)
  }

  /**
   * 停止定期检查
   */
  stopPeriodicCheck(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer)
      this.checkTimer = null
      console.log('[TokenManager] 停止定期 token 检查')
    }
  }

  /**
   * 检查并刷新当前激活的 token
   */
  async checkAndRefreshActiveToken(): Promise<void> {
    try {
      const settings = getSettings()
      const activeAuthId = settings.activeAuthId

      if (!activeAuthId) {
        return
      }

      const auth = await readAuth(activeAuthId)
      if (!auth || !auth.refreshToken) {
        return
      }

      // 检查是否需要刷新
      if (this.shouldRefresh(auth.expiresAt)) {
        console.log('[TokenManager] Token 即将过期，开始自动刷新')
        await this.refreshTokenWithRetry(activeAuthId, auth.refreshToken)
      }
    } catch (error) {
      console.error('[TokenManager] 检查 token 失败:', error)
    }
  }

  /**
   * 检查 token 是否需要刷新
   */
  shouldRefresh(expiresAt: number): boolean {
    const now = Date.now()
    const timeUntilExpiry = expiresAt - now
    return timeUntilExpiry <= TOKEN_REFRESH_CONFIG.refreshSkew
  }

  /**
   * 检查 token 是否已过期
   */
  isExpired(expiresAt: number): boolean {
    return Date.now() >= expiresAt
  }

  /**
   * 刷新 token（带重试机制）
   * 参考 CLIProxyAPI 的 RefreshTokensWithRetry 实现
   */
  async refreshTokenWithRetry(
    authId: string,
    refreshToken: string,
    maxRetries: number = TOKEN_REFRESH_CONFIG.maxRetries
  ): Promise<RefreshedToken> {
    const existingPromise = this.refreshPromises.get(authId)
    if (existingPromise) {
      return existingPromise
    }

    const refreshPromise = this.refreshTokenWithRetryInternal(
      authId,
      refreshToken,
      maxRetries
    ).finally(() => {
      this.refreshPromises.delete(authId)
    })
    this.refreshPromises.set(authId, refreshPromise)
    return refreshPromise
  }

  /**
   * 基于 authId 刷新 token（从存储读取 refresh token）
   */
  async refreshTokenWithRetryForAuth(
    authId: string,
    maxRetries: number = TOKEN_REFRESH_CONFIG.maxRetries
  ): Promise<RefreshedToken> {
    const auth = await readAuth(authId)
    if (!auth || !auth.refreshToken) {
      throw new Error('没有可用的 Refresh Token')
    }

    return this.refreshTokenWithRetry(authId, auth.refreshToken, maxRetries)
  }

  /**
   * 刷新 Access Token
   */
  private async refreshToken(refreshToken: string): Promise<RefreshedToken> {
    const response = await axios.post(
      ANTIGRAVITY_OAUTH_CONFIG.tokenUrl,
      new URLSearchParams({
        refresh_token: refreshToken,
        client_id: ANTIGRAVITY_OAUTH_CONFIG.clientId,
        client_secret: ANTIGRAVITY_OAUTH_CONFIG.clientSecret,
        grant_type: 'refresh_token'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 30000
      }
    )

    const data = response.data
    return {
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      refreshToken: data.refresh_token
    }
  }

  /**
   * 通知渲染进程 token 已刷新
   */
  private notifyTokenRefreshed(authId: string, token: RefreshedToken): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('token-refreshed', {
        authId,
        accessToken: token.accessToken,
        expiresAt: token.expiresAt
      })
    }
  }

  /**
   * 获取有效的 token（自动刷新如果需要）
   */
  async getValidToken(authId: string): Promise<RefreshedToken | null> {
    const auth = await readAuth(authId)
    if (!auth) {
      return null
    }

    // 如果 token 已过期或即将过期，尝试刷新
    if (this.shouldRefresh(auth.expiresAt)) {
      if (!auth.refreshToken) {
        console.warn('[TokenManager] Token 已过期且没有 refresh token')
        return null
      }

      try {
        return await this.refreshTokenWithRetry(authId, auth.refreshToken)
      } catch (error) {
        console.error('[TokenManager] 自动刷新失败:', error)
        // 如果已过期，返回 null；否则返回当前 token
        if (this.isExpired(auth.expiresAt)) {
          return null
        }
      }
    }

    return {
      accessToken: auth.accessToken,
      expiresAt: auth.expiresAt,
      refreshToken: auth.refreshToken
    }
  }

  /**
   * 检查所有授权的 token 状态
   */
  async checkAllTokens(): Promise<
    Array<{
      id: string
      label: string
      status: 'valid' | 'expiring' | 'expired' | 'no-refresh-token'
      expiresAt: number
    }>
  > {
    const auths = await listAuths()
    const results: Array<{
      id: string
      label: string
      status: 'valid' | 'expiring' | 'expired' | 'no-refresh-token'
      expiresAt: number
    }> = []

    for (const auth of auths) {
      const fullAuth = await readAuth(auth.id)
      let status: 'valid' | 'expiring' | 'expired' | 'no-refresh-token'

      if (this.isExpired(auth.expiresAt)) {
        status = fullAuth?.refreshToken ? 'expired' : 'no-refresh-token'
      } else if (this.shouldRefresh(auth.expiresAt)) {
        status = 'expiring'
      } else {
        status = 'valid'
      }

      results.push({
        id: auth.id,
        label: auth.label,
        status,
        expiresAt: auth.expiresAt
      })
    }

    return results
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private async refreshTokenWithRetryInternal(
    authId: string,
    refreshToken: string,
    maxRetries: number
  ): Promise<RefreshedToken> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (attempt > 0) {
        // 指数退避延迟
        const delay = TOKEN_REFRESH_CONFIG.baseRetryDelay * Math.pow(2, attempt - 1)
        console.log(`[TokenManager] 等待 ${delay}ms 后重试...`)
        await this.sleep(delay)
      }

      try {
        const newToken = await this.refreshToken(refreshToken)

        // 更新存储
        const auth = await readAuth(authId)
        if (auth) {
          await saveAuth({
            id: authId,
            type: auth.type,
            label: auth.label,
            email: auth.email,
            projectId: auth.projectId,
            accessToken: newToken.accessToken,
            refreshToken: newToken.refreshToken || auth.refreshToken,
            expiresAt: newToken.expiresAt,
            tokenType: auth.tokenType
          })
          console.log('[TokenManager] Token 已刷新并保存')
        }

        // 通知渲染进程
        this.notifyTokenRefreshed(authId, newToken)

        return newToken
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.warn(`[TokenManager] Token 刷新尝试 ${attempt + 1} 失败:`, lastError.message)
      }
    }

    throw new Error(`Token 刷新失败（已重试 ${maxRetries} 次）: ${lastError?.message}`)
  }
}

// 导出单例
export const tokenManager = new TokenManager()
