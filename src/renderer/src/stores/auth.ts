import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { geminiAPI } from '../api/gemini'
import type { OAuthToken } from '../types/gemini'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const apiKey = ref<string>('')
  const oauthToken = ref<OAuthToken | null>(null)
  const isAuthenticated = ref<boolean>(false)

  // 计算属性
  const hasApiKey = computed(() => apiKey.value !== '')
  const hasValidToken = computed(() => {
    if (!oauthToken.value) return false
    return Date.now() < oauthToken.value.expiresAt
  })

  // 方法

  /**
   * 设置 API Key
   * 注意：当前版本仅支持 Antigravity OAuth 认证，API Key 功能已禁用
   */
  function setApiKey(key: string): void {
    apiKey.value = key
    isAuthenticated.value = true
    // 注意：新的 API 客户端只支持 Antigravity OAuth，不支持 API Key
    console.warn('当前版本仅支持 Antigravity OAuth 认证，请使用 OAuth 登录')
    // 保存到本地存储
    localStorage.setItem('gemini_api_key', key)
  }

  /**
   * 清除 API Key
   */
  function clearApiKey(): void {
    apiKey.value = ''
    isAuthenticated.value = false
    localStorage.removeItem('gemini_api_key')
  }

  /**
   * 设置 OAuth Token
   */
  function setOAuthToken(token: OAuthToken): void {
    oauthToken.value = token
    isAuthenticated.value = true
    // 保存到本地存储
    localStorage.setItem('oauth_token', JSON.stringify(token))

    // 使用 Antigravity OAuth 认证初始化 API
    if (token.accessToken) {
      geminiAPI.setAntigravityAuth(token.accessToken, token.projectId)
    }
  }

  /**
   * 清除 OAuth Token
   */
  function clearOAuthToken(): void {
    oauthToken.value = null
    localStorage.removeItem('oauth_token')
  }

  /**
   * 从本地存储恢复认证信息
   */
  function loadFromStorage(): void {
    // 尝试加载 API Key
    const savedApiKey = localStorage.getItem('gemini_api_key')
    if (savedApiKey) {
      setApiKey(savedApiKey)
    }

    // 尝试加载 OAuth Token
    const savedToken = localStorage.getItem('oauth_token')
    if (savedToken) {
      try {
        const token = JSON.parse(savedToken) as OAuthToken
        // 检查 token 是否过期
        if (Date.now() < token.expiresAt) {
          setOAuthToken(token)
        } else {
          clearOAuthToken()
        }
      } catch (error) {
        console.error('解析 OAuth Token 失败:', error)
        clearOAuthToken()
      }
    }
  }

  /**
   * 启动 OAuth 2.0 授权流程
   */
  async function startOAuthFlow(): Promise<void> {
    // 这个功能需要通过 Electron IPC 与主进程通信
    // 主进程会打开浏览器窗口进行 OAuth 授权
    if (window.api) {
      try {
        const token = await window.api.startOAuth()
        if (token) {
          setOAuthToken(token)
        }
      } catch (error) {
        console.error('OAuth 授权失败:', error)
        throw error
      }
    } else {
      throw new Error('Electron API 不可用')
    }
  }

  /**
   * 刷新 OAuth Token
   */
  async function refreshOAuthToken(): Promise<void> {
    if (!oauthToken.value?.refreshToken) {
      throw new Error('没有可用的 Refresh Token')
    }

    if (window.api) {
      try {
        const newToken = await window.api.refreshOAuthToken(oauthToken.value.refreshToken)
        if (newToken) {
          setOAuthToken(newToken)
        }
      } catch (error) {
        console.error('刷新 Token 失败:', error)
        throw error
      }
    }
  }

  /**
   * 登出
   */
  function logout(): void {
    clearApiKey()
    clearOAuthToken()
    isAuthenticated.value = false
  }

  return {
    // 状态
    apiKey,
    oauthToken,
    isAuthenticated,
    // 计算属性
    hasApiKey,
    hasValidToken,
    // 方法
    setApiKey,
    clearApiKey,
    setOAuthToken,
    clearOAuthToken,
    loadFromStorage,
    startOAuthFlow,
    refreshOAuthToken,
    logout
  }
})
