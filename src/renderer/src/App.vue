<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <el-header class="app-header" height="60px">
      <div class="header-content">
        <div class="logo-area">
          <h1>nanoBan - Gemini 图像生成器</h1>
        </div>
        <div class="header-actions">
          <template v-if="authStore.isAuthenticated">
            <el-tag type="success">已认证</el-tag>
            <el-button type="danger" size="small" @click="handleLogout">登出</el-button>
          </template>
          <template v-else>
            <el-tag type="warning">未认证</el-tag>
          </template>
          <el-button type="primary" size="small" @click="showAuthDialog = true">设置</el-button>
        </div>
      </div>
    </el-header>

    <!-- 主内容区域 -->
    <el-container class="main-container">
      <!-- 左侧面板 -->
      <el-aside width="360px" class="side-panel">
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.header-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo-area h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
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
}
</style>
