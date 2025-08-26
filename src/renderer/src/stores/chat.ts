import type { ChatMessage } from '@shared/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
export const useChatStore = defineStore('chat', () => {

  const messages = ref<ChatMessage[]>([])
  const isTyping = ref(false)

  const conversationHistory = computed(() => messages.value)

  async function sendUserMessage(content: string) {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      content: content.trim(),
      type: 'user',
      timestamp: new Date(),
    }

    messages.value.push(userMessage)

    // Process AI response
    await processAIResponse(content)
  }

  async function processAIResponse(userInput: string) {
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

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

    // Remove typing indicator
    messages.value = messages.value.filter(msg => msg.id !== 'typing')
    isTyping.value = false

    // Generate AI response
    const response = await generateMockAIResponse(userInput)

    const aiMessage: ChatMessage = {
      id: crypto.randomUUID(),
      content: response,
      type: 'ai',
      timestamp: new Date(),
    }

    messages.value.push(aiMessage)
  }

  async function generateMockAIResponse(_userInput: string): Promise<string> {
    // Default responses
    const defaultResponses = [
      '我理解您的問題。您可以詢問同事的狀態，或告訴我您的狀態變化。',
      '您可以問我：「小王現在在做什麼？」或「我要外出，下午3點回來」',
      '我可以幫您查詢狀態或更新您的狀態。請告訴我您需要什麼幫助。',
    ]

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
  }



  function clearMessages() {
    messages.value = []
  }

  return {
    // State
    messages,
    isTyping,

    // Getters
    conversationHistory,

    // Actions
    sendUserMessage,
    clearMessages,
  }
})
