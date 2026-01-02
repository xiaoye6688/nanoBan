import { session } from 'electron'

/**
 * 设置网络请求头
 * 为特定的 Google API 域名设置自定义 User-Agent，以模拟 Antigravity 客户端
 */
export function setupNetworkHeaders(): void {
  // 需要设置特殊 User-Agent 的 Google API 域名
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
      // 忽略 URL 解析失败的情况，保持原始请求头
    }
    callback({ requestHeaders: details.requestHeaders })
  })
}
