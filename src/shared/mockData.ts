import type {
  AttendanceRecord,
  CalendarEvent,
  MockUser,
  StatusType,
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
    // Determine current status based on attendance and calendar
    let currentStatus: StatusType = 'off_duty'
    let statusDetail = ''

    // Simple logic for initial status
    const workStart = new Date(now)
    const [startHour, startMinute] = user.workSchedule.startTime.split(':').map(Number)
    workStart.setHours(startHour, startMinute, 0, 0)

    const workEnd = new Date(now)
    const [endHour, endMinute] = user.workSchedule.endTime.split(':').map(Number)
    workEnd.setHours(endHour, endMinute, 0, 0)

    if (now >= workStart && now <= workEnd) {
      // During work hours
      const scenarios = ['on_duty', 'meeting', 'out', 'wfh']
      currentStatus = scenarios[Math.floor(Math.random() * scenarios.length)] as StatusType

      switch (currentStatus) {
        case 'meeting':
          statusDetail = 'Daily Standup'
          break
        case 'out':
          statusDetail = 'Client visit'
          break
        case 'wfh':
          statusDetail = 'Working from home'
          break
      }
    }

    // Set expiration time
    const expiresAt = new Date(workEnd)

    return {
      userId: user.id,
      name: user.name,
      currentStatus,
      statusDetail,
      lastUpdated: now,
      expiresAt,
      timeSlots: [], // Will be populated later with actual logic
    }
  })
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
