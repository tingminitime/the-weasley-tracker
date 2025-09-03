import type { AuthSession, LoginRequest, MockUser } from '@shared/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<MockUser | null>(null)
  const isLoggedIn = ref(false)
  const loginTime = ref<Date | null>(null)

  const isAuthenticated = computed(() => isLoggedIn.value && currentUser.value !== null)

  async function initialize() {
    try {
      const session: AuthSession = await window.api.getAuthSession()
      if (session.isLoggedIn && session.currentUserId) {
        const user = await window.api.getCurrentUser()
        if (user) {
          currentUser.value = user
          isLoggedIn.value = true
          loginTime.value = session.loginTime ? new Date(session.loginTime) : null

          // Initialize chat store for current user
          const chatStore = await import('../stores/chat.js')
          const chat = chatStore.useChatStore()
          chat.initializeChat(user.id)
        }
      }
    }
    catch (error) {
      console.error('Failed to initialize auth session:', error)
    }
  }

  async function login(userId: string) {
    try {
      const request: LoginRequest = { userId }
      const response = await window.api.login(request)

      if (response.success && response.user) {
        currentUser.value = response.user
        isLoggedIn.value = true
        loginTime.value = new Date()

        // Initialize chat store for new user
        const chatStore = await import('../stores/chat.js')
        const chat = chatStore.useChatStore()
        chat.initializeChat(response.user.id)

        return { success: true }
      }
      else {
        return { success: false, error: response.error || 'Login failed' }
      }
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async function logout() {
    try {
      // Clear current user's chat data before logging out
      if (currentUser.value) {
        const chatStore = await import('../stores/chat.js')
        const chat = chatStore.useChatStore()
        // Note: We don't clear chat data on logout, just disconnect the user
        chat.initializeChat(undefined) // Clear current user context
      }

      const response = await window.api.logout()
      if (response.success) {
        currentUser.value = null
        isLoggedIn.value = false
        loginTime.value = null
        return { success: true }
      }
      else {
        return { success: false, error: response.error || 'Logout failed' }
      }
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async function switchUser(userId: string) {
    // Store previous user for cleanup
    const previousUserId = currentUser.value?.id

    await logout()
    const loginResult = await login(userId)

    if (loginResult.success && previousUserId !== userId) {
      console.log(`Switched from user ${previousUserId} to user ${userId}`)
    }

    return loginResult
  }

  return {
    // State
    currentUser,
    isLoggedIn,
    loginTime,

    // Getters
    isAuthenticated,

    // Actions
    initialize,
    login,
    logout,
    switchUser,
  }
})
