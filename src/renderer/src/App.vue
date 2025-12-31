<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <el-header class="app-header" height="60px">
      <div class="header-content">
        <div class="logo-area">
          <h1>nanoBan</h1>
        </div>

        <!-- 当前配置展示 -->
        <div class="header-config">
          <div class="config-tag">
            <span class="label">当前配置:</span>
            <span class="value">{{ configStore.imageSize }}</span>
            <span class="divider">|</span>
            <span class="value">{{ configStore.aspectRatio }}</span>
          </div>
        </div>

        <div class="header-actions">
          <template v-if="authStore.isAuthenticated">
            <el-tag type="success" size="small" effect="dark">已认证</el-tag>
            <el-button type="danger" link size="small" @click="handleLogout">登出</el-button>
          </template>
          <template v-else>
            <el-tag type="warning" size="small" effect="dark">未认证</el-tag>
          </template>
          <el-button type="primary" size="small" @click="showAuthDialog = true">设置</el-button>
        </div>
      </div>
    </el-header>

    <!-- 主内容区域 -->
    <el-container class="main-container">
      <!-- 左侧面板 -->
      <el-aside width="280px" class="side-panel">
        <el-scrollbar>
          <div class="side-content">
            <SessionPanel />
            <ConfigPanel />
          </div>
        </el-scrollbar>
      </el-aside>

      <!-- 中间对话区域 -->
      <el-main class="chat-area">
        <ChatView />
      </el-main>
    </el-container>

    <!-- 设置对话框 -->
    <AuthDialog v-model="showAuthDialog" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from './stores/auth'
import { useConfigStore } from './stores/config'
import { useChatStore } from './stores/chat'
import ChatView from './views/ChatView.vue'
import ConfigPanel from './components/ConfigPanel.vue'
import SessionPanel from './components/SessionPanel.vue'
import AuthDialog from './components/AuthDialog.vue'

const authStore = useAuthStore()
const configStore = useConfigStore()
const chatStore = useChatStore()

const showAuthDialog = ref(false)

// 初始化应用
onMounted(async () => {
  // 从本地存储加载配置
  await authStore.loadFromStorage()
  await configStore.loadConfig()
  await chatStore.initialize()
})

// 处理登出
const handleLogout = (): void => {
  authStore.logout()
  ElMessage.success('已登出')
}
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.app-header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  z-index: 10;
}

.header-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo-area h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #303133;
  letter-spacing: -0.5px;
}

.header-config {
  flex: 1;
  display: flex;
  justify-content: center;
}

.config-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f4f4f5;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  color: #606266;
  border: 1px solid #e4e7ed;
}

.config-tag .label {
  color: #909399;
}

.config-tag .value {
  font-weight: 600;
  color: #303133;
}

.config-tag .divider {
  color: #dcdfe6;
  font-size: 12px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.main-container {
  flex: 1;
  overflow: hidden;
}

.side-panel {
  background: #fff;
  border-right: 1px solid #e4e7ed;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.side-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chat-area {
  padding: 0;
  overflow: hidden;
  position: relative;
}
</style>

<style>
/* 全局样式：图片预览器样式优化 */
.el-image-viewer__wrapper {
  z-index: 3000 !important;
}

.el-image-viewer__mask {
  background-color: rgba(0, 0, 0, 0.9) !important; /* 深色半透明背景,突出图片 */
}

.el-image-viewer__canvas {
  z-index: 3001 !important; /* 确保图片在遮罩之上 */
}

/* 优化预览器的关闭按钮和操作栏 */
.el-image-viewer__btn {
  background-color: rgba(255, 255, 255, 0.1) !important;
  z-index: 3002 !important; /* 按钮在最上层 */
}

.el-image-viewer__btn:hover {
  background-color: rgba(255, 255, 255, 0.2) !important;
}

.el-image-viewer__actions {
  background-color: rgba(0, 0, 0, 0.7) !important;
  backdrop-filter: blur(10px);
  z-index: 3002 !important; /* 操作栏在最上层 */
}
</style>
