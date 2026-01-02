import { app, dialog } from 'electron'
import Store from 'electron-store'
import { promises as fs } from 'fs'
import { join, basename, extname, isAbsolute } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

// 应用存储目录结构
const APP_FOLDER_NAME = 'nanoBan'
const CHAT_DIR_NAME = 'chats'
const IMAGE_DIR_NAME = 'images'
const AUTH_DIR_NAME = 'auths'

export interface AppSettings {
  storagePath: string
  imageSize: string
  aspectRatio: string
  presets?: unknown[]
  activeAuthId?: string
  lastSessionId?: string
}

export interface StoredChatMessage {
  id: string
  role: 'user' | 'model'
  content: string
  images?: string[]
  timestamp: number
}

export interface ChatSessionInfo {
  id: string
  name: string
  updatedAt: number
  createdAt?: number
}

export interface AuthRecord {
  type: string
  label: string
  email?: string
  projectId?: string
  accessToken: string
  refreshToken?: string
  expiresAt: number
  tokenType: string
  createdAt: number
  updatedAt: number
}

export interface AuthSummary {
  id: string
  label: string
  email?: string
  projectId?: string
  expiresAt: number
  tokenType: string
  createdAt: number
  updatedAt: number
}

let settingsStore: Store<AppSettings> | null = null

/**
 * 获取 Store 构造函数（处理 ESM/CJS 模块兼容性）
 */
function getStoreConstructor(): typeof Store {
  const storeModule = Store as unknown as { default?: typeof Store }
  return storeModule.default ?? Store
}

/**
 * 获取或初始化设置存储实例
 */
function getSettingsStore(): Store<AppSettings> {
  if (!settingsStore) {
    const StoreConstructor = getStoreConstructor()
    settingsStore = new StoreConstructor<AppSettings>({
      name: 'settings',
      defaults: {
        storagePath: getDefaultStoragePath(),
        imageSize: '1K',
        aspectRatio: '1:1'
      }
    })
  }
  return settingsStore
}

/**
 * 获取默认存储路径
 */
function getDefaultStoragePath(): string {
  return join(app.getPath('documents'), APP_FOLDER_NAME)
}

/**
 * 获取应用设置
 */
export function getSettings(): AppSettings {
  const store = getSettingsStore()
  let storagePath = store.get('storagePath')
  if (!storagePath || storagePath.trim() === '') {
    storagePath = getDefaultStoragePath()
    store.set('storagePath', storagePath)
  }
  return {
    storagePath,
    imageSize: store.get('imageSize') || '1K',
    aspectRatio: store.get('aspectRatio') || '1:1',
    presets: store.get('presets'),
    activeAuthId: store.get('activeAuthId'),
    lastSessionId: store.get('lastSessionId')
  }
}

/**
 * 更新应用设置
 */
export function updateSettings(partial: Partial<AppSettings>): AppSettings {
  const store = getSettingsStore()
  Object.entries(partial).forEach(([key, value]) => {
    if (value !== undefined) {
      store.set(key as keyof AppSettings, value)
    }
  })
  return getSettings()
}

/**
 * 打开目录选择对话框
 */
export async function selectStoragePath(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    title: '选择存储目录',
    properties: ['openDirectory', 'createDirectory']
  })
  if (result.canceled || result.filePaths.length === 0) {
    return null
  }
  return result.filePaths[0]
}

/**
 * 设置存储路径（可选择是否迁移数据）
 */
export async function setStoragePath(
  newPath: string,
  options?: { migrate?: boolean }
): Promise<AppSettings> {
  const settings = getSettings()
  const previousPath = settings.storagePath
  if (previousPath === newPath) {
    await ensureStorageDirs(newPath)
    return settings
  }

  await ensureStorageDirs(newPath)

  if (options?.migrate) {
    await migrateStorage(previousPath, newPath)
  }

  return updateSettings({ storagePath: newPath })
}

/**
 * 获取存储路径配置
 */
export function getStoragePaths(basePath?: string): {
  basePath: string
  chatsDir: string
  imagesDir: string
  authsDir: string
} {
  const storagePath = basePath || getSettings().storagePath
  return {
    basePath: storagePath,
    chatsDir: join(storagePath, CHAT_DIR_NAME),
    imagesDir: join(storagePath, IMAGE_DIR_NAME),
    authsDir: join(storagePath, AUTH_DIR_NAME)
  }
}

/**
 * 确保存储目录存在
 */
export async function ensureStorageDirs(basePath?: string): Promise<void> {
  const { basePath: root, chatsDir, imagesDir, authsDir } = getStoragePaths(basePath)
  await fs.mkdir(root, { recursive: true })
  await fs.mkdir(chatsDir, { recursive: true })
  await fs.mkdir(imagesDir, { recursive: true })
  await fs.mkdir(authsDir, { recursive: true })
}

/**
 * 迁移存储数据到新路径
 */
async function migrateStorage(oldPath: string, newPath: string): Promise<void> {
  if (!oldPath || oldPath === newPath) return
  const oldDirs = getStoragePaths(oldPath)
  const newDirs = getStoragePaths(newPath)
  await ensureStorageDirs(newPath)

  await moveDirIfExists(oldDirs.chatsDir, newDirs.chatsDir)
  await moveDirIfExists(oldDirs.imagesDir, newDirs.imagesDir)
  await moveDirIfExists(oldDirs.authsDir, newDirs.authsDir)
  await cleanupOldStorage(oldPath)
}

/**
 * 移动目录（如果存在）
 */
async function moveDirIfExists(source: string, target: string): Promise<void> {
  try {
    const stat = await fs.stat(source)
    if (!stat.isDirectory()) return
  } catch {
    return
  }

  try {
    await fs.cp(source, target, { recursive: true, force: true })
    await fs.rm(source, { recursive: true, force: true })
  } catch (error) {
    console.error(`移动目录失败 ${source} -> ${target}:`, error)
    throw error
  }
}

/**
 * 清理旧的存储目录（如果为空）
 */
async function cleanupOldStorage(oldPath: string): Promise<void> {
  try {
    const files = await fs.readdir(oldPath)
    if (files.length === 0) {
      await fs.rmdir(oldPath)
      console.log(`已清理空的旧存储目录: ${oldPath}`)
    }
  } catch (error) {
    console.warn('清理旧存储目录时出错:', error)
  }
}

/**
 * 清理文件名中的非法字符
 */
function sanitizeFileName(name: string): string {
  // eslint-disable-next-line no-control-regex
  return name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '').trim()
}

/**
 * 确保文件名有 .json 扩展名
 */
function ensureJsonExtension(name: string): string {
  if (extname(name).toLowerCase() === '.json') {
    return name
  }
  return `${name}.json`
}

/**
 * 格式化默认会话名称（时间戳格式）
 */
function formatDefaultSessionName(): string {
  const now = new Date()
  const pad = (value: number): string => value.toString().padStart(2, '0')
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  const time = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
  return `${date}_${time}`
}

/**
 * 生成唯一的文件名（如果文件已存在则添加序号）
 */
async function getUniqueFileName(dir: string, baseName: string): Promise<string> {
  let candidate = ensureJsonExtension(baseName)
  let index = 1
  while (true) {
    try {
      await fs.access(join(dir, candidate))
      candidate = ensureJsonExtension(`${baseName}-${index}`)
      index += 1
    } catch {
      return candidate
    }
  }
}

/**
 * 移除消息中的运行时字段（只保留需要持久化的字段）
 */
function stripMessageRuntimeFields(message: StoredChatMessage): StoredChatMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    images: message.images,
    timestamp: message.timestamp
  }
}

/**
 * 列出所有聊天会话
 */
export async function listChatSessions(): Promise<ChatSessionInfo[]> {
  const { chatsDir } = getStoragePaths()
  await ensureStorageDirs()
  const entries = await fs.readdir(chatsDir, { withFileTypes: true })
  const sessions: ChatSessionInfo[] = []

  for (const entry of entries) {
    if (!entry.isFile()) continue
    if (extname(entry.name).toLowerCase() !== '.json') continue
    const filePath = join(chatsDir, entry.name)
    try {
      const stat = await fs.stat(filePath)
      sessions.push({
        id: entry.name,
        name: basename(entry.name, '.json'),
        updatedAt: stat.mtimeMs,
        createdAt: stat.birthtimeMs
      })
    } catch {
      // 跳过无法读取的文件
    }
  }

  sessions.sort((a, b) => b.updatedAt - a.updatedAt)
  return sessions
}

/**
 * 读取聊天会话数据
 */
export async function readChatSession(
  sessionId: string
): Promise<{ session: ChatSessionInfo; messages: StoredChatMessage[] }> {
  const { chatsDir } = getStoragePaths()
  await ensureStorageDirs()
  const fileName = ensureJsonExtension(sessionId)
  const filePath = join(chatsDir, fileName)
  const emptySession: ChatSessionInfo = {
    id: fileName,
    name: basename(fileName, '.json'),
    updatedAt: Date.now(),
    createdAt: Date.now()
  }

  try {
    const data = await fs.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(data)
    const messages = Array.isArray(parsed) ? parsed : parsed?.messages
    const session = {
      ...emptySession,
      name: parsed?.name || emptySession.name,
      createdAt: parsed?.createdAt || emptySession.createdAt,
      updatedAt: parsed?.updatedAt || emptySession.updatedAt
    }
    return {
      session,
      messages: Array.isArray(messages) ? messages.map(stripMessageRuntimeFields) : []
    }
  } catch {
    return { session: emptySession, messages: [] }
  }
}

/**
 * 写入聊天会话数据
 */
export async function writeChatSession(
  sessionId: string,
  messages: StoredChatMessage[]
): Promise<ChatSessionInfo> {
  const { chatsDir } = getStoragePaths()
  await ensureStorageDirs()
  const fileName = ensureJsonExtension(sessionId)
  const filePath = join(chatsDir, fileName)

  let createdAt = Date.now()
  try {
    const existing = await fs.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(existing)
    if (typeof parsed?.createdAt === 'number') {
      createdAt = parsed.createdAt
    }
  } catch {
    // 文件不存在或无法读取
  }

  const updatedAt = Date.now()
  const payload = {
    name: basename(fileName, '.json'),
    createdAt,
    updatedAt,
    messages: messages.map(stripMessageRuntimeFields)
  }
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf-8')
  return {
    id: fileName,
    name: payload.name,
    updatedAt,
    createdAt
  }
}

/**
 * 创建新的聊天会话
 */
export async function createChatSession(name?: string): Promise<ChatSessionInfo> {
  const { chatsDir } = getStoragePaths()
  await ensureStorageDirs()
  const baseName =
    sanitizeFileName(name || formatDefaultSessionName()) || formatDefaultSessionName()
  const fileName = await getUniqueFileName(chatsDir, baseName)
  const now = Date.now()
  const payload = {
    name: basename(fileName, '.json'),
    createdAt: now,
    updatedAt: now,
    messages: [] as StoredChatMessage[]
  }
  await fs.writeFile(join(chatsDir, fileName), JSON.stringify(payload, null, 2), 'utf-8')
  return {
    id: fileName,
    name: payload.name,
    updatedAt: now,
    createdAt: now
  }
}

/**
 * 删除聊天会话
 */
export async function deleteChatSession(sessionId: string): Promise<void> {
  const { chatsDir } = getStoragePaths()
  await ensureStorageDirs()
  const fileName = ensureJsonExtension(sessionId)
  await fs.rm(join(chatsDir, fileName), { force: true })
}

/**
 * 根据 MIME 类型获取图片扩展名
 */
function getImageExtensionFromMime(mime: string): string {
  const normalized = mime.toLowerCase()
  if (normalized.includes('jpeg')) return 'jpg'
  if (normalized.includes('png')) return 'png'
  if (normalized.includes('webp')) return 'webp'
  if (normalized.includes('gif')) return 'gif'
  return 'png'
}

/**
 * 根据扩展名获取图片 MIME 类型
 */
function getImageMimeFromExtension(extension: string): string {
  const normalized = extension.replace('.', '').toLowerCase()
  if (normalized === 'jpg' || normalized === 'jpeg') return 'image/jpeg'
  if (normalized === 'png') return 'image/png'
  if (normalized === 'webp') return 'image/webp'
  if (normalized === 'gif') return 'image/gif'
  return 'image/png'
}

/**
 * 解析 base64 图片数据
 */
function parseBase64Image(data: string): { mime: string; buffer: Buffer } {
  const match = data.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
  if (match) {
    return {
      mime: match[1],
      buffer: Buffer.from(match[2], 'base64')
    }
  }
  return { mime: 'image/png', buffer: Buffer.from(data, 'base64') }
}

/**
 * 保存 base64 图片到存储目录
 */
export async function saveImageToStorage(
  base64Data: string,
  options?: { fileName?: string; prefix?: string }
): Promise<{ relativePath: string; fileName: string }> {
  const { imagesDir } = getStoragePaths()
  await ensureStorageDirs()
  const parsed = parseBase64Image(base64Data)
  const extension = getImageExtensionFromMime(parsed.mime)
  const prefix = options?.prefix ? sanitizeFileName(options.prefix) : 'image'
  const baseName =
    options?.fileName && sanitizeFileName(options.fileName)
      ? sanitizeFileName(options.fileName)
      : `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const fileName = baseName.endsWith(`.${extension}`) ? baseName : `${baseName}.${extension}`
  const filePath = join(imagesDir, fileName)
  await fs.writeFile(filePath, parsed.buffer)
  return {
    relativePath: join(IMAGE_DIR_NAME, fileName),
    fileName
  }
}

/**
 * 读取图片并转换为 base64
 */
export async function readImageAsBase64(relativePath: string): Promise<string> {
  const absolutePath = resolveStoragePath(relativePath)
  const extension = extname(absolutePath)
  const mimeType = getImageMimeFromExtension(extension)
  const buffer = await fs.readFile(absolutePath)
  return `data:${mimeType};base64,${buffer.toString('base64')}`
}

/**
 * 解析相对路径为绝对路径
 */
export function resolveStoragePath(relativePath: string): string {
  if (!relativePath) return relativePath
  if (relativePath.startsWith('file://')) {
    return fileURLToPath(relativePath)
  }
  if (isAbsolute(relativePath)) {
    return relativePath
  }
  const { basePath } = getStoragePaths()
  return join(basePath, relativePath)
}

/**
 * 将文件路径转换为 file:// URL
 */
export function getFileUrl(relativePath: string): string {
  if (relativePath.startsWith('file://')) {
    return relativePath
  }
  const absolutePath = resolveStoragePath(relativePath)
  return pathToFileURL(absolutePath).toString()
}

/**
 * 生成授权文件名
 */
function buildAuthFileName(label?: string): string {
  const safeLabel = label ? sanitizeFileName(label) : 'auth'
  return `${safeLabel}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.json`
}

/**
 * 列出所有授权记录
 */
export async function listAuths(): Promise<AuthSummary[]> {
  const { authsDir } = getStoragePaths()
  await ensureStorageDirs()
  const entries = await fs.readdir(authsDir, { withFileTypes: true })
  const records: AuthSummary[] = []

  for (const entry of entries) {
    if (!entry.isFile()) continue
    if (extname(entry.name).toLowerCase() !== '.json') continue
    const filePath = join(authsDir, entry.name)
    try {
      const raw = await fs.readFile(filePath, 'utf-8')
      const parsed = JSON.parse(raw) as AuthRecord
      if (!parsed?.accessToken) continue
      records.push({
        id: entry.name,
        label: parsed.label || parsed.email || basename(entry.name, '.json'),
        email: parsed.email,
        projectId: parsed.projectId,
        expiresAt: parsed.expiresAt,
        tokenType: parsed.tokenType,
        createdAt: parsed.createdAt,
        updatedAt: parsed.updatedAt
      })
    } catch {
      // 跳过无法读取的授权文件
    }
  }

  records.sort((a, b) => b.updatedAt - a.updatedAt)
  return records
}

/**
 * 读取授权记录
 */
export async function readAuth(authId: string): Promise<AuthRecord | null> {
  const { authsDir } = getStoragePaths()
  await ensureStorageDirs()
  const fileName = ensureJsonExtension(authId)
  try {
    const raw = await fs.readFile(join(authsDir, fileName), 'utf-8')
    return JSON.parse(raw) as AuthRecord
  } catch {
    return null
  }
}

/**
 * 保存授权记录
 */
export async function saveAuth(
  record: Omit<AuthRecord, 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<AuthSummary> {
  const { authsDir } = getStoragePaths()
  await ensureStorageDirs()
  const fileName = record.id ? ensureJsonExtension(record.id) : buildAuthFileName(record.label)
  const filePath = join(authsDir, fileName)

  let createdAt = Date.now()
  if (record.id) {
    const existing = await readAuth(record.id)
    if (existing?.createdAt) {
      createdAt = existing.createdAt
    }
  }

  const updatedAt = Date.now()
  const payload: AuthRecord = {
    type: record.type,
    label: record.label,
    email: record.email,
    projectId: record.projectId,
    accessToken: record.accessToken,
    refreshToken: record.refreshToken,
    expiresAt: record.expiresAt,
    tokenType: record.tokenType,
    createdAt,
    updatedAt
  }

  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf-8')
  return {
    id: fileName,
    label: payload.label,
    email: payload.email,
    projectId: payload.projectId,
    expiresAt: payload.expiresAt,
    tokenType: payload.tokenType,
    createdAt,
    updatedAt
  }
}

/**
 * 删除授权记录
 */
export async function deleteAuth(authId: string): Promise<void> {
  const { authsDir } = getStoragePaths()
  await ensureStorageDirs()
  const fileName = ensureJsonExtension(authId)
  await fs.rm(join(authsDir, fileName), { force: true })
}
