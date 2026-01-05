import { createApp, h } from 'vue'
import BaseToast from './BaseToast.vue'

interface ToastOptions {
  message: string
  type?: 'success' | 'warning' | 'error' | 'info'
  duration?: number
}

let toastId = 0
let containerEl: HTMLElement | null = null

function createContainer(): HTMLElement {
  if (containerEl) return containerEl

  containerEl = document.createElement('div')
  containerEl.id = 'toast-container'
  containerEl.className = 'fixed top-4 right-4 z-[9999] flex flex-col gap-2'
  document.body.appendChild(containerEl)

  return containerEl
}

function showToast(options: ToastOptions): { id: number; close: () => void } {
  const container = createContainer()
  const id = ++toastId
  const duration = options.duration ?? 3000

  const toastEl = document.createElement('div')
  toastEl.className = 'animate-toast-in'
  container.appendChild(toastEl)

  const app = createApp({
    render() {
      return h(BaseToast, {
        message: options.message,
        type: options.type || 'info',
        onClose: () => removeToast()
      })
    }
  })

  app.mount(toastEl)

  function removeToast(): void {
    toastEl.className = 'animate-toast-out'
    setTimeout(() => {
      app.unmount()
      toastEl.remove()
      if (container.children.length === 0) {
        container.remove()
        containerEl = null
      }
    }, 300)
  }

  if (duration > 0) {
    setTimeout(removeToast, duration)
  }

  return { id, close: removeToast }
}

interface ToastReturn {
  id: number
  close: () => void
}

interface UseToastReturn {
  success: (message: string, duration?: number) => ToastReturn
  warning: (message: string, duration?: number) => ToastReturn
  error: (message: string, duration?: number) => ToastReturn
  info: (message: string, duration?: number) => ToastReturn
  show: (options: ToastOptions) => ToastReturn
}

export function useToast(): UseToastReturn {
  return {
    success: (message: string, duration?: number) =>
      showToast({ message, type: 'success', duration }),
    warning: (message: string, duration?: number) =>
      showToast({ message, type: 'warning', duration }),
    error: (message: string, duration?: number) => showToast({ message, type: 'error', duration }),
    info: (message: string, duration?: number) => showToast({ message, type: 'info', duration }),
    show: (options: ToastOptions) => showToast(options)
  }
}

export const toast = useToast()
