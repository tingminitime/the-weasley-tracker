import type {
  AttendanceRecord,
  CalendarEvent,
  MockUser,
  StatusType,
  TimeSlot,
} from '@shared/types'
import { randomBytes } from 'node:crypto'
import { TimeUtils } from '../utils/TimeUtils'

export interface StatusResolutionContext {
  user: MockUser
  currentTime?: Date
  attendanceRecords: AttendanceRecord[]
  calendarEvents: CalendarEvent[]
  existingTimeSlots: TimeSlot[]
}

export interface StatusResolutionResult {
  currentStatus: StatusType
  lastUpdated: Date
  expiresAt: Date
  timeSlots: TimeSlot[]
  hasChanges: boolean
}

export class StatusResolver {
  static resolveUserStatus(context: StatusResolutionContext): StatusResolutionResult {
    const now = context.currentTime || new Date()
    const { user, attendanceRecords, calendarEvents, existingTimeSlots } = context

    const activeSlotsFromSources = this.createTimeSlotsFromSources(
      attendanceRecords,
      calendarEvents,
      user,
      now,
    )

    const allTimeSlots = this.mergeTimeSlots([...existingTimeSlots, ...activeSlotsFromSources])

    const cleanedTimeSlots = this.cleanupExpiredTimeSlots(allTimeSlots, now)

    const currentStatus = this.calculateCurrentStatus(cleanedTimeSlots, user, now)

    const expiresAt = this.calculateStatusExpiration(cleanedTimeSlots, currentStatus, user, now)

    const hasChanges = this.hasStatusChanged(existingTimeSlots, cleanedTimeSlots)

    return {
      currentStatus: currentStatus.status,
      lastUpdated: now,
      expiresAt,
      timeSlots: cleanedTimeSlots,
      hasChanges,
    }
  }

  private static createTimeSlotsFromSources(
    attendanceRecords: AttendanceRecord[],
    calendarEvents: CalendarEvent[],
    user: MockUser,
    currentTime: Date,
  ): TimeSlot[] {
    const slots: TimeSlot[] = []
    const today = TimeUtils.getTodayDateString()

    attendanceRecords
      .filter(record => record.date === today)
      .forEach((record) => {
        const attendanceSlots = this.createTimeSlotsFromAttendance(record, user, currentTime)
        slots.push(...attendanceSlots)
      })

    calendarEvents
      .filter(event => TimeUtils.isSameDay(event.startTime, currentTime))
      .forEach((event) => {
        const calendarSlot = this.createTimeSlotFromCalendar(event, currentTime)
        if (calendarSlot) {
          slots.push(calendarSlot)
        }
      })

    return slots
  }

  private static createTimeSlotsFromAttendance(
    record: AttendanceRecord,
    user: MockUser,
    currentTime: Date,
  ): TimeSlot[] {
    const slots: TimeSlot[] = []

    if (record.status === 'on_leave') {
      slots.push({
        id: `attendance-leave-${record.id}`,
        startTime: record.startTime,
        endTime: record.endTime,
        status: 'on_leave',
        source: 'attendance',
        priority: 2,
        createdAt: currentTime,
        expiresAt: record.endTime,
      })
    }
    else if (record.checkIn) {
      const workEnd = record.checkOut || TimeUtils.getWorkDayEnd(user, record.checkIn)

      slots.push({
        id: `attendance-work-${record.id}`,
        startTime: record.checkIn,
        endTime: workEnd,
        status: record.status as StatusType,
        source: 'attendance',
        priority: 2,
        createdAt: currentTime,
        expiresAt: TimeUtils.calculateExpirationTime(record.status as StatusType, user, record.checkIn, workEnd),
      })
    }

    return slots
  }

  private static createTimeSlotFromCalendar(
    event: CalendarEvent,
    currentTime: Date,
  ): TimeSlot | null {
    if (event.status === 'canceled') {
      return null
    }

    return {
      id: `calendar-${event.id}`,
      startTime: event.startTime,
      endTime: event.endTime,
      status: 'meeting',
      source: 'calendar',
      priority: 1,
      createdAt: currentTime,
      expiresAt: event.endTime,
    }
  }

  private static mergeTimeSlots(timeSlots: TimeSlot[]): TimeSlot[] {
    const slotMap = new Map<string, TimeSlot>()

    timeSlots.forEach((slot) => {
      const existingSlot = slotMap.get(slot.id)
      if (!existingSlot || slot.priority >= existingSlot.priority) {
        slotMap.set(slot.id, slot)
      }
    })

    return Array.from(slotMap.values())
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority
        }
        return a.startTime.getTime() - b.startTime.getTime()
      })
  }

  private static cleanupExpiredTimeSlots(timeSlots: TimeSlot[], currentTime: Date): TimeSlot[] {
    return timeSlots.filter(slot => !TimeUtils.isExpired(slot.expiresAt, currentTime))
  }

  private static calculateCurrentStatus(
    timeSlots: TimeSlot[],
    user: MockUser,
    currentTime: Date,
  ): { status: StatusType } {
    const activeSlot = timeSlots.find(slot =>
      currentTime >= slot.startTime && currentTime <= slot.endTime,
    )

    if (activeSlot) {
      return {
        status: activeSlot.status,
      }
    }

    const isWorkingHours = TimeUtils.isWithinWorkHours(currentTime, user.workSchedule)
    const isWorkingDay = TimeUtils.isWorkingDay(currentTime)

    if (!isWorkingDay || !isWorkingHours) {
      return { status: 'off_duty' }
    }

    const upcomingHighPrioritySlot = timeSlots.find(slot =>
      slot.startTime > currentTime
      && slot.priority >= 2
      && TimeUtils.isSameDay(slot.startTime, currentTime),
    )

    if (upcomingHighPrioritySlot && upcomingHighPrioritySlot.status === 'on_leave') {
      return { status: 'on_leave' }
    }

    return { status: 'on_duty' }
  }

  private static calculateStatusExpiration(
    timeSlots: TimeSlot[],
    currentStatus: { status: StatusType },
    user: MockUser,
    currentTime: Date,
  ): Date {
    const activeSlot = timeSlots.find(slot =>
      currentTime >= slot.startTime && currentTime <= slot.endTime,
    )

    if (activeSlot) {
      return activeSlot.expiresAt
    }

    return TimeUtils.calculateExpirationTime(currentStatus.status, user, currentTime)
  }

  private static hasStatusChanged(
    oldTimeSlots: TimeSlot[],
    newTimeSlots: TimeSlot[],
  ): boolean {
    if (oldTimeSlots.length !== newTimeSlots.length) {
      return true
    }

    const oldSlotIds = new Set(oldTimeSlots.map(s => s.id))
    const newSlotIds = new Set(newTimeSlots.map(s => s.id))

    if (oldSlotIds.size !== newSlotIds.size) {
      return true
    }

    for (const id of newSlotIds) {
      if (!oldSlotIds.has(id)) {
        return true
      }
    }

    for (let i = 0; i < oldTimeSlots.length; i++) {
      const oldSlot = oldTimeSlots[i]
      const newSlot = newTimeSlots.find(s => s.id === oldSlot.id)

      if (!newSlot
        || oldSlot.status !== newSlot.status
        || oldSlot.startTime.getTime() !== newSlot.startTime.getTime()
        || oldSlot.endTime.getTime() !== newSlot.endTime.getTime()) {
        return true
      }
    }

    return false
  }

  static createAIModifiedTimeSlot(
    status: StatusType,
    startTime: Date,
    endTime: Date,
    user: MockUser,
    currentTime?: Date,
  ): TimeSlot {
    const now = currentTime || new Date()

    const id = `ai-${randomBytes(8).toString('hex')}`

    return {
      id,
      startTime,
      endTime,
      status,
      source: 'ai_modified',
      priority: 3,
      createdAt: now,
      expiresAt: TimeUtils.calculateExpirationTime(status, user, startTime, endTime),
    }
  }

  static removeConflictingTimeSlots(
    timeSlots: TimeSlot[],
    newTimeSlot: TimeSlot,
  ): TimeSlot[] {
    return timeSlots.filter((slot) => {
      if (slot.id === newTimeSlot.id) {
        return false
      }

      const hasOverlap = TimeUtils.isTimeRangeOverlap(
        { startTime: slot.startTime, endTime: slot.endTime },
        { startTime: newTimeSlot.startTime, endTime: newTimeSlot.endTime },
      )

      if (!hasOverlap) {
        return true
      }

      return slot.priority > newTimeSlot.priority
    })
  }

  static validateStatusTransition(
    _fromStatus: StatusType,
    toStatus: StatusType,
    user: MockUser,
    currentTime?: Date,
  ): { valid: boolean, reason?: string } {
    const now = currentTime || new Date()
    const isWorkingHours = TimeUtils.isWithinWorkHours(now, user.workSchedule)
    const isWorkingDay = TimeUtils.isWorkingDay(now)

    if (toStatus === 'on_duty' && (!isWorkingDay || !isWorkingHours)) {
      return {
        valid: false,
        reason: 'Cannot set on_duty status outside working hours',
      }
    }

    if ((toStatus === 'out' || toStatus === 'meeting') && (!isWorkingDay || !isWorkingHours)) {
      return {
        valid: false,
        reason: 'Cannot set work-related status outside working hours',
      }
    }

    return { valid: true }
  }
}
