import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { geminiAPI } from '../api/gemini'
import type { OAuthToken } from '../types/gemini'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const oauthToken = ref<OAuthToken | null>(null)
  const auths = ref<
    Array<{
      id: string
      label: string
      email?: string
      projectId?: string
      expiresAt: number
      tokenType: string
      createdAt: number
      updatedAt: number
    }>
  >([])
  const activeAuthId = ref<string | null>(null)
  const pendingAuthUrl = ref<string>('')
  const pendingSessionId = ref<string | null>(null)
  const isAuthorizing = ref<boolean>(false)

  // 计算属性
  const hasValidToken = computed(() => {
    if (!oauthToken.value) return false
    return Date.now() < oauthToken.value.expiresAt
  })
  const isAuthenticated = computed(() => hasValidToken.value)
  const activeAuth = computed(() => auths.value.find((auth) => auth.id === activeAuthId.value))

  // 方法

  /**
   * 刷新授权列表
   */
  async function loadAuths(): Promise<void> {
    auths.value = await window.api.listAuths()
  }

  /**
   * 设置 OAuth Token
   */
  async function setOAuthToken(token: OAuthToken, authId?: string): Promise<void> {
    oauthToken.value = token
    if (authId) {
      activeAuthId.value = authId
    }

    // 使用 Antigravity OAuth 认证初始化 API
    if (token.accessToken && Date.now() < token.expiresAt) {
      geminiAPI.setAntigravityAuth(token.accessToken, token.projectId)
    }
  }

  /**
   * 清除 OAuth Token
   */
  function clearOAuthToken(): void {
    oauthToken.value = null
  }

  /**
   * 从本地存储恢复认证信息
   */
  async function loadFromStorage(): Promise<void> {
    await loadAuths()
    const settings = await window.api.getSettings()
    if (settings.activeAuthId) {
      try {
        await selectAuth(settings.activeAuthId)
      } catch (error) {
        console.error('加载默认授权失败:', error)
      }
    } else if (auths.value.length > 0) {
      await selectAuth(auths.value[0].id)
    }
  }

  /**
   * 创建 OAuth 2.0 授权链接
   */
  async function createOAuthLink(): Promise<string> {
    const session = await window.api.createOAuthSession()
    pendingSessionId.value = session.sessionId
    pendingAuthUrl.value = session.authUrl
    void autoCompleteOAuth(session.sessionId)
    return session.authUrl
  }

  /**
   * 等待 OAuth 授权完成并保存（自动监听回调）
   */
  async function autoCompleteOAuth(sessionId: string): Promise<void> {
    isAuthorizing.value = true
    try {
      const token = await window.api.waitOAuthToken(sessionId)
      if (pendingSessionId.value !== sessionId) return
      await saveOAuthToken(token)
    } catch (error) {
      if (pendingSessionId.value === sessionId) {
        console.error('OAuth 授权失败:', error)
      }
    } finally {
      if (pendingSessionId.value === sessionId) {
        pendingSessionId.value = null
        pendingAuthUrl.value = ''
        isAuthorizing.value = false
      }
    }
  }

  /**
   * 刷新 OAuth Token
   */
  async function refreshOAuthToken(): Promise<void> {
    if (!oauthToken.value?.refreshToken) {
      throw new Error('没有可用的 Refresh Token')
    }

    try {
      const newToken = await window.api.refreshOAuthToken(oauthToken.value.refreshToken)
      if (newToken) {
        await saveOAuthToken(
          { ...newToken, email: oauthToken.value.email, projectId: oauthToken.value.projectId },
          activeAuthId.value || undefined
        )
      }
    } catch (error) {
      console.error('刷新 Token 失败:', error)
      throw error
    }
  }

  /**
   * 登出
   */
  function logout(): void {
    clearOAuthToken()
    activeAuthId.value = null
    void window.api.updateSettings({ activeAuthId: '' })
  }

  async function saveOAuthToken(token: OAuthToken, authId?: string): Promise<void> {
    const label = token.email || token.projectId || 'Antigravity OAuth'
    const saved = await window.api.saveAuth({
      id: authId,
      type: 'antigravity',
      label,
      email: token.email,
      projectId: token.projectId,
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      expiresAt: token.expiresAt,
      tokenType: token.tokenType
    })
    await loadAuths()
    await selectAuth(saved.id)
  }

  async function selectAuth(authId: string): Promise<void> {
    const record = await window.api.readAuth(authId)
    if (!record) {
      throw new Error('授权信息不存在')
    }
    activeAuthId.value = authId
    await window.api.updateSettings({ activeAuthId: authId })
    await setOAuthToken({
      accessToken: record.accessToken,
      refreshToken: record.refreshToken,
      expiresAt: record.expiresAt,
      tokenType: record.tokenType,
      email: record.email,
      projectId: record.projectId
    })
  }

  async function removeAuth(authId: string): Promise<void> {
    await window.api.deleteAuth(authId)
    auths.value = auths.value.filter((auth) => auth.id !== authId)
    if (activeAuthId.value === authId) {
      activeAuthId.value = null
      clearOAuthToken()
      void window.api.updateSettings({ activeAuthId: '' })
    }
  }

  return {
    // 状态
    oauthToken,
    isAuthenticated,
    auths,
    activeAuthId,
    activeAuth,
    pendingAuthUrl,
    pendingSessionId,
    isAuthorizing,
    // 计算属性
    hasValidToken,
    // 方法
    setOAuthToken,
    clearOAuthToken,
    loadAuths,
    loadFromStorage,
    createOAuthLink,
    refreshOAuthToken,
    logout,
    saveOAuthToken,
    selectAuth,
    removeAuth
  }
})
