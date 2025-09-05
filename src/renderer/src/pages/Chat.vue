<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import ChatInput from '../components/ChatInput.vue'
import ChatMessage from '../components/ChatMessage.vue'
import McpStatus from '../components/McpStatus.vue'
import TeammatesList from '../components/TeammatesList.vue'
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
import { useAuthStore } from '../stores/auth'
import { useChatStore } from '../stores/chat'
import { useDataStore } from '../stores/data'

const router = useRouter()
const authStore = useAuthStore()
const dataStore = useDataStore()
const chatStore = useChatStore()

const messagesContainerRef = ref<HTMLElement>()
const showClearDialog = ref(false)
const hasApiKey = ref(true) // Assume true initially, check on mount

const messages = computed(() => chatStore.conversationHistory)
const isLoading = computed(() => chatStore.isTyping)

onMounted(async () => {
  // Initialize auth store
  await authStore.initialize()

  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  // Initialize data store
  await dataStore.initialize()

  // Check API Key status
  hasApiKey.value = await chatStore.checkApiKeyStatus()
})

async function handleSendMessage(message: string) {
  // Check API key before sending message
  if (!hasApiKey.value) {
    return
  }

  await chatStore.sendUserMessage(message)

  // Scroll to bottom after message is added
  await nextTick()
  scrollToBottom()
}

function scrollToBottom() {
  if (messagesContainerRef.value) {
    messagesContainerRef.value.scrollTop = messagesContainerRef.value.scrollHeight
  }
}

function goToDashboard() {
  router.push('/dashboard')
}

async function handleClearChat() {
  chatStore.clearCurrentUserChat()
  showClearDialog.value = false
}
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-gray-50">
    <div class="flex w-full flex-col">
      <AppHeader>
        <template #actions>
          <div class="flex space-x-3">
            <!-- Clear Chat Dialog -->
            <AlertDialog
              v-if="messages.length > 0"
              v-model:open="showClearDialog"
            >
              <AlertDialogTrigger>
                <button
                  class="
                    inline-flex items-center rounded-md border border-red-300
                    bg-white px-3 py-2 text-sm font-medium text-red-600
                    hover:border-red-400 hover:bg-red-50
                    focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                    focus:outline-none
                  "
                >
                  <svg
                    class="mr-2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  清空對話
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>清空對話記錄</AlertDialogTitle>
                  <AlertDialogDescription>
                    確定要清空當前對話記錄嗎？此操作無法復原。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel @click="showClearDialog = false">
                    取消
                  </AlertDialogCancel>
                  <AlertDialogAction
                    class="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                    @click="handleClearChat"
                  >
                    確定清空
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <!-- Dashboard Button -->
            <button
              class="
                inline-flex items-center rounded-md border border-gray-300
                bg-white px-3 py-2 text-sm font-medium text-gray-700
                hover:bg-gray-50
                focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                focus:outline-none
              "
              @click="goToDashboard"
            >
              <svg
                class="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              狀態看板
            </button>
          </div>
        </template>
      </AppHeader>

      <!-- Chat Container -->
      <main class="flex flex-1 overflow-hidden">
        <!-- Teammates List -->
        <TeammatesList class="mt-8" />
        <!-- Messages Area -->
        <div class="flex-1 overflow-hidden">
          <div
            class="flex h-full w-full flex-col px-4 sm:px-6 lg:max-w-3xl"
          >
            <div
              id="chat-container"
              class="flex h-full flex-col py-4"
            >
              <!-- Messages List -->
              <div
                id="messages-container"
                ref="messagesContainerRef"
                class="
                  scrollbar-thin scrollbar-track-gray-100
                  scrollbar-thumb-gray-300 flex-1 overflow-y-auto p-4
                "
              >
                <!-- API Key Warning -->
                <div
                  v-if="!hasApiKey"
                  class="
                    mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4
                  "
                >
                  <div class="flex items-start gap-3">
                    <span
                      class="mt-0.5 i-fluent-warning-20-filled text-yellow-600"
                    ></span>
                    <div class="flex-1">
                      <h3 class="text-sm font-medium text-yellow-800">
                        需要設定 OpenAI API Key
                      </h3>
                      <div class="mt-2 text-sm text-yellow-700">
                        <p>目前尚未設定 OpenAI API Key，AI 對話功能暫時無法使用。</p>
                        <p class="mt-1">
                          請前往設定頁面配置您的 API Key。
                        </p>
                      </div>
                      <div class="mt-4">
                        <button
                          class="
                            inline-flex items-center gap-2 rounded-md
                            bg-yellow-600 px-3 py-2 text-sm font-medium
                            text-white
                            hover:bg-yellow-700
                            focus:ring-2 focus:ring-yellow-500
                            focus:ring-offset-2 focus:outline-none
                          "
                          @click="router.push('/settings')"
                        >
                          <span class="i-fluent-settings-20-regular"></span>
                          前往設定
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Welcome Message -->
                <div
                  v-if="messages.length === 0 && hasApiKey"
                  class="mb-4 flex justify-center"
                >
                  <div class="max-w-md rounded-lg bg-blue-50 p-4 text-center">
                    <h2 class="text-lg font-medium tracking-wider text-blue-900">
                      👋 歡迎使用查勤魔法 ( The Weasley Tracker )
                    </h2>
                    <p class="mt-2 text-sm tracking-wider text-blue-700">
                      您可以詢問同事的狀態，或告訴我您的狀態變化
                    </p>
                    <div
                      class="
                        mt-3 space-y-1 text-xs tracking-wider text-blue-600
                      "
                    >
                      <p>範例：「小王現在在做什麼？」</p>
                      <p>範例：「我要外出，下午3點回來」</p>
                    </div>
                  </div>
                </div>

                <!-- Chat Messages -->
                <div class="space-y-4">
                  <ChatMessage
                    v-for="message in messages"
                    :key="message.id"
                    :message="message"
                  />
                </div>
              </div>

              <!-- Chat Input Area -->
              <div class="my-4 flex-shrink-0">
                <ChatInput
                  v-if="hasApiKey"
                  :loading="isLoading"
                  @send-message="handleSendMessage"
                />
                <div
                  v-else
                  class="
                    rounded-lg border border-gray-200 bg-gray-50 p-4 text-center
                  "
                >
                  <p class="mb-2 text-sm text-gray-500">
                    請先設定 OpenAI API Key 以使用 AI 對話功能
                  </p>
                  <button
                    class="
                      inline-flex items-center gap-2 rounded-md bg-blue-600 px-3
                      py-2 text-sm font-medium text-white
                      hover:bg-blue-700
                      focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      focus:outline-none
                    "
                    @click="router.push('/settings')"
                  >
                    <span class="i-fluent-settings-20-regular"></span>
                    前往設定
                  </button>
                </div>
                <!-- MCP Status -->
                <div class="mt-2 flex justify-center">
                  <McpStatus />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar styles */
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-track-gray-100::-webkit-scrollbar-track {
  background-color: #f3f4f6;
  border-radius: 3px;
}

.scrollbar-thumb-gray-300::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 3px;
}

.scrollbar-thumb-gray-300::-webkit-scrollbar-thumb:hover {
  background-color: #9ca3af;
}
</style>
