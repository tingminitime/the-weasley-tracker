import type { ChatMessage } from '@shared/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useChatStore = defineStore('chat', () => {
  const messages = ref<ChatMessage[]>([])
  const isTyping = ref(false)
  const currentUserId = ref<string | null>(null)

  const conversationHistory = computed(() => messages.value)

  // Get user-specific localStorage keys
  function getStorageKeys(userId: string) {
    return {
      messages: `chatMessages_${userId}`,
      sessionId: `chatSessionId_${userId}`,
      appSession: 'appSessionId', // Track app restarts
    }
  }

  // Check if this is a fresh app start (for cleanup)
  function isAppRestart(): boolean {
    const currentAppSession = Date.now().toString()
    const storedAppSession = window.localStorage.getItem('appSessionId')

    if (!storedAppSession) {
      window.localStorage.setItem('appSessionId', currentAppSession)
      return true // First time app start
    }

    // Check if session is older than 5 minutes (app restart)
    const sessionAge = Date.now() - Number.parseInt(storedAppSession)
    const isRestart = sessionAge > 5 * 60 * 1000

    if (isRestart) {
      window.localStorage.setItem('appSessionId', currentAppSession)
    }

    return isRestart
  }

  // Initialize chat store with persisted messages for specific user
  function initializeChat(userId?: string) {
    // Clear everything on app restart
    if (isAppRestart()) {
      clearAllUserChats()
      console.log('App restarted - cleared all conversation data')
    }

    if (!userId) {
      messages.value = []
      currentUserId.value = null
      return
    }

    // If user changed, clear current messages and load new user's data
    if (currentUserId.value && currentUserId.value !== userId) {
      messages.value = []
    }

    currentUserId.value = userId
    const keys = getStorageKeys(userId)

    try {
      const storedMessages = window.localStorage.getItem(keys.messages)
      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages)
        messages.value = parsedMessages
          .filter((msg: any) => !msg.isTyping) // Exclude typing indicators
          .map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            type: msg.type,
            timestamp: new Date(msg.timestamp),
            isTyping: false,
          }))
        console.log(`Loaded ${messages.value.length} messages for user ${userId}`)
      }
      else {
        messages.value = []
      }
    }
    catch (error) {
      console.error(`Failed to load chat messages for user ${userId}:`, error)
      messages.value = []
    }
  }

  // Persist messages for current user
  function persistMessages() {
    if (!currentUserId.value)
      return

    const keys = getStorageKeys(currentUserId.value)
    const messagesToStore = messages.value.slice(-50) // Keep last 50 messages

    window.localStorage.setItem(keys.messages, JSON.stringify(messagesToStore.map(msg => ({
      id: msg.id,
      content: msg.content,
      type: msg.type,
      timestamp: msg.timestamp.toISOString(),
      isTyping: msg.isTyping,
    }))))
  }

  async function sendUserMessage(content: string) {
    if (!currentUserId.value) {
      console.error('Cannot send message: no current user')
      return
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      content: content.trim(),
      type: 'user',
      timestamp: new Date(),
    }

    messages.value.push(userMessage)
    persistMessages()

    // Process AI response
    await processAIResponse(content)
  }

  async function processAIResponse(userInput: string) {
    if (!currentUserId.value) {
      console.error('Cannot process AI response: no current user')
      return
    }

    // Show typing indicator
    isTyping.value = true
    const typingMessage: ChatMessage = {
      id: 'typing',
      content: '',
      type: 'ai',
      timestamp: new Date(),
      isTyping: true,
    }
    messages.value.push(typingMessage)

    try {
      // Generate user-specific session ID
      const keys = getStorageKeys(currentUserId.value)
      let sessionId = window.localStorage.getItem(keys.sessionId)

      if (!sessionId) {
        sessionId = `${currentUserId.value}-${Date.now()}`
        window.localStorage.setItem(keys.sessionId, sessionId)
      }

      // Prepare conversation history (last 20 messages)
      const conversationHistory = messages.value
        .filter(msg => !msg.isTyping) // Exclude typing indicators
        .slice(-20) // Keep last 20 messages
        .map(msg => ({
          id: msg.id,
          content: msg.content,
          type: msg.type,
          timestamp: msg.timestamp.toISOString(),
        }))

      // Process message through MCP service with user-specific context
      const response = await window.electron.ipcRenderer.invoke('mcp:processMessage', {
        message: userInput,
        sessionId,
        userId: currentUserId.value,
        conversationHistory,
      })

      // Remove typing indicator
      messages.value = messages.value.filter(msg => msg.id !== 'typing')
      isTyping.value = false

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        content: response,
        type: 'ai',
        timestamp: new Date(),
      }

      messages.value.push(aiMessage)
      persistMessages()
    }
    catch (error) {
      // Handle error
      messages.value = messages.value.filter(msg => msg.id !== 'typing')
      isTyping.value = false

      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        content: `抱歉，處理您的請求時發生錯誤：${error instanceof Error ? error.message : '未知錯誤'}`,
        type: 'ai',
        timestamp: new Date(),
      }

      messages.value.push(errorMessage)
      persistMessages()
    }
  }

  async function getMcpConnectionStatus() {
    try {
      return await window.electron.ipcRenderer.invoke('mcp:getConnectionStatus')
    }
    catch (error) {
      console.error('Failed to get MCP connection status:', error)
      return {
        isConnected: false,
        hasLLMCapability: false,
        serverInfo: { name: 'unknown', version: 'unknown' },
      }
    }
  }

  async function checkApiKeyStatus() {
    try {
      return await window.electron.ipcRenderer.invoke('settings:hasApiKey')
    }
    catch (error) {
      console.error('Failed to check API key status:', error)
      return false
    }
  }

  function clearCurrentUserChat() {
    if (!currentUserId.value)
      return

    const keys = getStorageKeys(currentUserId.value)

    // Clear UI state
    messages.value = []

    // Clear persisted data for current user
    window.localStorage.removeItem(keys.messages)
    window.localStorage.removeItem(keys.sessionId)

    // Clear conversation context on server side for current user
    window.electron.ipcRenderer.invoke('mcp:clearContext', `${currentUserId.value}-*`).catch(console.error)

    console.log(`Cleared chat for user: ${currentUserId.value}`)
  }

  function clearAllUserChats() {
    // Clear UI state
    messages.value = []

    // Get all localStorage keys and remove chat-related ones
    const keysToRemove: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key && (key.startsWith('chatMessages_') || key.startsWith('chatSessionId_'))) {
        keysToRemove.push(key)
      }
    }

    keysToRemove.forEach(key => window.localStorage.removeItem(key))

    // Clear all conversation contexts on server side
    window.electron.ipcRenderer.invoke('mcp:clearContext').catch(console.error)

    console.log('Cleared all user chats')
  }

  // Legacy clearMessages for backwards compatibility
  function clearMessages() {
    clearCurrentUserChat()
  }

  return {
    // State
    messages,
    isTyping,
    currentUserId,

    // Getters
    conversationHistory,

    // Actions
    sendUserMessage,
    clearMessages, // Keep for backwards compatibility
    clearCurrentUserChat,
    clearAllUserChats,
    getMcpConnectionStatus,
    checkApiKeyStatus,
    initializeChat,
  }
})
