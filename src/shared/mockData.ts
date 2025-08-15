import type {
  AttendanceRecord,
  CalendarEvent,
  MockUser,
  StatusType,
  TimeSlot,
  UserStatus,
} from './types'

export function generateMockUsers(): MockUser[] {
  return [
    {
      id: 'user-001',
      name: '張小華',
      department: 'Engineering',
      workSchedule: {
        startTime: '09:00',
        endTime: '18:00',
      },
    },
    {
      id: 'user-002',
      name: '李大明',
      department: 'Product',
      workSchedule: {
        startTime: '08:30',
        endTime: '17:30',
      },
    },
    {
      id: 'user-003',
      name: '王美玲',
      department: 'Design',
      workSchedule: {
        startTime: '09:30',
        endTime: '18:30',
      },
    },
    {
      id: 'user-004',
      name: 'John Smith',
      department: 'Marketing',
      workSchedule: {
        startTime: '08:00',
        endTime: '17:00',
      },
    },
    {
      id: 'user-005',
      name: 'Sarah Connor',
      department: 'HR',
      workSchedule: {
        startTime: '09:00',
        endTime: '18:00',
      },
    },
    {
      id: 'user-006',
      name: 'Mike Johnson',
      department: 'Engineering',
      workSchedule: {
        startTime: '10:00',
        endTime: '19:00',
      },
    },
  ]
}

export function generateTodayAttendanceRecords(users: MockUser[]): AttendanceRecord[] {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const records: AttendanceRecord[] = []

  users.forEach((user, index) => {
    const startTime = new Date(today)
    const [startHour, startMinute] = user.workSchedule.startTime.split(':').map(Number)
    startTime.setHours(startHour, startMinute, 0, 0)

    const endTime = new Date(today)
    const [endHour, endMinute] = user.workSchedule.endTime.split(':').map(Number)
    endTime.setHours(endHour, endMinute, 0, 0)

    // Simulate different scenarios
    const scenario = index % 4
    let record: AttendanceRecord

    switch (scenario) {
      case 0: { // Normal office work - checked in
        record = {
          id: `att-${user.id}-${todayStr}`,
          userId: user.id,
          checkIn: new Date(startTime.getTime() + Math.random() * 30 * 60000), // Within 30 minutes
          workType: 'office',
          date: todayStr,
          status: 'on_duty',
          startTime,
          endTime,
        }
        break
      }

      case 1: { // WFH - checked in
        record = {
          id: `att-${user.id}-${todayStr}`,
          userId: user.id,
          checkIn: new Date(startTime.getTime() + Math.random() * 15 * 60000), // Within 15 minutes
          workType: 'wfh',
          date: todayStr,
          status: 'wfh',
          startTime,
          endTime,
        }
        break
      }

      case 2: { // On leave
        record = {
          id: `att-${user.id}-${todayStr}`,
          userId: user.id,
          workType: 'office',
          date: todayStr,
          status: 'on_leave',
          startTime,
          endTime,
        }
        break
      }

      case 3: { // Late arrival or not checked in yet
        const now = new Date()
        if (now > startTime) {
          record = {
            id: `att-${user.id}-${todayStr}`,
            userId: user.id,
            workType: 'office',
            date: todayStr,
            status: 'off_duty', // Will be updated when they check in
            startTime,
            endTime,
          }
        }
        else {
          record = {
            id: `att-${user.id}-${todayStr}`,
            userId: user.id,
            checkIn: new Date(startTime.getTime() + Math.random() * 10 * 60000),
            workType: 'office',
            date: todayStr,
            status: 'on_duty',
            startTime,
            endTime,
          }
        }
        break
      }

      default: {
        record = {
          id: `att-${user.id}-${todayStr}`,
          userId: user.id,
          workType: 'office',
          date: todayStr,
          status: 'off_duty',
          startTime,
          endTime,
        }
        break
      }
    }

    records.push(record)
  })

  return records
}

export function generateTodayCalendarEvents(users: MockUser[]): CalendarEvent[] {
  const today = new Date()
  const events: CalendarEvent[] = []
  const meetingTitles = [
    'Daily Standup',
    'Sprint Planning',
    'Client Review',
    'Team Sync',
    'Product Demo',
    'Code Review',
    'Architecture Discussion',
    'Quarterly Planning',
  ]

  // Generate 2-3 meetings per user
  users.forEach((user) => {
    const numMeetings = Math.floor(Math.random() * 2) + 1 // 1-2 meetings

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
        id: `event-${user.id}-${i}-${today.getTime()}`,
        userId: user.id,
        title: meetingTitles[Math.floor(Math.random() * meetingTitles.length)],
        startTime,
        endTime,
        status,
        eventStatus: 'meeting',
      })
    }
  })

  return events
}

export function generateInitialUserStatuses(users: MockUser[]): UserStatus[] {
  const now = new Date()

  return users.map((user) => {
    const timeSlots = generateInitialTimeSlots(user, now)
    const resolvedStatus = resolveStatusFromTimeSlots(timeSlots, user, now)

    return {
      userId: user.id,
      name: user.name,
      currentStatus: resolvedStatus.status,
      statusDetail: resolvedStatus.detail,
      lastUpdated: now,
      expiresAt: resolvedStatus.expiresAt,
      timeSlots,
    }
  })
}

function generateInitialTimeSlots(user: MockUser, currentTime: Date): TimeSlot[] {
  const slots: TimeSlot[] = []
  const today = currentTime.toISOString().split('T')[0]

  // Create work schedule time slot from attendance
  const workStart = new Date(currentTime)
  const [startHour, startMinute] = user.workSchedule.startTime.split(':').map(Number)
  workStart.setHours(startHour, startMinute, 0, 0)

  const workEnd = new Date(currentTime)
  const [endHour, endMinute] = user.workSchedule.endTime.split(':').map(Number)
  workEnd.setHours(endHour, endMinute, 0, 0)

  // Simulate attendance-based time slot (priority 2)
  const attendanceScenarios = ['on_duty', 'wfh', 'on_leave']
  const attendanceStatus = attendanceScenarios[Math.floor(Math.random() * attendanceScenarios.length)] as StatusType

  if (attendanceStatus !== 'on_leave' && currentTime >= workStart) {
    // Only add work slot if user has checked in and it's after work start
    const checkInTime = new Date(workStart.getTime() + Math.random() * 30 * 60000) // Within 30 minutes

    slots.push({
      id: `att-${user.id}-${today}`,
      startTime: checkInTime,
      endTime: workEnd,
      status: attendanceStatus,
      statusDetail: attendanceStatus === 'wfh' ? 'Working from home' : undefined,
      source: 'attendance',
      priority: 2,
      createdAt: currentTime,
      expiresAt: calculateExpirationTime(attendanceStatus, workEnd),
    })
  }
  else if (attendanceStatus === 'on_leave') {
    // Add leave time slot for the whole day
    slots.push({
      id: `leave-${user.id}-${today}`,
      startTime: workStart,
      endTime: workEnd,
      status: 'on_leave',
      source: 'attendance',
      priority: 2,
      createdAt: currentTime,
      expiresAt: workEnd,
    })
  }

  // Generate random meeting slots (priority 1)
  const numMeetings = Math.floor(Math.random() * 3) // 0-2 meetings
  const meetingTitles = ['Daily Standup', 'Sprint Planning', 'Client Review', 'Team Sync']

  for (let i = 0; i < numMeetings; i++) {
    const meetingStart = new Date(workStart)
    meetingStart.setHours(
      workStart.getHours() + Math.floor(Math.random() * 8), // Random hour during work day
      Math.floor(Math.random() * 4) * 15, // 0, 15, 30, or 45 minutes
      0,
      0,
    )

    const meetingDuration = [30, 60, 90][Math.floor(Math.random() * 3)] // 30, 60, or 90 minutes
    const meetingEnd = new Date(meetingStart.getTime() + meetingDuration * 60000)

    // Only add meeting if it's within work hours
    if (meetingEnd <= workEnd) {
      slots.push({
        id: `meeting-${user.id}-${i}-${today}`,
        startTime: meetingStart,
        endTime: meetingEnd,
        status: 'meeting',
        statusDetail: meetingTitles[Math.floor(Math.random() * meetingTitles.length)],
        source: 'calendar',
        priority: 1,
        createdAt: currentTime,
        expiresAt: meetingEnd,
      })
    }
  }

  // Occasionally add AI-modified status (priority 3) for some variety
  if (Math.random() < 0.3) { // 30% chance
    const aiStatuses = ['out', 'meeting', 'wfh']
    const aiStatus = aiStatuses[Math.floor(Math.random() * aiStatuses.length)] as StatusType

    const aiStart = new Date(currentTime.getTime() - Math.random() * 2 * 60 * 60000) // Up to 2 hours ago
    const aiEnd = new Date(aiStart.getTime() + (1 + Math.random() * 3) * 60 * 60000) // 1-4 hours duration

    slots.push({
      id: `ai-${user.id}-${Date.now()}`,
      startTime: aiStart,
      endTime: aiEnd,
      status: aiStatus,
      statusDetail: aiStatus === 'out' ? 'Client meeting' : aiStatus === 'meeting' ? 'Ad-hoc discussion' : 'Working from home',
      source: 'ai_modified',
      priority: 3,
      createdAt: currentTime,
      expiresAt: calculateExpirationTime(aiStatus, aiEnd),
    })
  }

  return slots.sort((a, b) => {
    // Sort by priority (highest first), then by start time
    if (a.priority !== b.priority) {
      return b.priority - a.priority
    }
    return a.startTime.getTime() - b.startTime.getTime()
  })
}

function resolveStatusFromTimeSlots(timeSlots: TimeSlot[], user: MockUser, currentTime: Date): {
  status: StatusType
  detail?: string
  expiresAt: Date
} {
  // Find active time slot (highest priority slot that's currently active)
  const activeSlot = timeSlots.find(slot =>
    currentTime >= slot.startTime
    && currentTime <= slot.endTime
    && slot.expiresAt > currentTime,
  )

  if (activeSlot) {
    return {
      status: activeSlot.status,
      detail: activeSlot.statusDetail,
      expiresAt: activeSlot.expiresAt,
    }
  }

  // No active slot - determine based on work hours
  const workStart = new Date(currentTime)
  const [startHour, startMinute] = user.workSchedule.startTime.split(':').map(Number)
  workStart.setHours(startHour, startMinute, 0, 0)

  const workEnd = new Date(currentTime)
  const [endHour, endMinute] = user.workSchedule.endTime.split(':').map(Number)
  workEnd.setHours(endHour, endMinute, 0, 0)

  const isWorkingHours = currentTime >= workStart && currentTime <= workEnd
  const isWorkingDay = currentTime.getDay() >= 1 && currentTime.getDay() <= 5

  if (isWorkingDay && isWorkingHours) {
    return {
      status: 'on_duty',
      expiresAt: workEnd,
    }
  }
  else {
    // Off duty - expires at next work day start
    const nextWorkDay = new Date(currentTime)
    nextWorkDay.setDate(nextWorkDay.getDate() + 1)
    while (nextWorkDay.getDay() === 0 || nextWorkDay.getDay() === 6) {
      nextWorkDay.setDate(nextWorkDay.getDate() + 1)
    }
    nextWorkDay.setHours(startHour, startMinute, 0, 0)

    return {
      status: 'off_duty',
      expiresAt: nextWorkDay,
    }
  }
}

function calculateExpirationTime(status: StatusType, endTime: Date): Date {
  switch (status) {
    case 'meeting':
      return endTime // Meetings expire at their end time
    case 'on_leave':
      return endTime // Leave expires at specified end time
    case 'off_duty': {
      // Off duty expires at next work day start (simplified - using end time + 1 day)
      const nextDay = new Date(endTime)
      nextDay.setDate(nextDay.getDate() + 1)
      nextDay.setHours(8, 30, 0, 0) // Default start time
      return nextDay
    }
    case 'on_duty':
    case 'wfh':
    case 'out':
    default: {
      // Work statuses expire at end of work day
      const workDayEnd = new Date(endTime)
      workDayEnd.setHours(17, 30, 0, 0) // Default end time
      return workDayEnd
    }
  }
}

export function initializeMockData(): {
  users: MockUser[]
  attendanceRecords: AttendanceRecord[]
  calendarEvents: CalendarEvent[]
  userStatuses: UserStatus[]
} {
  const users = generateMockUsers()
  const attendanceRecords = generateTodayAttendanceRecords(users)
  const calendarEvents = generateTodayCalendarEvents(users)
  const userStatuses = generateInitialUserStatuses(users)

  return {
    users,
    attendanceRecords,
    calendarEvents,
    userStatuses,
  }
}
