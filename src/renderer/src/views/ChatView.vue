<template>
  <div class="relative flex h-full w-full flex-col overflow-hidden">
    <!-- 消息列表区域 -->
    <div
      ref="scrollContainerRef"
      class="flex-1 overflow-y-auto p-4 pt-24 md:p-8 custom-scrollbar scroll-smooth"
    >
      <div v-if="chatStore.messages.length > 0" class="mx-auto flex max-w-6xl flex-col gap-8 pb-64">
        <div
          v-for="message in chatStore.messages"
          :key="message.id"
          :class="[
            'flex items-start gap-4 transition-all duration-300 ease-out',
            message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
          ]"
        >
          <!-- 头像 -->
          <div
            class="h-10 w-10 shrink-0 overflow-hidden rounded-full shadow-lg border-2 border-white/10"
          >
            <template v-if="message.role === 'model'">
              <div
                class="flex h-full w-full items-center justify-center bg-[#1A1A2E] text-primary-400"
              >
                <Icon icon="mdi:robot-happy" class="text-xl" />
              </div>
            </template>
            <template v-else>
              <div
                class="flex h-full w-full items-center justify-center bg-[#FFF9F2] text-[#4A3B32]"
              >
                <Icon icon="mdi:account" class="text-xl" />
              </div>
            </template>
          </div>

          <!-- 消息内容容器 -->
          <div
            :class="[
              'flex max-w-[85%] flex-col gap-2',
              message.role === 'user' ? 'items-end' : 'items-start'
            ]"
          >
            <!-- 角色名 -->
            <span class="text-xs text-white/40 px-1">{{
              message.role === 'user' ? 'You' : 'Nano Banana'
            }}</span>

            <!-- 文本内容 -->
            <div
              v-if="message.content"
              :class="[
                'w-fit whitespace-pre-wrap rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm backdrop-blur-md',
                message.role === 'model'
                  ? 'bg-white/5 text-white/90 border border-white/10 rounded-tl-sm'
                  : 'bg-[#FFF9F2] text-[#4A3B32] rounded-tr-sm'
              ]"
            >
              {{ message.content }}
            </div>

            <!-- 图片内容 (使用新风格卡片) -->
            <div
              v-if="message.imageUrls && message.imageUrls.length > 0"
              class="mt-2 grid w-full gap-4"
              :class="message.imageUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'"
            >
              <div
                v-for="(img, idx) in message.imageUrls"
                :key="idx"
                class="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-2xl transition-all hover:scale-[1.01] hover:border-white/20"
              >
                <!-- 加载状态 (如果是最后一条且正在生成) -->
                <div
                  v-if="
                    chatStore.isGenerating &&
                    message === lastModelMessage &&
                    idx === message.imageUrls.length - 1
                  "
                  class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
                >
                  <div
                    class="h-8 w-8 animate-spin rounded-full border-2 border-white/50 border-t-transparent"
                  ></div>
                </div>

                <img
                  v-if="true"
                  :src="img"
                  class="block h-auto w-full cursor-pointer object-contain min-w-[200px]"
                  loading="lazy"
                  @click="openImagePreview(message.imageUrls!, idx)"
                  @load="handleImageLoad($event, img, message.images?.[idx])"
                />

                <!-- 悬浮操作栏 -->
                <div
                  class="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                >
                  <span class="text-xs text-white/60 font-mono">{{
                    getImageMetadataText(img)
                  }}</span>
                  <div class="flex gap-2">
                    <button
                      class="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-md"
                      title="保存图片"
                      @click.stop="handleSaveImage(message.images?.[idx] || img, message.id, idx)"
                    >
                      <Icon icon="mdi:download" class="h-4 w-4" />
                    </button>
                    <button
                      class="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-md"
                      title="查看大图"
                      @click.stop="openImagePreview(message.imageUrls!, idx)"
                    >
                      <Icon icon="mdi:fullscreen" class="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-else
        class="flex h-full flex-col items-center justify-center pb-20 fade-in text-center"
      >
        <div class="mb-8 relative">
          <div class="absolute inset-0 animate-pulse bg-primary-500/20 blur-3xl rounded-full"></div>
          <div
            class="relative h-28 w-28 rounded-[2rem] bg-gradient-to-tr from-[#FFF9F2] to-[#FFE4C4] flex items-center justify-center shadow-2xl rotate-3 transition-transform hover:rotate-6"
          >
            <Icon icon="mdi:palette" class="text-5xl text-[#4A3B32]" />
          </div>
        </div>
        <h2 class="text-3xl font-light text-white mb-3 tracking-wide">Nano Banana Pro</h2>
        <p class="text-white/40 font-light text-lg">输入灵感，开启你的创作之旅</p>
      </div>
    </div>

    <!-- 底部输入区域 (悬浮风格) -->
    <div
      class="absolute bottom-6 left-0 right-0 z-30 px-4 flex justify-center w-full pointer-events-none"
    >
      <div
        class="w-full max-w-6xl pointer-events-auto animate-in slide-in-from-bottom-6 duration-500"
      >
        <div
          class="relative flex flex-col gap-3 rounded-[28px] bg-[#FFF9F2] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all focus-within:shadow-[0_12px_40px_rgba(255,255,255,0.1)] border border-white/10"
        >
          <!-- 隐藏的文件输入 -->
          <input
            ref="fileInputRef"
            type="file"
            class="hidden"
            accept="image/*"
            multiple
            @change="handleImageUpload"
          />

          <!-- 已上传参考图预览区 -->
          <div
            v-if="chatStore.referenceImages.length > 0"
            class="flex gap-2 overflow-x-auto scrollbar-hide pb-2 border-b border-[#EAE0D6]"
          >
            <div
              v-for="(img, idx) in chatStore.referenceImages"
              :key="idx"
              class="relative shrink-0 group"
            >
              <img
                :src="img"
                class="h-16 w-16 object-cover rounded-lg border border-[#E5DAC8] cursor-pointer hover:border-[#D0C0A8] transition-colors"
                @click="openReferenceImagePreview(idx)"
              />
              <button
                class="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-[#4A3B32] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 shadow-sm"
                title="删除"
                @click.stop="chatStore.removeReferenceImage(idx)"
              >
                <Icon icon="mdi:close" class="text-xs" />
              </button>
            </div>
            <!-- 添加更多按钮 -->
            <button
              class="shrink-0 h-16 w-16 rounded-lg border border-dashed border-[#E5DAC8] flex items-center justify-center hover:border-[#D0C0A8] hover:bg-white transition-colors"
              title="添加更多参考图"
              @click="triggerFileInput"
            >
              <Icon icon="mdi:plus" class="text-xl text-[#C4B4A4]" />
            </button>
          </div>

          <!-- 顶部行：图片上传 + 文本输入 -->
          <div class="flex gap-3">
            <!-- 上传/参考图占位 (无图片时显示) -->
            <div
              v-if="chatStore.referenceImages.length === 0"
              class="group relative flex h-[80px] w-[80px] shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-[#E5DAC8] bg-[#FAF7F2] transition-colors hover:border-[#D0C0A8] hover:bg-white"
              @click="triggerFileInput"
            >
              <Icon
                icon="mdi:image-plus"
                class="text-2xl text-[#C4B4A4] transition-transform group-hover:scale-110"
              />
              <span class="text-[10px] text-[#C4B4A4] mt-1">参考图</span>
            </div>

            <!-- 文本输入框 -->
            <div class="flex-1 py-1 flex flex-col justify-center">
              <textarea
                v-model="promptInput"
                placeholder="描述你的想象..."
                class="w-full resize-none bg-transparent text-base text-[#4A3B32] placeholder-[#A09080]/60 outline-none max-h-[120px]"
                :rows="chatStore.referenceImages.length > 0 ? 3 : 2"
                style="font-family: inherit"
                @keydown.enter="handleEnterKey"
              ></textarea>
            </div>
          </div>

          <!-- 分割线 -->
          <div class="h-px w-full bg-[#EAE0D6]"></div>

          <!-- 底部行：参数 Pill & 发送按钮 -->
          <div class="flex items-center justify-between px-1 relative">
            <div class="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <!-- 比例 Pill (Trigger) -->
              <button
                ref="aspectRatioTriggerRef"
                class="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#66554A] shadow-sm ring-1 ring-[#E5E0D8] transition-all hover:bg-[#FDFBF7] hover:ring-[#D8CFC5]"
                @click.stop="toggleAspectRatioPopup"
              >
                <Icon icon="mdi:crop" class="text-sm opacity-70" />
                {{ configStore.aspectRatio }}
              </button>

              <!-- 分辨率 Pill -->
              <button
                class="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#66554A] shadow-sm ring-1 ring-[#E5E0D8] transition-all hover:bg-[#FDFBF7] hover:ring-[#D8CFC5]"
                @click="cycleImageSize"
              >
                <Icon icon="mdi:image-size-select-large" class="text-sm opacity-70" />
                {{ configStore.imageSize }}
              </button>

              <!-- 模型 Pill (静态) -->
              <div
                class="flex items-center gap-1.5 rounded-full bg-[#5D4037] px-3 py-1.5 text-xs font-bold text-[#EFEBE9] shadow-sm"
              >
                <Icon icon="mdi:google" class="text-xs" />
                Gemini
              </div>
            </div>

            <!-- 发送/停止按钮 -->
            <div class="flex gap-2">
              <!-- 清除按钮 (输入时显示) -->
              <button
                v-if="promptInput || chatStore.referenceImages.length > 0"
                class="flex h-9 w-9 items-center justify-center rounded-full text-[#A09080] hover:bg-[#F0E6DA] transition-colors"
                title="清空"
                @click="clearInput"
              >
                <Icon icon="mdi:delete-outline" class="text-lg" />
              </button>

              <button
                class="group flex h-10 px-6 items-center gap-2 rounded-full bg-[#3E3029] text-[#FFF9F2] shadow-sm transition-all hover:bg-[#2C221D] hover:shadow-lg hover:ring-2 hover:ring-[#E5DAC8] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                :disabled="!canGenerate && !chatStore.isGenerating"
                @click="chatStore.isGenerating ? handleStop() : handleGenerate()"
              >
                <span class="text-sm font-bold tracking-wide">{{
                  chatStore.isGenerating ? '停止' : '生成'
                }}</span>
                <Icon
                  v-if="chatStore.isGenerating"
                  icon="mdi:loading"
                  class="text-lg animate-spin"
                />
                <Icon
                  v-else
                  icon="mdi:creation"
                  class="text-lg transition-transform group-hover:rotate-12"
                />
              </button>
            </div>

            <!-- 比例选择弹窗 (Moved outside loop to avoid clipping) -->
            <div
              v-if="showAspectRatioPopup"
              ref="aspectRatioPopupRef"
              class="absolute bottom-12 left-0 z-50 w-72 origin-bottom-left rounded-2xl border border-[#E5DAC8] bg-[#FFF9F2] shadow-xl animate-in zoom-in-95 duration-200"
              @click.stop
            >
              <div class="flex items-center justify-between border-b border-[#E5DAC8] px-4 py-3">
                <span class="text-sm font-bold text-[#4A3B32]">输出设置</span>
                <button
                  class="text-[#A09080] hover:text-[#4A3B32]"
                  @click="showAspectRatioPopup = false"
                >
                  <Icon icon="mdi:close" />
                </button>
              </div>

              <div class="p-4">
                <!-- 比例部分 -->
                <div class="mb-4">
                  <div class="mb-2 text-xs font-medium text-[#A09080]">选择比例</div>
                  <div class="grid grid-cols-4 gap-2">
                    <button
                      v-for="ratio in aspectRatios"
                      :key="ratio"
                      class="flex flex-col items-center gap-1 rounded-lg border p-2 transition-all hover:bg-[#F0E6DA]"
                      :class="
                        configStore.aspectRatio === ratio
                          ? 'border-primary-500 bg-[#3E3029] text-white shadow-md'
                          : 'border-transparent text-[#66554A]'
                      "
                      @click="selectAspectRatio(ratio)"
                    >
                      <div
                        class="border-2 rounded-sm"
                        :class="[
                          configStore.aspectRatio === ratio ? 'border-white' : 'border-[#66554A]',
                          getAspectRatioClass(ratio)
                        ]"
                      ></div>
                      <span class="text-[10px]">{{ ratio }}</span>
                    </button>
                  </div>
                </div>

                <!-- 分辨率部分 -->
                <div>
                  <div class="mb-2 text-xs font-medium text-[#A09080]">选择分辨率</div>
                  <div class="flex rounded-lg bg-[#FAF7F2] p-1 ring-1 ring-[#E5DAC8]">
                    <button
                      v-for="size in imageSizes"
                      :key="size"
                      class="flex-1 rounded-md py-1.5 text-xs font-medium transition-all"
                      :class="
                        configStore.imageSize === size
                          ? 'bg-black text-white shadow-sm'
                          : 'text-[#66554A] hover:bg-white/50'
                      "
                      @click="configStore.setImageSize(size)"
                    >
                      {{ size }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片预览组件 -->
    <div
      v-if="previewVisible"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-200"
      @click="previewVisible = false"
    >
      <!-- 预览内容 -->
      <div class="relative max-w-[95vw] max-h-[95vh]" @click.stop>
        <img
          :src="previewImages[previewIndex]"
          class="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
        />

        <!-- 预览控制 -->
        <div class="absolute bottom-[-50px] left-1/2 -translate-x-1/2 flex gap-4">
          <button
            class="p-2 text-white/50 hover:text-white transition-colors"
            @click.stop="handleSaveImage(previewImages[previewIndex], 'preview', previewIndex)"
          >
            <Icon icon="mdi:download" class="text-2xl" />
          </button>
          <button
            class="p-2 text-white/50 hover:text-white transition-colors"
            @click="previewVisible = false"
          >
            <Icon icon="mdi:close" class="text-2xl" />
          </button>
        </div>

        <!-- 导航箭头 -->
        <button
          v-if="previewImages.length > 1"
          class="absolute left-[-60px] top-1/2 -translate-y-1/2 p-3 text-white/30 hover:text-white hover:bg-white/10 rounded-full transition-all"
          :disabled="previewIndex === 0"
          @click.stop="
            previewIndex = (previewIndex - 1 + previewImages.length) % previewImages.length
          "
        >
          <Icon icon="mdi:chevron-left" class="text-4xl" />
        </button>
        <button
          v-if="previewImages.length > 1"
          class="absolute right-[-60px] top-1/2 -translate-y-1/2 p-3 text-white/30 hover:text-white hover:bg-white/10 rounded-full transition-all"
          :disabled="previewIndex === previewImages.length - 1"
          @click.stop="previewIndex = (previewIndex + 1) % previewImages.length"
        >
          <Icon icon="mdi:chevron-right" class="text-4xl" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted, onUnmounted, reactive } from 'vue'
import { Icon } from '@iconify/vue'
import { useChatStore } from '../stores/chat'
import { useConfigStore } from '../stores/config'
import { useAuthStore } from '../stores/auth'
import { toast } from '../components/ui'
import type { AspectRatio, ImageSize } from '../types/gemini'

const chatStore = useChatStore()
const configStore = useConfigStore()
const authStore = useAuthStore()

const promptInput = ref('')
const fileInputRef = ref<HTMLInputElement>()
const scrollContainerRef = ref<HTMLElement>()

// 预览状态
const previewVisible = ref(false)
const previewImages = ref<string[]>([])
const previewIndex = ref(0)

// 图片元数据缓存 { [imageUrl]: { width, height, size } }
const imageMetadata = reactive<Record<string, { width: number; height: number; size: string }>>({})

// 辅助计算
const lastModelMessage = computed(() => {
  const msgs = chatStore.messages
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].role === 'model') return msgs[i]
  }
  return null
})

const canGenerate = computed(() => {
  return (
    authStore.isAuthenticated &&
    (promptInput.value.trim() !== '' || chatStore.referenceImages.length > 0) &&
    !chatStore.isGenerating
  )
})

// ---------------------- 交互逻辑 ----------------------

const aspectRatioTriggerRef = ref<HTMLElement>()
const aspectRatioPopupRef = ref<HTMLElement>()

// ---------------------- 交互逻辑 ----------------------

const scrollToBottom = (): void => {
  if (scrollContainerRef.value) {
    // 使用 smooth behavior 如果距离不大，否则 auto
    const target = scrollContainerRef.value.scrollHeight
    scrollContainerRef.value.scrollTo({ top: target, behavior: 'smooth' })
  }
}

// 监听消息变化自动滚动
watch(
  () => chatStore.messages.length,
  () => {
    nextTick(scrollToBottom)
  }
)

const handleEnterKey = (e: KeyboardEvent): void => {
  if (!e.shiftKey) {
    e.preventDefault()
    handleGenerate()
  }
}

const clearInput = (): void => {
  promptInput.value = ''
  chatStore.clearReferenceImages()
}

// ---------------------- 核心功能 ----------------------

// 触发文件选择
const triggerFileInput = (): void => {
  fileInputRef.value?.click()
}

const handleImageUpload = (event: Event): void => {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files) return

  Array.from(files).forEach((file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      chatStore.addReferenceImage(base64)
    }
    reader.readAsDataURL(file)
  })
  input.value = ''
}

const aspectRatios: AspectRatio[] = ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '21:9']
const imageSizes: ImageSize[] = ['1K', '2K', '4K']

// 比例弹窗控制
const showAspectRatioPopup = ref(false)

const toggleAspectRatioPopup = (): void => {
  showAspectRatioPopup.value = !showAspectRatioPopup.value
}

const selectAspectRatio = (ratio: AspectRatio): void => {
  configStore.setAspectRatio(ratio)
  showAspectRatioPopup.value = false
}

const cycleImageSize = (): void => {
  const currentIndex = imageSizes.indexOf(configStore.imageSize)
  const nextIndex = (currentIndex + 1) % imageSizes.length
  configStore.setImageSize(imageSizes[nextIndex])
}

// 获取比例预览图的类名
const getAspectRatioClass = (ratio: string): string => {
  switch (ratio) {
    case '1:1':
      return 'w-6 h-6'
    case '16:9':
      return 'w-8 h-[18px]'
    case '9:16':
      return 'w-[18px] h-8'
    case '4:3':
      return 'w-7 h-5'
    case '3:4':
      return 'w-5 h-7'
    case '3:2':
      return 'w-[30px] h-5'
    case '2:3':
      return 'w-5 h-[30px]'
    case '21:9':
      return 'w-9 h-4'
    default:
      return 'w-6 h-6'
  }
}

const handleDocumentClick = (e: MouseEvent): void => {
  const target = e.target as HTMLElement
  if (showAspectRatioPopup.value) {
    if (aspectRatioTriggerRef.value?.contains(target)) return
    if (aspectRatioPopupRef.value?.contains(target)) return
    showAspectRatioPopup.value = false
  }
}

// 监听点击外部关闭弹窗
onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})

const handleGenerate = async (): Promise<void> => {
  if (!canGenerate.value) {
    if (!authStore.isAuthenticated) toast.warning('请先去设置页面进行认证')
    else if (!promptInput.value.trim() && chatStore.referenceImages.length === 0)
      toast.warning('请输入描述或上传图片')
    return
  }

  const text = promptInput.value
  promptInput.value = ''
  const currentRefImages = [...chatStore.referenceImages]
  chatStore.clearReferenceImages()

  // 滚动到底部
  nextTick(scrollToBottom)

  try {
    await chatStore.generateImage(text, currentRefImages)
  } catch (error) {
    console.error(error)
    // 错误时恢复输入 (可选)
  }
}

const handleStop = async (): Promise<void> => {
  await chatStore.stopGeneration()
}

const handleSaveImage = async (imgSrc: string, msgId: string, idx: number): Promise<void> => {
  try {
    const fileName = `nanoban_art_${msgId || 'preview'}_${idx}.png`
    const result = imgSrc.startsWith('data:')
      ? await window.api.saveImage(imgSrc, fileName)
      : await window.api.exportImage(imgSrc, fileName)

    if (result.success) toast.success('已保存')
    else toast.error('保存失败')
  } catch (e) {
    console.error(e)
    toast.error('保存出错')
  }
}

const openImagePreview = (images: string[], index: number): void => {
  previewImages.value = images
  previewIndex.value = index
  previewVisible.value = true
}

const openReferenceImagePreview = (index: number): void => {
  openImagePreview([...chatStore.referenceImages], index)
}

/**
 * 处理图片加载完成事件，获取图片尺寸
 */
const handleImageLoad = async (
  event: Event,
  imageUrl: string,
  relativePath?: string
): Promise<void> => {
  const img = event.target as HTMLImageElement
  const width = img.naturalWidth
  const height = img.naturalHeight

  // 获取文件大小
  let size = ''
  if (relativePath && !relativePath.startsWith('data:')) {
    try {
      const stats = await window.api.getImageStats(relativePath)
      size = stats.sizeFormatted
    } catch (error) {
      console.error('获取图片大小失败:', error)
    }
  }

  imageMetadata[imageUrl] = { width, height, size }
}

/**
 * 获取图片元数据显示文本
 */
const getImageMetadataText = (imageUrl: string): string => {
  const meta = imageMetadata[imageUrl]
  if (!meta) return '加载中...'

  const resolution = `${meta.width}x${meta.height}`
  if (meta.size) {
    return `${resolution} | ${meta.size}`
  }
  return resolution
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
