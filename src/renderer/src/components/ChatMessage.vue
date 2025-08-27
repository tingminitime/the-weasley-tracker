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
    hour12: false,
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
      class="flex justify-end gap-x-2"
    >
      <div class="order-2">
        <div
          class="max-w-xs rounded-lg bg-emerald-500/30 px-4 py-2 lg:max-w-md"
        >
          <p class="text-base">
            {{ message.content }}
          </p>
        </div>
      </div>
      <div class="order-1 mt-1 self-end text-xs text-gray-600">
        {{ formatTime(message.timestamp) }}
      </div>
    </div>

    <!-- AI Message -->
    <div
      v-else
      class="flex justify-start gap-x-2"
    >
      <div class="flex justify-start">
        <div class="flex max-w-xs space-x-2 lg:max-w-md">
          <!-- AI Avatar -->
          <div
            class="flex h-8 w-8 flex-shrink-0 items-center justify-center"
          >
            <span
              class="
                i-fluent-clock-sparkle-16-filled size-full text-emerald-500
              "
            ></span>
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
                  class="size-1.5 animate-bounce rounded-full bg-gray-400"
                  style="animation-delay: 0ms"
                ></div>
                <div
                  class="size-1.5 animate-bounce rounded-full bg-gray-400"
                  style="animation-delay: 150ms"
                ></div>
                <div
                  class="size-1.5 animate-bounce rounded-full bg-gray-400"
                  style="animation-delay: 300ms"
                ></div>
              </div>
              <span class="ml-2 text-sm text-gray-500">思考中 ...</span>
            </div>

            <!-- Actual Message -->
            <div v-else>
              <p class="text-base text-gray-800">
                {{ message.content }}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="!message.isTyping"
        class="mt-1 self-end text-right text-xs text-gray-500"
      >
        {{ formatTime(message.timestamp) }}
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
