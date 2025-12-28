import { shell } from 'electron'
import axios from 'axios'
import * as http from 'node:http'

// Antigravity OAuth 2.0 配置（来自 CLIProxyAPI）
const ANTIGRAVITY_OAUTH_CONFIG = {
  clientId: '1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com',
  clientSecret: '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',
  callbackPort: 51121,
  redirectUri: 'http://localhost:51121/oauth-callback',
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  userInfoUrl: 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json',
  projectIdUrl: 'https://cloudcode-pa.googleapis.com/v1internal:loadCodeAssist',
  scopes: [
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/cclog',
    'https://www.googleapis.com/auth/experimentsandconfigs'
  ]
}

export interface OAuthToken {
  accessToken: string
  refreshToken?: string
  expiresAt: number
  tokenType: string
  email?: string
  projectId?: string
}

export interface OAuthFlowResult {
  authUrl: string
  token?: OAuthToken
}

/**
 * 生成授权 URL（不自动打开浏览器）
 */
export function generateAuthUrl(): string {
  const state = generateRandomState()
  return buildAuthUrl(state)
}

/**
 * 启动 Antigravity OAuth 2.0 授权流程
 */
export async function startOAuthFlow(openBrowser = true): Promise<OAuthToken> {
  const state = generateRandomState()
  const authUrl = buildAuthUrl(state)

  // 启动本地回调服务器并获取 Promise
  const serverPromise = startCallbackServer(state)
  const { cleanup } = await serverPromise

  // 打印授权 URL
  console.log('\n==============================================')
  console.log('请在浏览器中打开以下链接进行授权：')
  console.log(authUrl)
  console.log('==============================================\n')
  console.log(
    `等待授权回调到 http://localhost:${ANTIGRAVITY_OAUTH_CONFIG.callbackPort}/oauth-callback ...`
  )

  // 可选：自动打开浏览器
  if (openBrowser) {
    try {
      await shell.openExternal(authUrl)
      console.log('已在默认浏览器中打开授权页面')
    } catch {
      console.log('无法自动打开浏览器，请手动复制上面的链接')
    }
  }

  // 创建超时 Promise
  const timeoutPromise = new Promise<OAuthToken>((_, reject) => {
    setTimeout(
      () => {
        cleanup()
        reject(new Error('授权超时（5分钟）'))
      },
      5 * 60 * 1000
    )
  })

  // 竞争：要么获取到 token，要么超时
  try {
    return await Promise.race([serverPromise.then((result) => result.token), timeoutPromise])
  } finally {
    cleanup()
  }
}

/**
 * 启动本地回调服务器
 */
async function startCallbackServer(
  expectedState: string
): Promise<{ token: OAuthToken; cleanup: () => void }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      if (req.url?.startsWith('/oauth-callback')) {
        try {
          const url = new URL(req.url, `http://localhost:${ANTIGRAVITY_OAUTH_CONFIG.callbackPort}`)
          const code = url.searchParams.get('code')
          const state = url.searchParams.get('state')
          const error = url.searchParams.get('error')

          // 返回响应给浏览器
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })

          if (error) {
            res.end(`
            <html>
              <head><title>授权失败</title></head>
              <body style="font-family: Arial; padding: 50px; text-align: center;">
                <h1 style="color: #f56c6c;">❌ 授权失败</h1>
                <p>错误信息: ${error}</p>
                <p>您可以关闭此窗口</p>
              </body>
            </html>
          `)
            reject(new Error(`OAuth 错误: ${error}`))
            return
          }

          if (state !== expectedState) {
            res.end(`
            <html>
              <head><title>授权失败</title></head>
              <body style="font-family: Arial; padding: 50px; text-align: center;">
                <h1 style="color: #f56c6c;">❌ State 验证失败</h1>
                <p>您可以关闭此窗口</p>
              </body>
            </html>
          `)
            reject(new Error('State 验证失败'))
            return
          }

          if (!code) {
            res.end(`
            <html>
              <head><title>授权失败</title></head>
              <body style="font-family: Arial; padding: 50px; text-align: center;">
                <h1 style="color: #f56c6c;">❌ 未获取到授权码</h1>
                <p>您可以关闭此窗口</p>
              </body>
            </html>
          `)
            reject(new Error('未获取到授权码'))
            return
          }

          // 成功响应
          res.end(`
          <html>
            <head><title>授权成功</title></head>
            <body style="font-family: Arial; padding: 50px; text-align: center;">
              <h1 style="color: #67c23a;">✅ 授权成功！</h1>
              <p>正在获取访问令牌...</p>
              <p>您可以关闭此窗口并返回应用</p>
              <script>setTimeout(() => window.close(), 2000);</script>
            </body>
          </html>
        `)

          // 交换令牌
          console.log('收到授权码，正在交换访问令牌...')
          const token = await exchangeCodeForToken(code)
          console.log('授权成功！')
          resolve({
            token,
            cleanup: () => {
              server.close()
              console.log('回调服务器已关闭')
            }
          })
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : '未知错误'
          console.error('处理回调失败:', err)
          res.end(`
          <html>
            <head><title>授权失败</title></head>
            <body style="font-family: Arial; padding: 50px; text-align: center;">
              <h1 style="color: #f56c6c;">❌ 授权失败</h1>
              <p>${errorMessage}</p>
              <p>您可以关闭此窗口</p>
            </body>
          </html>
        `)
          reject(err)
        }
      } else {
        res.writeHead(404)
        res.end('Not Found')
      }
    })

    server.listen(ANTIGRAVITY_OAUTH_CONFIG.callbackPort, () => {
      console.log(`回调服务器已启动在端口 ${ANTIGRAVITY_OAUTH_CONFIG.callbackPort}`)
    })
  })
}

/**
 * 生成随机 state
 */
function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

/**
 * 构建授权 URL
 */
function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: ANTIGRAVITY_OAUTH_CONFIG.clientId,
    redirect_uri: ANTIGRAVITY_OAUTH_CONFIG.redirectUri,
    response_type: 'code',
    scope: ANTIGRAVITY_OAUTH_CONFIG.scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state
  })

  return `${ANTIGRAVITY_OAUTH_CONFIG.authUrl}?${params.toString()}`
}

/**
 * 使用授权码交换访问令牌
 */
async function exchangeCodeForToken(code: string): Promise<OAuthToken> {
  try {
    const response = await axios.post(
      ANTIGRAVITY_OAUTH_CONFIG.tokenUrl,
      new URLSearchParams({
        code,
        client_id: ANTIGRAVITY_OAUTH_CONFIG.clientId,
        client_secret: ANTIGRAVITY_OAUTH_CONFIG.clientSecret,
        redirect_uri: ANTIGRAVITY_OAUTH_CONFIG.redirectUri,
        grant_type: 'authorization_code'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )

    const data = response.data
    const expiresAt = Date.now() + data.expires_in * 1000

    // 获取用户信息
    let email: string | undefined
    let projectId: string | undefined

    if (data.access_token) {
      try {
        email = await fetchUserEmail(data.access_token)
      } catch (error) {
        console.error('获取用户信息失败:', error)
      }

      try {
        projectId = await fetchProjectId(data.access_token)
      } catch (error) {
        console.error('获取项目 ID 失败:', error)
      }
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt,
      tokenType: data.token_type,
      email,
      projectId
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : axios.isAxiosError(error)
          ? error.response?.data
          : '未知错误'
    console.error('交换令牌失败:', errorMessage)
    throw new Error('交换令牌失败')
  }
}

/**
 * 获取用户邮箱
 */
async function fetchUserEmail(accessToken: string): Promise<string | undefined> {
  try {
    const response = await axios.get(ANTIGRAVITY_OAUTH_CONFIG.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
    return response.data.email
  } catch (error) {
    console.error('获取用户邮箱失败:', error)
    return undefined
  }
}

/**
 * 获取 GCP 项目 ID
 */
async function fetchProjectId(accessToken: string): Promise<string | undefined> {
  try {
    const response = await axios.post(
      ANTIGRAVITY_OAUTH_CONFIG.projectIdUrl,
      {
        metadata: {
          ideType: 'IDE_UNSPECIFIED',
          platform: 'PLATFORM_UNSPECIFIED',
          pluginType: 'GEMINI'
        }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'google-api-nodejs-client/9.15.1',
          'X-Goog-Api-Client': 'google-cloud-sdk vscode_cloudshelleditor/0.1',
          'Client-Metadata': JSON.stringify({
            ideType: 'IDE_UNSPECIFIED',
            platform: 'PLATFORM_UNSPECIFIED',
            pluginType: 'GEMINI'
          })
        }
      }
    )

    const project = response.data?.cloudaicompanionProject
    if (typeof project === 'string' && project.trim() !== '') {
      return project.trim()
    }
    if (
      project &&
      typeof project === 'object' &&
      typeof project.id === 'string' &&
      project.id.trim() !== ''
    ) {
      return project.id.trim()
    }
    return undefined
  } catch (error) {
    console.error('获取项目 ID 失败:', error)
    return undefined
  }
}

/**
 * 刷新访问令牌
 */
export async function refreshAccessToken(refreshToken: string): Promise<OAuthToken> {
  try {
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
        }
      }
    )

    const data = response.data
    return {
      accessToken: data.access_token,
      refreshToken: refreshToken,
      expiresAt: Date.now() + data.expires_in * 1000,
      tokenType: data.token_type
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : axios.isAxiosError(error)
          ? error.response?.data
          : '未知错误'
    console.error('刷新令牌失败:', errorMessage)
    throw new Error('刷新令牌失败')
  }
}

/**
 * 设置 OAuth 配置（保留此函数以保持向后兼容）
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
export function setOAuthConfig(
  _clientId: string,
  _clientSecret: string,
  _redirectUri?: string
): void {
  // Antigravity 使用固定配置，此函数保留但不执行任何操作
  console.log('Antigravity 使用固定的 OAuth 配置')
}
/* eslint-enable @typescript-eslint/no-unused-vars */
