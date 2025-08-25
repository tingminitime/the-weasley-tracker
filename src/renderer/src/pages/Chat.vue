<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ChatInput from '../components/ChatInput.vue'
import ChatMessage from '../components/ChatMessage.vue'
import UserMenu from '../components/UserMenu.vue'
import { useAuthStore } from '../stores/auth'
import { useChatStore } from '../stores/chat'
import { useDataStore } from '../stores/data'

const router = useRouter()
const authStore = useAuthStore()
const dataStore = useDataStore()
const chatStore = useChatStore()

const messagesContainerRef = ref<HTMLElement>()

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
})

async function handleSendMessage(message: string) {
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
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-gray-50">
    <div class="flex w-full flex-col">
      <!-- Header -->
      <header
        class="z-10 flex-shrink-0 border-b border-gray-200 bg-white shadow-lg"
      >
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="flex h-16 items-center justify-between">
            <div class="flex items-center">
              <h1
                class="
                  flex items-center gap-x-2 text-2xl font-extrabold
                  text-gray-900
                "
              >
                <span
                  class="i-material-symbols-alarm-on-rounded text-emerald-500"
                ></span>
                The Weasley Tracker
              </h1>
            </div>

            <div class="flex items-center space-x-4">
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

              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <!-- Chat Container -->
      <main class="flex flex-1 flex-col overflow-hidden">
        <!-- Messages Area -->
        <div class="flex-1 overflow-hidden">
          <div
            class="mx-auto flex h-full max-w-4xl flex-col px-4 sm:px-6 lg:px-8"
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
                <!-- Welcome Message -->
                <div
                  v-if="messages.length === 0"
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
              <div class="mt-4 flex-shrink-0">
                <ChatInput
                  :loading="isLoading"
                  @send-message="handleSendMessage"
                />
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
