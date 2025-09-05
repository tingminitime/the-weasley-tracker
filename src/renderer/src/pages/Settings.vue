<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import McpStatus from '../components/McpStatus.vue'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog'

const router = useRouter()

const apiKey = ref('')
const showApiKey = ref(false)
const isLoading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const showClearDialog = ref(false)

function goBack() {
  router.go(-1)
}

function toggleApiKeyVisibility() {
  showApiKey.value = !showApiKey.value
}

function clearMessages() {
  successMessage.value = ''
  errorMessage.value = ''
}

async function loadCurrentApiKey() {
  try {
    const hasApiKey = await window.electron.ipcRenderer.invoke('settings:hasApiKey')
    if (hasApiKey) {
      // Don't load the actual key for security, just show that it exists
      apiKey.value = '••••••••••••••••••••••••'
    }
  }
  catch (error) {
    console.error('Failed to check API key status:', error)
  }
}

async function testApiKey() {
  if (!apiKey.value || apiKey.value.startsWith('••••')) {
    errorMessage.value = '請先輸入 API Key'
    return
  }

  isLoading.value = true
  clearMessages()

  try {
    const isValid = await window.electron.ipcRenderer.invoke('settings:testApiKey', apiKey.value)
    if (isValid) {
      successMessage.value = 'API Key 有效！'
    }
    else {
      errorMessage.value = 'API Key 無效，請檢查後重新輸入'
    }
  }
  catch (error) {
    errorMessage.value = `測試失敗：${error instanceof Error ? error.message : '未知錯誤'}`
  }
  finally {
    isLoading.value = false
  }
}

async function saveApiKey() {
  if (!apiKey.value) {
    errorMessage.value = '請輸入 API Key'
    return
  }

  if (apiKey.value.startsWith('••••')) {
    successMessage.value = 'API Key 已保存'
    return
  }

  isLoading.value = true
  clearMessages()

  try {
    await window.electron.ipcRenderer.invoke('settings:setApiKey', apiKey.value)
    successMessage.value = 'API Key 已保存並重新初始化服務'
    // Reset to masked display
    apiKey.value = '••••••••••••••••••••••••'
    showApiKey.value = false
  }
  catch (error) {
    errorMessage.value = `保存失敗：${error instanceof Error ? error.message : '未知錯誤'}`
  }
  finally {
    isLoading.value = false
  }
}

async function clearApiKey() {
  isLoading.value = true
  clearMessages()

  try {
    await window.electron.ipcRenderer.invoke('settings:clearApiKey')
    apiKey.value = ''
    successMessage.value = 'API Key 已清除'
    showClearDialog.value = false
  }
  catch (error) {
    errorMessage.value = `清除失敗：${error instanceof Error ? error.message : '未知錯誤'}`
  }
  finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadCurrentApiKey()
})
</script>

<template>
  <div class="flex h-screen flex-col bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div
      class="
        flex items-center justify-between border-b border-gray-200 bg-white p-4
        dark:border-gray-700 dark:bg-gray-800
      "
    >
      <div class="flex items-center gap-3">
        <button
          class="
            flex h-8 w-8 items-center justify-center rounded-lg border
            border-gray-300 bg-white text-gray-600
            hover:bg-gray-50
            dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400
            dark:hover:bg-gray-600
          "
          @click="goBack"
        >
          <span class="i-fluent-arrow-left-20-filled text-sm"></span>
        </button>
        <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
          設定
        </h1>
      </div>
      <McpStatus />
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto p-6">
      <div class="mx-auto max-w-2xl">
        <!-- API Key Section -->
        <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          <h2 class="mb-4 text-lg font-medium text-gray-900 dark:text-white">
            OpenAI API Key 設定
          </h2>

          <div class="mb-4">
            <label
              class="
                mb-2 block text-sm font-medium text-gray-700
                dark:text-gray-300
              "
            >
              API Key
            </label>
            <div class="relative">
              <input
                v-model="apiKey"
                :type="showApiKey ? 'text' : 'password'"
                placeholder="sk-..."
                class="
                  block w-full rounded-md border border-gray-300 px-3 py-2 pr-10
                  shadow-sm
                  focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                  focus:outline-none
                  dark:border-gray-600 dark:bg-gray-700 dark:text-white
                  dark:placeholder-gray-400
                "
              >
              <button
                type="button"
                class="absolute inset-y-0 right-0 flex items-center pr-3"
                @click="toggleApiKeyVisibility"
              >
                <span
                  :class="showApiKey ? 'i-fluent-eye-off-20-regular' : `
                    i-fluent-eye-20-regular
                  `"
                  class="h-5 w-5 text-gray-400 hover:text-gray-600"
                ></span>
              </button>
            </div>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              從 <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                class="text-blue-500 hover:underline"
              >OpenAI Platform</a> 取得您的 API Key
            </p>
          </div>

          <!-- Messages -->
          <div
            v-if="successMessage"
            class="mb-4 rounded-md bg-green-50 p-3 dark:bg-green-900/20"
          >
            <p class="text-sm text-green-700 dark:text-green-400">
              {{ successMessage }}
            </p>
          </div>
          <div
            v-if="errorMessage"
            class="mb-4 rounded-md bg-red-50 p-3 dark:bg-red-900/20"
          >
            <p class="text-sm text-red-700 dark:text-red-400">
              {{ errorMessage }}
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3">
            <button
              :disabled="isLoading"
              class="
                flex items-center gap-2 rounded-md border border-gray-300
                bg-white px-4 py-2 text-sm font-medium text-gray-700
                hover:bg-gray-50
                focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                focus:outline-none
                disabled:cursor-not-allowed disabled:opacity-50
                dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300
                dark:hover:bg-gray-600
              "
              @click="testApiKey"
            >
              <span
                v-if="isLoading"
                class="i-fluent-spinner-ios-20-filled animate-spin"
              ></span>
              <span
                v-else
                class="i-fluent-cube-sync-20-regular text-xl"
              ></span>
              測試連線
            </button>

            <button
              :disabled="isLoading"
              class="
                flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm
                font-medium text-white
                hover:bg-blue-700
                focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                focus:outline-none
                disabled:cursor-not-allowed disabled:opacity-50
              "
              @click="saveApiKey"
            >
              <span
                v-if="isLoading"
                class="i-fluent-spinner-ios-20-filled animate-spin"
              ></span>
              <span
                v-else
                class="i-fluent-save-20-regular text-xl"
              ></span>
              保存
            </button>

            <!-- Clear API Key Dialog -->
            <AlertDialog v-model:open="showClearDialog">
              <AlertDialogTrigger>
                <button
                  :disabled="isLoading"
                  class="
                    flex items-center gap-2 rounded-md border border-red-300
                    bg-white px-4 py-2 text-sm font-medium text-red-700
                    hover:bg-red-50
                    focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                    focus:outline-none
                    disabled:cursor-not-allowed disabled:opacity-50
                    dark:border-red-600 dark:bg-gray-700 dark:text-red-400
                    dark:hover:bg-red-900/20
                  "
                >
                  <span
                    v-if="isLoading"
                    class="i-fluent-spinner-ios-20-filled animate-spin"
                  ></span>
                  <span
                    v-else
                    class="i-fluent-delete-20-regular text-xl"
                  ></span>
                  清除
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>清除 API Key</AlertDialogTitle>
                  <AlertDialogDescription>
                    確定要清除 API Key 嗎？這將禁用 AI 對話功能，您可以隨時重新設定。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel @click="showClearDialog = false">
                    取消
                  </AlertDialogCancel>
                  <AlertDialogAction
                    class="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                    @click="clearApiKey"
                  >
                    確定清除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <!-- Help Section -->
        <div class="mt-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
          <div class="flex items-start gap-3">
            <span class="mt-0.5 i-fluent-info-20-regular text-blue-500"></span>
            <div>
              <h3 class="text-sm font-medium text-blue-900 dark:text-blue-200">
                關於 API Key
              </h3>
              <div class="mt-1 text-sm text-blue-700 dark:text-blue-300">
                <p>• API Key 會安全地儲存在您的本機裝置中</p>
                <p>• 沒有 API Key 時，AI 對話功能將無法使用</p>
                <p>• 您可以隨時更改或清除 API Key</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
