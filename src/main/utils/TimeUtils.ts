import type { MockUser, StatusType } from '@shared/types'

export interface WorkSchedule {
  startTime: string
  endTime: string
}

export interface TimeRange {
  startTime: Date
  endTime: Date
}

export class TimeUtils {
  static parseTime(timeString: string, date?: Date): Date {
    const [hours, minutes] = timeString.split(':').map(Number)
    const result = date ? new Date(date) : new Date()
    result.setHours(hours, minutes, 0, 0)
    return result
  }

  static isWithinWorkHours(time: Date, schedule: WorkSchedule, date?: Date): boolean {
    const baseDate = date || time
    const workStart = this.parseTime(schedule.startTime, baseDate)
    const workEnd = this.parseTime(schedule.endTime, baseDate)

    return time >= workStart && time <= workEnd
  }

  static isWorkingDay(date: Date): boolean {
    const dayOfWeek = date.getDay()
    return dayOfWeek >= 1 && dayOfWeek <= 5
  }

  static getWorkDayEnd(user: MockUser, date?: Date): Date {
    const baseDate = date || new Date()
    return this.parseTime(user.workSchedule.endTime, baseDate)
  }

  static getNextWorkDayStart(user: MockUser, fromDate?: Date): Date {
    const baseDate = fromDate || new Date()
    const nextDay = new Date(baseDate)
    nextDay.setDate(nextDay.getDate() + 1)

    while (!this.isWorkingDay(nextDay)) {
      nextDay.setDate(nextDay.getDate() + 1)
    }

    return this.parseTime(user.workSchedule.startTime, nextDay)
  }

  static calculateExpirationTime(
    status: StatusType,
    user: MockUser,
    startTime?: Date,
    endTime?: Date,
  ): Date {
    const now = startTime || new Date()

    switch (status) {
      case 'meeting':
        return endTime || this.getWorkDayEnd(user, now)

      case 'on_leave':
        return endTime || this.getWorkDayEnd(user, now)

      case 'off_duty':
        return this.getNextWorkDayStart(user, now)

      case 'on_duty':
      case 'wfh':
      case 'out':
      default:
        return this.getWorkDayEnd(user, now)
    }
  }

  static isTimeRangeOverlap(range1: TimeRange, range2: TimeRange): boolean {
    return range1.startTime < range2.endTime && range2.startTime < range1.endTime
  }

  static getOverlapDuration(range1: TimeRange, range2: TimeRange): number {
    if (!this.isTimeRangeOverlap(range1, range2)) {
      return 0
    }

    const overlapStart = new Date(Math.max(range1.startTime.getTime(), range2.startTime.getTime()))
    const overlapEnd = new Date(Math.min(range1.endTime.getTime(), range2.endTime.getTime()))

    return overlapEnd.getTime() - overlapStart.getTime()
  }

  static isExpired(expirationTime: Date, currentTime?: Date): boolean {
    const now = currentTime || new Date()
    return now > expirationTime
  }

  static formatTimeForDisplay(time: Date): string {
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  static formatDateForStorage(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  static isSameDay(date1: Date, date2: Date): boolean {
    return this.formatDateForStorage(date1) === this.formatDateForStorage(date2)
  }

  static getTodayDateString(): string {
    return this.formatDateForStorage(new Date())
  }

  static createTimeRange(startTime: Date, endTime: Date): TimeRange {
    return { startTime, endTime }
  }

  static validateTimeRange(range: TimeRange): boolean {
    return range.startTime < range.endTime
  }

  static sortTimeRangesByStart(ranges: TimeRange[]): TimeRange[] {
    return ranges.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  }

  static findActiveTimeSlot(ranges: TimeRange[], currentTime?: Date): TimeRange | null {
    const now = currentTime || new Date()

    return ranges.find(range =>
      now >= range.startTime && now <= range.endTime,
    ) || null
  }

  static getUpcomingTimeSlot(ranges: TimeRange[], currentTime?: Date): TimeRange | null {
    const now = currentTime || new Date()
    const upcoming = ranges
      .filter(range => range.startTime > now)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

    return upcoming.length > 0 ? upcoming[0] : null
  }

  static mergeOverlappingRanges(ranges: TimeRange[]): TimeRange[] {
    if (ranges.length <= 1)
      return ranges

    const sorted = this.sortTimeRangesByStart([...ranges])
    const merged: TimeRange[] = []
    let current = sorted[0]

    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i]

      if (this.isTimeRangeOverlap(current, next)) {
        current = {
          startTime: current.startTime,
          endTime: new Date(Math.max(current.endTime.getTime(), next.endTime.getTime())),
        }
      }
      else {
        merged.push(current)
        current = next
      }
    }

    merged.push(current)
    return merged
  }
}
