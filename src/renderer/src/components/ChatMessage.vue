<script setup lang="ts">
interface ChatMessage {
  id: string
  content: string
  type: 'user' | 'ai'
  timestamp: Date
  isTyping?: boolean
}

const props = defineProps<{
  message: ChatMessage
}>()

function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="mb-4">
    <!-- User Message -->
    <div
      v-if="message.type === 'user'"
      class="flex justify-end"
    >
      <div
        class="
          max-w-xs rounded-lg bg-indigo-600 px-4 py-2 text-white
          lg:max-w-md
        "
      >
        <p class="text-sm">
          {{ message.content }}
        </p>
        <div class="mt-1 text-right text-xs text-indigo-200">
          {{ formatTime(message.timestamp) }}
        </div>
      </div>
    </div>

    <!-- AI Message -->
    <div
      v-else
      class="flex justify-start"
    >
      <div class="flex max-w-xs space-x-2 lg:max-w-md">
        <!-- AI Avatar -->
        <div
          class="
            flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full
            bg-gray-200 text-gray-600
          "
        >
          🤖
        </div>

        <!-- Message Content -->
        <div class="rounded-lg bg-gray-100 px-4 py-2">
          <!-- Typing Indicator -->
          <div
            v-if="message.isTyping"
            class="flex items-center space-x-1"
          >
            <div class="flex space-x-1">
              <div
                class="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                style="animation-delay: 0ms"
              ></div>
              <div
                class="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                style="animation-delay: 150ms"
              ></div>
              <div
                class="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                style="animation-delay: 300ms"
              ></div>
            </div>
            <span class="ml-2 text-xs text-gray-500">思考中...</span>
          </div>

          <!-- Actual Message -->
          <div v-else>
            <p class="text-sm text-gray-800">
              {{ message.content }}
            </p>
            <div class="mt-1 text-xs text-gray-500">
              {{ formatTime(message.timestamp) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom animation for typing indicator */
@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}
</style>
