import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ImageSize, AspectRatio, PresetConfig, ImageConfig } from '../types/gemini'

export const useConfigStore = defineStore('config', () => {
  // 当前配置
  const imageSize = ref<ImageSize>('1K')
  const aspectRatio = ref<AspectRatio>('1:1')

  // 预设配置模板
  const presets = ref<PresetConfig[]>([
    {
      name: '正方形 1K',
      imageSize: '1K',
      aspectRatio: '1:1',
      description: '1024x1024 标准尺寸'
    },
    {
      name: '正方形 2K',
      imageSize: '2K',
      aspectRatio: '1:1',
      description: '2048x2048 高清尺寸'
    },
    {
      name: '正方形 4K',
      imageSize: '4K',
      aspectRatio: '1:1',
      description: '4096x4096 超高清'
    },
    {
      name: '横屏 16:9 (2K)',
      imageSize: '2K',
      aspectRatio: '16:9',
      description: '2752x1536 宽屏'
    },
    {
      name: '横屏 16:9 (4K)',
      imageSize: '4K',
      aspectRatio: '16:9',
      description: '5504x3072 超高清宽屏'
    },
    {
      name: '竖屏 9:16 (2K)',
      imageSize: '2K',
      aspectRatio: '9:16',
      description: '1536x2752 竖屏'
    },
    {
      name: '竖屏 9:16 (4K)',
      imageSize: '4K',
      aspectRatio: '9:16',
      description: '3072x5504 超高清竖屏'
    },
    {
      name: '超宽 21:9 (2K)',
      imageSize: '2K',
      aspectRatio: '21:9',
      description: '3168x1344 电影宽幅'
    },
    {
      name: '4:3 经典 (2K)',
      imageSize: '2K',
      aspectRatio: '4:3',
      description: '2400x1792 经典比例'
    }
  ])

  // 方法

  /**
   * 设置图像尺寸
   */
  function setImageSize(size: ImageSize): void {
    imageSize.value = size
    void saveConfig()
  }

  /**
   * 设置宽高比
   */
  function setAspectRatio(ratio: AspectRatio): void {
    aspectRatio.value = ratio
    void saveConfig()
  }

  /**
   * 应用预设配置
   */
  function applyPreset(preset: PresetConfig): void {
    imageSize.value = preset.imageSize
    aspectRatio.value = preset.aspectRatio
    void saveConfig()
  }

  /**
   * 获取当前图像配置
   */
  function getCurrentImageConfig(): ImageConfig {
    return {
      imageSize: imageSize.value,
      aspectRatio: aspectRatio.value
    }
  }

  /**
   * 保存配置到本地存储
   */
  async function saveConfig(): Promise<void> {
    await window.api.updateSettings({
      imageSize: imageSize.value,
      aspectRatio: aspectRatio.value
    })
  }

  /**
   * 从本地存储加载配置
   */
  async function loadConfig(): Promise<void> {
    try {
      const settings = await window.api.getSettings()
      imageSize.value = (settings.imageSize as ImageSize) || '1K'
      aspectRatio.value = (settings.aspectRatio as AspectRatio) || '1:1'
      if (Array.isArray(settings.presets)) {
        presets.value = settings.presets as PresetConfig[]
      }
    } catch (error) {
      console.error('加载配置失败:', error)
    }
  }

  /**
   * 添加自定义预设
   */
  function addPreset(preset: PresetConfig): void {
    presets.value.push(preset)
    void savePresets()
  }

  /**
   * 删除预设
   */
  function removePreset(index: number): void {
    presets.value.splice(index, 1)
    void savePresets()
  }

  /**
   * 保存预设到本地存储
   */
  async function savePresets(): Promise<void> {
    await window.api.updateSettings({
      presets: presets.value
    })
  }

  /**
   * 从本地存储加载预设
   */
  async function loadPresets(): Promise<void> {
    try {
      const settings = await window.api.getSettings()
      if (Array.isArray(settings.presets)) {
        presets.value = settings.presets as PresetConfig[]
      }
    } catch (error) {
      console.error('加载预设失败:', error)
    }
  }

  return {
    // 状态
    imageSize,
    aspectRatio,
    presets,
    // 方法
    setImageSize,
    setAspectRatio,
    applyPreset,
    getCurrentImageConfig,
    saveConfig,
    loadConfig,
    addPreset,
    removePreset,
    savePresets,
    loadPresets
  }
})
