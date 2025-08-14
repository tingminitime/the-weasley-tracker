import type { AttendanceRecord, CalendarEvent, MockUser, UserStatus } from '@shared/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useDataStore = defineStore('data', () => {
  const users = ref<MockUser[]>([])
  const userStatuses = ref<UserStatus[]>([])
  const attendanceRecords = ref<AttendanceRecord[]>([])
  const calendarEvents = ref<CalendarEvent[]>([])
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

  const attendanceByUser = computed(() => {
    const map = new Map<string, AttendanceRecord[]>()
    attendanceRecords.value.forEach((record) => {
      if (!map.has(record.userId)) {
        map.set(record.userId, [])
      }
      map.get(record.userId)!.push(record)
    })
    return map
  })

  const calendarByUser = computed(() => {
    const map = new Map<string, CalendarEvent[]>()
    calendarEvents.value.forEach((event) => {
      if (!map.has(event.userId)) {
        map.set(event.userId, [])
      }
      map.get(event.userId)!.push(event)
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
      const [usersData, statusesData, attendanceData, calendarData] = await Promise.all([
        window.api.getUsers(),
        window.api.getUserStatuses(),
        window.api.getAttendanceRecords(),
        window.api.getCalendarEvents(),
      ])

      users.value = usersData
      userStatuses.value = statusesData
      attendanceRecords.value = attendanceData
      calendarEvents.value = calendarData
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

  function getAttendanceByUserId(userId: string): AttendanceRecord[] {
    return attendanceByUser.value.get(userId) || []
  }

  function getCalendarByUserId(userId: string): CalendarEvent[] {
    return calendarByUser.value.get(userId) || []
  }

  function getUsersWithStatus() {
    return users.value.map((user) => {
      const status = getUserStatusById(user.id)
      const attendance = getAttendanceByUserId(user.id)
      const calendar = getCalendarByUserId(user.id)

      return {
        user,
        status,
        attendance,
        calendar,
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
        attendanceRecords.value = []
        calendarEvents.value = []
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

  return {
    // State
    users,
    userStatuses,
    attendanceRecords,
    calendarEvents,
    isInitialized,
    loading,
    error,

    // Computed
    userStatusMap,
    attendanceByUser,
    calendarByUser,

    // Actions
    initialize,
    loadAllData,
    refreshData,
    updateUserStatus,
    resetData,

    // Getters
    getUserById,
    getUserStatusById,
    getAttendanceByUserId,
    getCalendarByUserId,
    getUsersWithStatus,
  }
})
