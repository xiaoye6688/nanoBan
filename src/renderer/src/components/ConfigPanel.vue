<template>
  <div class="config-panel">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>图像参数配置</span>
        </div>
      </template>

      <!-- 分辨率选择 -->
      <div class="config-section">
        <div class="section-title">分辨率</div>
        <el-radio-group v-model="configStore.imageSize" @change="configStore.saveConfig()">
          <el-radio-button label="1K">1K</el-radio-button>
          <el-radio-button label="2K">2K</el-radio-button>
          <el-radio-button label="4K">4K</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 宽高比选择 -->
      <div class="config-section">
        <div class="section-title">宽高比</div>
        <el-select
          v-model="configStore.aspectRatio"
          style="width: 100%"
          @change="configStore.saveConfig()"
        >
          <el-option label="1:1 (正方形)" value="1:1" />
          <el-option label="16:9 (横屏)" value="16:9" />
          <el-option label="9:16 (竖屏)" value="9:16" />
          <el-option label="4:3 (经典)" value="4:3" />
          <el-option label="3:4 (经典竖屏)" value="3:4" />
          <el-option label="21:9 (超宽)" value="21:9" />
          <el-option label="2:3" value="2:3" />
          <el-option label="3:2" value="3:2" />
          <el-option label="4:5" value="4:5" />
          <el-option label="5:4" value="5:4" />
        </el-select>
      </div>

      <!-- 预设配置 -->
      <div class="config-section">
        <div class="section-title">预设配置</div>
        <el-scrollbar max-height="300px">
          <div class="presets-list">
            <div
              v-for="(preset, index) in configStore.presets"
              :key="index"
              class="preset-item"
              @click="applyPreset(preset)"
            >
              <div class="preset-info">
                <div class="preset-name">{{ preset.name }}</div>
                <div class="preset-desc">{{ preset.description }}</div>
              </div>
              <el-icon class="preset-icon">
                <ArrowRight />
              </el-icon>
            </div>
          </div>
        </el-scrollbar>
      </div>

      <!-- 当前配置信息 -->
      <div class="config-section">
        <el-descriptions title="当前配置" :column="1" size="small" border>
          <el-descriptions-item label="分辨率">
            {{ configStore.imageSize }}
          </el-descriptions-item>
          <el-descriptions-item label="宽高比">
            {{ configStore.aspectRatio }}
          </el-descriptions-item>
          <el-descriptions-item label="预估像素">
            {{ estimatedPixels }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>

    <!-- 操作按钮 -->
    <el-card shadow="never" style="margin-top: 16px">
      <template #header>
        <div class="card-header">
          <span>对话管理</span>
        </div>
      </template>

      <el-space direction="vertical" style="width: 100%">
        <el-button type="warning" style="width: 100%" @click="handleClearMessages">
          <el-icon><Delete /></el-icon>
          清空对话历史
        </el-button>
        <el-button type="info" style="width: 100%" @click="handleExportMessages">
          <el-icon><Download /></el-icon>
          导出对话
        </el-button>
      </el-space>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useConfigStore } from '../stores/config'
import { useChatStore } from '../stores/chat'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowRight, Delete, Download } from '@element-plus/icons-vue'
import type { PresetConfig } from '../types/gemini'

const configStore = useConfigStore()
const chatStore = useChatStore()

// 应用预设配置
const applyPreset = (preset: PresetConfig): void => {
  configStore.applyPreset(preset)
  ElMessage.success(`已应用预设: ${preset.name}`)
}

// 估算像素数
const estimatedPixels = computed(() => {
  const resolutionMap = {
    '1K': {
      '1:1': '1024x1024',
      '16:9': '1376x768',
      '9:16': '768x1376',
      '4:3': '1200x896',
      '3:4': '896x1200',
      '21:9': '1584x672',
      '2:3': '848x1264',
      '3:2': '1264x848',
      '4:5': '928x1152',
      '5:4': '1152x928'
    },
    '2K': {
      '1:1': '2048x2048',
      '16:9': '2752x1536',
      '9:16': '1536x2752',
      '4:3': '2400x1792',
      '3:4': '1792x2400',
      '21:9': '3168x1344',
      '2:3': '1696x2528',
      '3:2': '2528x1696',
      '4:5': '1856x2304',
      '5:4': '2304x1856'
    },
    '4K': {
      '1:1': '4096x4096',
      '16:9': '5504x3072',
      '9:16': '3072x5504',
      '4:3': '4800x3584',
      '3:4': '3584x4800',
      '21:9': '6336x2688',
      '2:3': '3392x5056',
      '3:2': '5056x3392',
      '4:5': '3712x4608',
      '5:4': '4608x3712'
    }
  }

  return resolutionMap[configStore.imageSize]?.[configStore.aspectRatio] || '未知'
})

// 清空对话历史
const handleClearMessages = (): void => {
  ElMessageBox.confirm('确定要清空所有对话历史吗？此操作不可恢复。', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      chatStore.clearMessages()
      ElMessage.success('对话历史已清空')
    })
    .catch(() => {
      // 取消操作
    })
}

// 导出对话
const handleExportMessages = (): void => {
  try {
    const json = chatStore.exportMessages()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gemini-chat-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('对话已导出')
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '导出失败'
    ElMessage.error(errorMessage)
  }
}
</script>

<style scoped>
.config-panel {
  width: 100%;
}

.card-header {
  font-weight: 600;
  font-size: 14px;
}

.config-section {
  margin-bottom: 24px;
}

.config-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 13px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 12px;
}

.presets-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preset-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-item:hover {
  border-color: #409eff;
  background: #ecf5ff;
}

.preset-info {
  flex: 1;
}

.preset-name {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.preset-desc {
  font-size: 12px;
  color: #909399;
}

.preset-icon {
  color: #909399;
  font-size: 16px;
}

:deep(.el-card__header) {
  padding: 12px 16px;
}

:deep(.el-card__body) {
  padding: 16px;
}
</style>
