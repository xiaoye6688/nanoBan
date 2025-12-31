<template>
  <div class="config-panel">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>图像参数配置</span>
        </div>
      </template>

      <!-- 参数配置区域 -->
      <div class="config-rows">
        <!-- 分辨率 -->
        <div class="config-item">
          <span class="item-label">分辨率</span>
          <div class="item-control">
            <el-radio-group
              v-model="configStore.imageSize"
              size="small"
              @change="configStore.saveConfig()"
            >
              <el-radio-button label="1K">1K</el-radio-button>
              <el-radio-button label="2K">2K</el-radio-button>
              <el-radio-button label="4K">4K</el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <!-- 宽高比 -->
        <div class="config-item">
          <span class="item-label">宽高比</span>
          <div class="item-control">
            <el-select
              v-model="configStore.aspectRatio"
              size="small"
              style="width: 100px"
              @change="configStore.saveConfig()"
            >
              <el-option label="1:1" value="1:1" />
              <el-option label="16:9" value="16:9" />
              <el-option label="9:16" value="9:16" />
              <el-option label="4:3" value="4:3" />
              <el-option label="3:4" value="3:4" />
              <el-option label="21:9" value="21:9" />
            </el-select>
          </div>
        </div>
      </div>

      <!-- 预设配置 -->
      <div class="config-section">
        <div
          class="section-title"
          :class="{ 'is-active': isPresetsExpanded }"
          @click="isPresetsExpanded = !isPresetsExpanded"
        >
          <el-icon><ArrowRight /></el-icon>
          预设配置
        </div>
        <div v-show="isPresetsExpanded" class="presets-grid">
          <div
            v-for="(preset, index) in configStore.presets"
            :key="index"
            class="preset-card"
            @click="applyPreset(preset)"
          >
            <div class="preset-info">
              <div class="preset-name">{{ preset.name }}</div>
              <div class="preset-desc">{{ preset.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useConfigStore } from '../stores/config'
import { ElMessage } from 'element-plus'
import type { PresetConfig } from '../types/gemini'
import { ArrowRight } from '@element-plus/icons-vue'

const configStore = useConfigStore()
const isPresetsExpanded = ref(false)

// 应用预设配置
const applyPreset = (preset: PresetConfig): void => {
  configStore.applyPreset(preset)
  ElMessage.success(`已应用预设: ${preset.name}`)
}
</script>

<style scoped>
.config-panel {
  width: 100%;
}

.card-header {
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.config-rows {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.config-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.item-label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.item-control {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  max-width: 60%;
}

/* Presets Grid */
.config-section {
  margin-top: 10px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  user-select: none;
}

.section-title:hover {
  color: #409eff;
}

.section-title .el-icon {
  margin-right: 4px;
  transition: transform 0.3s;
}

.section-title.is-active .el-icon {
  transform: rotate(90deg);
}

.presets-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.preset-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background: #fff;
  position: relative;
  overflow: hidden;
}

.preset-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
  transform: translateY(-1px);
}

.preset-card.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.preset-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preset-name {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}

.preset-desc {
  font-size: 11px;
  color: #909399;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

:deep(.el-card__header) {
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-card__body) {
  padding: 16px;
}

:deep(.el-radio-button__inner) {
  padding: 5px 12px;
  font-size: 12px;
}
</style>
