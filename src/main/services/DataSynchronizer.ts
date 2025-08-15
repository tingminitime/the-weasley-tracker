import type { AttendanceRecord, CalendarEvent, DataOperationResult, UserStatus } from '@shared/types'
import type { DataStore } from '../stores/DataStore'
import type { StatusManager } from './StatusManager'
import { TimeUtils } from '../utils/TimeUtils'

export interface SyncOptions {
  forceRefresh?: boolean
  userIds?: string[]
  syncAttendance?: boolean
  syncCalendar?: boolean
}

export interface SyncResult {
  attendanceRecordsSynced: number
  calendarEventsSynced: number
  userStatusesUpdated: number
  errors: string[]
}

export class DataSynchronizer {
  constructor(
    private dataStore: DataStore,
    private statusManager: StatusManager,
  ) {}

  async syncAllData(options: SyncOptions = {}): Promise<DataOperationResult<SyncResult>> {
    try {
      const result: SyncResult = {
        attendanceRecordsSynced: 0,
        calendarEventsSynced: 0,
        userStatusesUpdated: 0,
        errors: [],
      }

      const shouldSyncAttendance = options.syncAttendance !== false
      const shouldSyncCalendar = options.syncCalendar !== false

      if (shouldSyncAttendance) {
        const attendanceResult = await this.syncAttendanceData(options)
        if (attendanceResult.success && attendanceResult.data) {
          result.attendanceRecordsSynced = attendanceResult.data
        }
        else {
          result.errors.push(`Attendance sync failed: ${attendanceResult.error}`)
        }
      }

      if (shouldSyncCalendar) {
        const calendarResult = await this.syncCalendarData(options)
        if (calendarResult.success && calendarResult.data) {
          result.calendarEventsSynced = calendarResult.data
        }
        else {
          result.errors.push(`Calendar sync failed: ${calendarResult.error}`)
        }
      }

      const statusResult = await this.refreshUserStatuses(options)
      if (statusResult.success && statusResult.data) {
        result.userStatusesUpdated = statusResult.data
      }
      else {
        result.errors.push(`Status refresh failed: ${statusResult.error}`)
      }

      return {
        success: result.errors.length === 0,
        data: result,
        error: result.errors.length > 0 ? result.errors.join('; ') : undefined,
      }
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async syncAttendanceData(options: SyncOptions = {}): Promise<DataOperationResult<number>> {
    try {
      // In a real application, this would fetch from an external attendance system
      // For now, we'll simulate by generating fresh attendance data for today

      if (!options.forceRefresh) {
        const existingRecords = this.dataStore.getAttendanceRecordsByDate(TimeUtils.getTodayDateString())
        if (existingRecords.length > 0) {
          return { success: true, data: 0 } // No sync needed
        }
      }

      const users = this.dataStore.getUsers()
      const usersToSync = options.userIds
        ? users.filter(user => options.userIds!.includes(user.id))
        : users

      let syncedCount = 0

      for (const user of usersToSync) {
        const mockRecord = this.generateTodayAttendanceForUser(user.id)
        if (mockRecord) {
          const result = this.dataStore.addAttendanceRecord(mockRecord)
          if (result.success) {
            syncedCount++
          }
        }
      }

      return { success: true, data: syncedCount }
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async syncCalendarData(options: SyncOptions = {}): Promise<DataOperationResult<number>> {
    try {
      // In a real application, this would fetch from an external calendar system
      // For now, we'll simulate by generating fresh calendar events for today

      if (!options.forceRefresh) {
        const today = new Date()
        const existingEvents = this.dataStore.getCalendarEvents()
          .filter(event => TimeUtils.isSameDay(event.startTime, today))

        if (existingEvents.length > 0) {
          return { success: true, data: 0 } // No sync needed
        }
      }

      const users = this.dataStore.getUsers()
      const usersToSync = options.userIds
        ? users.filter(user => options.userIds!.includes(user.id))
        : users

      let syncedCount = 0

      for (const user of usersToSync) {
        const mockEvents = this.generateTodayCalendarForUser(user.id)
        for (const event of mockEvents) {
          const result = this.dataStore.addCalendarEvent(event)
          if (result.success) {
            syncedCount++
          }
        }
      }

      return { success: true, data: syncedCount }
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async refreshUserStatuses(options: SyncOptions = {}): Promise<DataOperationResult<number>> {
    try {
      const users = this.dataStore.getUsers()
      const usersToRefresh = options.userIds
        ? users.filter(user => options.userIds!.includes(user.id))
        : users

      let refreshedCount = 0

      for (const user of usersToRefresh) {
        const result = await this.statusManager.refreshUserStatus(user.id)
        if (result.success) {
          refreshedCount++
        }
      }

      return { success: true, data: refreshedCount }
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async scheduledSync(): Promise<DataOperationResult<SyncResult>> {
    // This would be called periodically (e.g., every 15 minutes)
    console.log('Running scheduled data synchronization...')

    try {
      // Clean up expired statuses first
      await this.statusManager.cleanupExpiredStatuses()

      // Sync with minimal options - only update if needed
      const result = await this.syncAllData({
        forceRefresh: false,
        syncAttendance: true,
        syncCalendar: true,
      })

      console.log('Scheduled sync completed:', result.data)
      return result
    }
    catch (error) {
      console.error('Scheduled sync failed:', error)
      return { success: false, error: String(error) }
    }
  }

  async handleAttendanceUpdate(record: AttendanceRecord): Promise<DataOperationResult<UserStatus>> {
    try {
      // This would be called when attendance data changes externally
      const existingRecords = this.dataStore.getAttendanceRecordsByUserId(record.userId)
      const existingRecord = existingRecords.find(r => r.id === record.id)

      if (existingRecord) {
        // Update existing record
        const allRecords = this.dataStore.getAttendanceRecords()
        const updatedRecords = allRecords.map(r => r.id === record.id ? record : r)
        this.dataStore.setAttendanceRecords(updatedRecords)
      }
      else {
        // Add new record
        this.dataStore.addAttendanceRecord(record)
      }

      // Refresh the user's status
      const statusResult = await this.statusManager.refreshUserStatus(record.userId)
      return statusResult
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async handleCalendarUpdate(event: CalendarEvent): Promise<DataOperationResult<UserStatus>> {
    try {
      // This would be called when calendar data changes externally
      const existingEvents = this.dataStore.getCalendarEventsByUserId(event.userId)
      const existingEvent = existingEvents.find(e => e.id === event.id)

      if (existingEvent) {
        // Update existing event
        const allEvents = this.dataStore.getCalendarEvents()
        const updatedEvents = allEvents.map(e => e.id === event.id ? event : e)
        this.dataStore.setCalendarEvents(updatedEvents)
      }
      else {
        // Add new event
        this.dataStore.addCalendarEvent(event)
      }

      // Refresh the user's status
      const statusResult = await this.statusManager.refreshUserStatus(event.userId)
      return statusResult
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  }

  private generateTodayAttendanceForUser(userId: string): AttendanceRecord | null {
    const user = this.dataStore.getUserById(userId)
    if (!user)
      return null

    const today = new Date()
    const todayStr = TimeUtils.getTodayDateString()

    // Check if record already exists for today
    const existingRecord = this.dataStore.getAttendanceRecordsByUserId(userId)
      .find(record => record.date === todayStr)

    if (existingRecord)
      return null

    const startTime = TimeUtils.parseTime(user.workSchedule.startTime, today)
    const endTime = TimeUtils.parseTime(user.workSchedule.endTime, today)

    // Simulate different attendance scenarios
    const scenarios = ['checked_in', 'wfh', 'on_leave', 'late']
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)]

    switch (scenario) {
      case 'checked_in': {
        return {
          id: `att-${userId}-${todayStr}-${Date.now()}`,
          userId,
          checkIn: new Date(startTime.getTime() + Math.random() * 30 * 60000), // Within 30 minutes
          workType: 'office',
          date: todayStr,
          status: 'on_duty',
          startTime,
          endTime,
        }
      }

      case 'wfh': {
        return {
          id: `att-${userId}-${todayStr}-${Date.now()}`,
          userId,
          checkIn: new Date(startTime.getTime() + Math.random() * 15 * 60000), // Within 15 minutes
          workType: 'wfh',
          date: todayStr,
          status: 'wfh',
          startTime,
          endTime,
        }
      }

      case 'on_leave': {
        return {
          id: `att-${userId}-${todayStr}-${Date.now()}`,
          userId,
          workType: 'office',
          date: todayStr,
          status: 'on_leave',
          startTime,
          endTime,
        }
      }

      case 'late': {
        const now = new Date()
        if (now > startTime) {
          return {
            id: `att-${userId}-${todayStr}-${Date.now()}`,
            userId,
            workType: 'office',
            date: todayStr,
            status: 'off_duty', // Will be updated when they check in
            startTime,
            endTime,
          }
        }
        return null
      }

      default:
        return null
    }
  }

  private generateTodayCalendarForUser(userId: string): CalendarEvent[] {
    const today = new Date()
    const events: CalendarEvent[] = []

    // Generate 0-2 meetings per user
    const numMeetings = Math.floor(Math.random() * 3) // 0, 1, or 2
    const meetingTitles = [
      'Daily Standup',
      'Sprint Planning',
      'Client Review',
      'Team Sync',
      'Product Demo',
      'Code Review',
    ]

    for (let i = 0; i < numMeetings; i++) {
      const startHour = 9 + Math.floor(Math.random() * 8) // 9 AM to 5 PM
      const startMinute = Math.floor(Math.random() * 4) * 15 // 0, 15, 30, or 45
      const duration = [30, 60, 90][Math.floor(Math.random() * 3)] // 30, 60, or 90 minutes

      const startTime = new Date(today)
      startTime.setHours(startHour, startMinute, 0, 0)

      const endTime = new Date(startTime.getTime() + duration * 60000)

      const now = new Date()
      let status: 'scheduled' | 'ongoing' | 'completed' | 'canceled'

      if (endTime < now) {
        status = 'completed'
      }
      else if (startTime <= now && now <= endTime) {
        status = 'ongoing'
      }
      else {
        status = 'scheduled'
      }

      events.push({
        id: `event-${userId}-${i}-${today.getTime()}-${Date.now()}`,
        userId,
        title: meetingTitles[Math.floor(Math.random() * meetingTitles.length)],
        startTime,
        endTime,
        status,
        eventStatus: 'meeting',
      })
    }

    return events
  }

  async getLastSyncInfo(): Promise<DataOperationResult<{ lastSyncTime: Date | null, recordCount: number }>> {
    try {
      // In a real implementation, this would track actual sync timestamps
      const attendanceRecords = this.dataStore.getAttendanceRecords()
      const todayRecords = attendanceRecords.filter(record =>
        record.date === TimeUtils.getTodayDateString(),
      )

      return {
        success: true,
        data: {
          lastSyncTime: todayRecords.length > 0 ? new Date() : null,
          recordCount: todayRecords.length,
        },
      }
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async validateDataConsistency(): Promise<DataOperationResult<{ isConsistent: boolean, issues: string[] }>> {
    try {
      const issues: string[] = []
      const users = this.dataStore.getUsers()
      const userStatuses = this.dataStore.getUserStatuses()

      // Check if all users have status records
      for (const user of users) {
        const status = userStatuses.find(s => s.userId === user.id)
        if (!status) {
          issues.push(`User ${user.name} (${user.id}) has no status record`)
        }
      }

      // Check for orphaned status records
      for (const status of userStatuses) {
        const user = users.find(u => u.id === status.userId)
        if (!user) {
          issues.push(`Status record for non-existent user ${status.userId}`)
        }
      }

      // Check for expired time slots that should be cleaned up
      const now = new Date()
      for (const status of userStatuses) {
        const expiredSlots = status.timeSlots.filter(slot =>
          TimeUtils.isExpired(slot.expiresAt, now),
        )
        if (expiredSlots.length > 0) {
          issues.push(`User ${status.name} has ${expiredSlots.length} expired time slots`)
        }
      }

      return {
        success: true,
        data: {
          isConsistent: issues.length === 0,
          issues,
        },
      }
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  }
}
