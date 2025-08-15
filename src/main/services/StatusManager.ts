import type {
  DataOperationResult,
  StatusType,
  TimeSlot,
  UserStatus,
} from '@shared/types'
import type { DataStore } from '../stores/DataStore'
import type { StatusResolutionContext } from './StatusResolver'
import { TimeUtils } from '../utils/TimeUtils'
import { StatusResolver } from './StatusResolver'

export interface StatusUpdateRequest {
  userId: string
  status: StatusType
  statusDetail?: string
  startTime?: Date
  endTime?: Date
  duration?: number // Duration in minutes
}

export interface BulkStatusQuery {
  userIds?: string[]
  statusTypes?: StatusType[]
  includeDetails?: boolean
}

export class StatusManager {
  constructor(private dataStore: DataStore) {}

  async updateUserStatus(request: StatusUpdateRequest): Promise<DataOperationResult<UserStatus>> {
    try {
      const user = this.dataStore.getUserById(request.userId)
      if (!user) {
        return { success: false, error: 'User not found' }
      }

      const now = new Date()
      const startTime = request.startTime || now
      let endTime = request.endTime

      if (!endTime && request.duration) {
        endTime = new Date(startTime.getTime() + request.duration * 60000)
      }

      if (!endTime) {
        endTime = TimeUtils.calculateExpirationTime(request.status, user, startTime)
      }

      const validation = StatusResolver.validateStatusTransition(
        'on_duty', // We don't track previous status for now
        request.status,
        user,
        startTime,
      )

      if (!validation.valid) {
        return { success: false, error: validation.reason }
      }

      const newTimeSlot = StatusResolver.createAIModifiedTimeSlot(
        request.status,
        request.statusDetail,
        startTime,
        endTime,
        user,
        now,
      )

      const existingStatus = this.dataStore.getUserStatusById(request.userId)
      const existingTimeSlots = existingStatus ? existingStatus.timeSlots : []

      const cleanedTimeSlots = StatusResolver.removeConflictingTimeSlots(
        existingTimeSlots,
        newTimeSlot,
      )

      const updatedTimeSlots = [...cleanedTimeSlots, newTimeSlot]

      const context: StatusResolutionContext = {
        user,
        currentTime: now,
        attendanceRecords: this.dataStore.getAttendanceRecordsByUserId(request.userId),
        calendarEvents: this.dataStore.getCalendarEventsByUserId(request.userId),
        existingTimeSlots: updatedTimeSlots,
      }

      const resolution = StatusResolver.resolveUserStatus(context)

      const updatedStatus: UserStatus = {
        userId: request.userId,
        name: user.name,
        currentStatus: resolution.currentStatus,
        statusDetail: resolution.statusDetail,
        lastUpdated: resolution.lastUpdated,
        expiresAt: resolution.expiresAt,
        timeSlots: resolution.timeSlots,
      }

      const result = this.dataStore.updateUserStatus(updatedStatus)
      return result
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async refreshUserStatus(userId: string): Promise<DataOperationResult<UserStatus>> {
    try {
      const user = this.dataStore.getUserById(userId)
      if (!user) {
        return { success: false, error: 'User not found' }
      }

      const now = new Date()
      const existingStatus = this.dataStore.getUserStatusById(userId)

      const context: StatusResolutionContext = {
        user,
        currentTime: now,
        attendanceRecords: this.dataStore.getAttendanceRecordsByUserId(userId),
        calendarEvents: this.dataStore.getCalendarEventsByUserId(userId),
        existingTimeSlots: existingStatus ? existingStatus.timeSlots : [],
      }

      const resolution = StatusResolver.resolveUserStatus(context)

      if (!resolution.hasChanges && existingStatus) {
        return { success: true, data: existingStatus }
      }

      const updatedStatus: UserStatus = {
        userId,
        name: user.name,
        currentStatus: resolution.currentStatus,
        statusDetail: resolution.statusDetail,
        lastUpdated: resolution.lastUpdated,
        expiresAt: resolution.expiresAt,
        timeSlots: resolution.timeSlots,
      }

      const result = this.dataStore.updateUserStatus(updatedStatus)
      return result
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async refreshAllUserStatuses(): Promise<DataOperationResult<UserStatus[]>> {
    try {
      const users = this.dataStore.getUsers()
      const updatedStatuses: UserStatus[] = []
      const errors: string[] = []

      for (const user of users) {
        const result = await this.refreshUserStatus(user.id)
        if (result.success && result.data) {
          updatedStatuses.push(result.data)
        }
        else {
          errors.push(`${user.name}: ${result.error}`)
        }
      }

      if (errors.length > 0) {
        return {
          success: false,
          error: `Some updates failed: ${errors.join(', ')}`,
          data: updatedStatuses,
        }
      }

      return { success: true, data: updatedStatuses }
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async queryUserStatuses(query: BulkStatusQuery = {}): Promise<DataOperationResult<UserStatus[]>> {
    try {
      const allStatuses = this.dataStore.getUserStatuses()
      let filteredStatuses = allStatuses

      if (query.userIds && query.userIds.length > 0) {
        filteredStatuses = filteredStatuses.filter(status =>
          query.userIds!.includes(status.userId),
        )
      }

      if (query.statusTypes && query.statusTypes.length > 0) {
        filteredStatuses = filteredStatuses.filter(status =>
          query.statusTypes!.includes(status.currentStatus),
        )
      }

      if (!query.includeDetails) {
        filteredStatuses = filteredStatuses.map(status => ({
          ...status,
          statusDetail: undefined,
          timeSlots: [],
        }))
      }

      return { success: true, data: filteredStatuses }
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async cleanupExpiredStatuses(): Promise<DataOperationResult<number>> {
    try {
      const now = new Date()
      const allStatuses = this.dataStore.getUserStatuses()
      let cleanupCount = 0

      for (const status of allStatuses) {
        const validTimeSlots = status.timeSlots.filter(slot =>
          !TimeUtils.isExpired(slot.expiresAt, now),
        )

        if (validTimeSlots.length !== status.timeSlots.length) {
          await this.refreshUserStatus(status.userId)
          cleanupCount++
        }
      }

      return { success: true, data: cleanupCount }
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async getStatusHistory(userId: string, days: number = 7): Promise<DataOperationResult<TimeSlot[]>> {
    try {
      const userStatus = this.dataStore.getUserStatusById(userId)
      if (!userStatus) {
        return { success: false, error: 'User status not found' }
      }

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)

      const recentTimeSlots = userStatus.timeSlots
        .filter(slot => slot.startTime >= cutoffDate)
        .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())

      return { success: true, data: recentTimeSlots }
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async removeTimeSlot(userId: string, timeSlotId: string): Promise<DataOperationResult<UserStatus>> {
    try {
      const userStatus = this.dataStore.getUserStatusById(userId)
      if (!userStatus) {
        return { success: false, error: 'User status not found' }
      }

      const updatedTimeSlots = userStatus.timeSlots.filter(slot => slot.id !== timeSlotId)

      if (updatedTimeSlots.length === userStatus.timeSlots.length) {
        return { success: false, error: 'Time slot not found' }
      }

      const user = this.dataStore.getUserById(userId)
      if (!user) {
        return { success: false, error: 'User not found' }
      }

      const context: StatusResolutionContext = {
        user,
        attendanceRecords: this.dataStore.getAttendanceRecordsByUserId(userId),
        calendarEvents: this.dataStore.getCalendarEventsByUserId(userId),
        existingTimeSlots: updatedTimeSlots,
      }

      const resolution = StatusResolver.resolveUserStatus(context)

      const updatedStatus: UserStatus = {
        ...userStatus,
        currentStatus: resolution.currentStatus,
        statusDetail: resolution.statusDetail,
        lastUpdated: resolution.lastUpdated,
        expiresAt: resolution.expiresAt,
        timeSlots: resolution.timeSlots,
      }

      const result = this.dataStore.updateUserStatus(updatedStatus)
      return result
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async getActiveUsers(): Promise<DataOperationResult<UserStatus[]>> {
    const query: BulkStatusQuery = {
      statusTypes: ['on_duty', 'meeting', 'out', 'wfh'],
      includeDetails: true,
    }
    return this.queryUserStatuses(query)
  }

  async getUsersInMeetings(): Promise<DataOperationResult<UserStatus[]>> {
    const query: BulkStatusQuery = {
      statusTypes: ['meeting'],
      includeDetails: true,
    }
    return this.queryUserStatuses(query)
  }

  async getUsersOnLeave(): Promise<DataOperationResult<UserStatus[]>> {
    const query: BulkStatusQuery = {
      statusTypes: ['on_leave'],
      includeDetails: true,
    }
    return this.queryUserStatuses(query)
  }

  async getWorkingFromHomeUsers(): Promise<DataOperationResult<UserStatus[]>> {
    const query: BulkStatusQuery = {
      statusTypes: ['wfh'],
      includeDetails: true,
    }
    return this.queryUserStatuses(query)
  }

  async scheduleStatusUpdate(request: StatusUpdateRequest & { scheduledTime: Date }): Promise<DataOperationResult<string>> {
    try {
      // For now, we'll just validate the request and return a scheduled ID
      // In a full implementation, this would integrate with a job scheduler

      const user = this.dataStore.getUserById(request.userId)
      if (!user) {
        return { success: false, error: 'User not found' }
      }

      if (request.scheduledTime <= new Date()) {
        return { success: false, error: 'Scheduled time must be in the future' }
      }

      const validation = StatusResolver.validateStatusTransition(
        'on_duty',
        request.status,
        user,
        request.scheduledTime,
      )

      if (!validation.valid) {
        return { success: false, error: validation.reason }
      }

      const scheduleId = `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // TODO: Store scheduled update in a separate collection
      // Placeholder: In production, this would integrate with a job scheduler

      return { success: true, data: scheduleId }
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  }
}
