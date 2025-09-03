<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useChatStore } from '../stores/chat'

interface McpConnectionStatus {
  isConnected: boolean
  hasLLMCapability: boolean
  serverInfo: {
    name: string
    version: string
  }
}

const chatStore = useChatStore()
const connectionStatus = ref<McpConnectionStatus>({
  isConnected: false,
  hasLLMCapability: false,
  serverInfo: { name: 'unknown', version: 'unknown' },
})

onMounted(async () => {
  try {
    connectionStatus.value = await chatStore.getMcpConnectionStatus()
  }
  catch (error) {
    console.error('Failed to get MCP status:', error)
  }
})
</script>

<template>
  <div class="px-2 py-1 text-xs">
    <div class="flex items-center gap-2">
      <div
        class="h-2 w-2 rounded-full"
        :class="[connectionStatus.isConnected ? `bg-green-500` : `bg-red-500`]"
      ></div>
      <span
        class="font-medium"
        :class="[connectionStatus.isConnected ? `
          text-green-700
          dark:text-green-400
        ` : `text-red-700 dark:text-red-400`]"
      >
        {{ connectionStatus.isConnected ? 'MCP 已連接' : 'MCP 未連接' }}
      </span>
      <div
        v-if="connectionStatus.isConnected"
        class="text-xs opacity-75"
      >
        <div
          v-show="connectionStatus.hasLLMCapability"
          class="ml-2 flex items-center gap-x-0.5"
        >
          <span class="i-fluent-sparkle-20-filled text-lg text-emerald-500"></span>
          <span>AI 可用</span>
        </div>
        <div v-show="!connectionStatus.hasLLMCapability">
          <span>⚠️ 需要 API Key</span>
        </div>
      </div>
    </div>
  </div>
</template>
