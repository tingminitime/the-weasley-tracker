import type { MockUser, UserStatus } from '@shared/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useDataStore = defineStore('data', () => {
  const users = ref<MockUser[]>([])
  const userStatuses = ref<UserStatus[]>([])
  const isInitialized = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const userStatusMap = computed(() => {
    const map = new Map<string, UserStatus>()
    userStatuses.value.forEach((status) => {
      map.set(status.userId, status)
    })
    return map
  })

  async function initialize() {
    if (isInitialized.value)
      return

    loading.value = true
    error.value = null

    try {
      // Check if data already exists
      const existingUsers = await window.api.getUsers()

      if (existingUsers.length === 0) {
        // Initialize with mock data
        const result = await window.api.initializeMockData()
        if (!result.success) {
          throw new Error(result.error || 'Failed to initialize mock data')
        }
      }
      else {
        // Data exists, only check for cross-day reset (don't refresh same-day statuses)
        const crossDayResult = await window.api.checkCrossDayReset()
        if (crossDayResult.needsReset) {
          // Cross-day reset needed, regenerate mock data
          const result = await window.api.initializeMockData()
          if (!result.success) {
            console.warn('Failed to regenerate mock data for cross-day reset:', result.error)
          }
        }
      }

      // Load all data
      await loadAllData()

      isInitialized.value = true
    }
    catch (err) {
      error.value = String(err)
      console.error('Failed to initialize data store:', err)
    }
    finally {
      loading.value = false
    }
  }

  async function loadAllData() {
    try {
      const [usersData, statusesData] = await Promise.all([
        window.api.getUsers(),
        window.api.getUserStatuses(),
      ])

      users.value = usersData
      userStatuses.value = statusesData
    }
    catch (err) {
      error.value = String(err)
      throw err
    }
  }

  async function refreshData() {
    loading.value = true
    error.value = null

    try {
      await loadAllData()
    }
    catch (err) {
      error.value = String(err)
      console.error('Failed to refresh data:', err)
    }
    finally {
      loading.value = false
    }
  }

  async function updateUserStatus(status: UserStatus) {
    try {
      const result = await window.api.updateUserStatus(status)
      if (result.success) {
        // Update local state
        const index = userStatuses.value.findIndex(s => s.userId === status.userId)
        if (index >= 0) {
          userStatuses.value[index] = status
        }
        else {
          userStatuses.value.push(status)
        }
        return { success: true }
      }
      else {
        return { success: false, error: result.error || 'Failed to update status' }
      }
    }
    catch (err) {
      return { success: false, error: String(err) }
    }
  }

  function getUserById(userId: string): MockUser | undefined {
    return users.value.find(user => user.id === userId)
  }

  function getUserStatusById(userId: string): UserStatus | undefined {
    return userStatusMap.value.get(userId)
  }

  function getUsersWithStatus() {
    return users.value.map((user) => {
      const status = getUserStatusById(user.id)

      return {
        user,
        status,
      }
    })
  }

  async function resetData() {
    loading.value = true
    error.value = null

    try {
      const result = await window.api.resetData()
      if (result.success) {
        users.value = []
        userStatuses.value = []
        isInitialized.value = false
        return { success: true }
      }
      else {
        error.value = result.error || 'Failed to reset data'
        return { success: false, error: error.value }
      }
    }
    catch (err) {
      error.value = String(err)
      return { success: false, error: error.value }
    }
    finally {
      loading.value = false
    }
  }

  async function updateUserTag(userId: string, tag: string) {
    try {
      const result = await window.api.updateUserTag(userId, tag)
      if (result.success) {
        // Update local state
        const userIndex = users.value.findIndex(u => u.id === userId)
        if (userIndex >= 0) {
          users.value[userIndex] = { ...users.value[userIndex], tag }
        }
        return { success: true }
      }
      else {
        return { success: false, error: result.error || 'Failed to update tag' }
      }
    }
    catch (err) {
      return { success: false, error: String(err) }
    }
  }

  async function getUserCustomTags(userId: string) {
    try {
      return await window.api.getUserCustomTags(userId)
    }
    catch (err) {
      console.error('Failed to get user custom tags:', err)
      return []
    }
  }

  async function addUserCustomTag(userId: string, tag: string) {
    try {
      const result = await window.api.addUserCustomTag(userId, tag)
      if (result.success) {
        // Update local state
        const userIndex = users.value.findIndex(u => u.id === userId)
        if (userIndex >= 0) {
          const currentTags = users.value[userIndex].customTags || []
          users.value[userIndex] = {
            ...users.value[userIndex],
            customTags: [...currentTags, tag],
          }
        }
        return { success: true }
      }
      else {
        return { success: false, error: result.error || 'Failed to add custom tag' }
      }
    }
    catch (err) {
      return { success: false, error: String(err) }
    }
  }

  async function updateUserCustomTag(userId: string, oldTag: string, newTag: string) {
    try {
      const result = await window.api.updateUserCustomTag(userId, oldTag, newTag)
      if (result.success) {
        // Update local state
        const userIndex = users.value.findIndex(u => u.id === userId)
        if (userIndex >= 0) {
          const currentTags = users.value[userIndex].customTags || []
          const tagIndex = currentTags.indexOf(oldTag)
          if (tagIndex >= 0) {
            const updatedTags = [...currentTags]
            updatedTags[tagIndex] = newTag
            users.value[userIndex] = {
              ...users.value[userIndex],
              customTags: updatedTags,
              tag: users.value[userIndex].tag === oldTag ? newTag : users.value[userIndex].tag,
            }
          }
        }
        return { success: true }
      }
      else {
        return { success: false, error: result.error || 'Failed to update custom tag' }
      }
    }
    catch (err) {
      return { success: false, error: String(err) }
    }
  }

  async function deleteUserCustomTag(userId: string, tag: string) {
    try {
      const result = await window.api.deleteUserCustomTag(userId, tag)
      if (result.success) {
        // Update local state
        const userIndex = users.value.findIndex(u => u.id === userId)
        if (userIndex >= 0) {
          const currentTags = users.value[userIndex].customTags || []
          users.value[userIndex] = {
            ...users.value[userIndex],
            customTags: currentTags.filter(t => t !== tag),
            tag: users.value[userIndex].tag === tag ? undefined : users.value[userIndex].tag,
          }
        }
        return { success: true }
      }
      else {
        return { success: false, error: result.error || 'Failed to delete custom tag' }
      }
    }
    catch (err) {
      return { success: false, error: String(err) }
    }
  }

  return {
    // State
    users,
    userStatuses,
    isInitialized,
    loading,
    error,

    // Computed
    userStatusMap,

    // Actions
    initialize,
    loadAllData,
    refreshData,
    updateUserStatus,
    resetData,
    updateUserTag,
    getUserCustomTags,
    addUserCustomTag,
    updateUserCustomTag,
    deleteUserCustomTag,

    // Getters
    getUserById,
    getUserStatusById,
    getUsersWithStatus,
  }
})
