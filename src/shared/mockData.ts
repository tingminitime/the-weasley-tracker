import type {
  MockUser,
  StatusHistoryEntry,
  StatusType,
  UserStatus,
} from './types'
import teammates from '../../data/teammates.json'

export function generateMockUsers(): MockUser[] {
  return teammates as MockUser[]
}

export function generateInitialUserStatuses(users: MockUser[]): UserStatus[] {
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  return users.map((user, index) => {
    const { status: currentStatus, statusDetail } = determineBasicTimeStatus(user, now, index)

    // Create initial status history entry
    const initialHistoryEntry: StatusHistoryEntry = {
      id: `init-${user.id}-${today}`,
      status: currentStatus,
      statusDetail,
      timestamp: now,
      source: statusDetail ? 'ai_modified' : 'system',
    }

    return {
      userId: user.id,
      name: user.name,
      currentStatus,
      statusDetail,
      lastUpdated: now,
      statusHistory: [initialHistoryEntry],
    }
  })
}

function determineBasicTimeStatus(user: MockUser, currentTime: Date, userIndex: number): {
  status: StatusType
  statusDetail?: string
} {
  const workStart = new Date(currentTime)
  const [startHour, startMinute] = user.workSchedule.startTime.split(':').map(Number)
  workStart.setHours(startHour, startMinute, 0, 0)

  const workEnd = new Date(currentTime)
  const [endHour, endMinute] = user.workSchedule.endTime.split(':').map(Number)
  workEnd.setHours(endHour, endMinute, 0, 0)

  // Basic time boundary logic
  const basicStatus = getBasicTimeStatus(currentTime, workStart, workEnd)

  // Add some example AI-modified statuses for demo purposes
  const aiModifiedExamples = getAIModifiedExamples(userIndex, basicStatus)

  return aiModifiedExamples || { status: basicStatus }
}

function getBasicTimeStatus(currentTime: Date, workStart: Date, workEnd: Date): StatusType {
  if (currentTime < workStart) {
    return 'off_duty' // Before work hours
  }
  else if (currentTime >= workStart && currentTime <= workEnd) {
    return 'on_duty' // During work hours
  }
  else {
    return 'off_duty' // After work hours
  }
}

function getAIModifiedExamples(userIndex: number, _basicStatus: StatusType): { status: StatusType, statusDetail?: string } | null {
  // Add some variety for demo - specific users get AI-modified statuses
  switch (userIndex % 6) {
    case 0: // First user - in meeting
      return {
        status: 'meeting',
        statusDetail: '與客戶進行產品展示會議',
      }
    case 1: // Second user - working from home
      return {
        status: 'wfh',
        statusDetail: '今日遠端工作',
      }
    case 2: // Third user - on leave
      return {
        status: 'on_leave',
        statusDetail: '請假一日',
      }
    case 3: // Fourth user - out
      return {
        status: 'out',
        statusDetail: '外出拜訪客戶，下午3點回來',
      }
    case 4: // Fifth user - AI set off_duty (early leave or sick)
      return {
        status: 'off_duty',
        statusDetail: '身體不適，提早下班休息',
      }
    case 5: // Sixth user - AI set on_duty (overtime or special situation)
      return {
        status: 'on_duty',
        statusDetail: '處理緊急事務，需要加班',
      }
  }

  return null
}

export function initializeMockData(): {
  users: MockUser[]
  userStatuses: UserStatus[]
  initializedDate: string
} {
  const users = generateMockUsers()
  const userStatuses = generateInitialUserStatuses(users)
  const initializedDate = new Date().toISOString().split('T')[0]

  return {
    users,
    userStatuses,
    initializedDate,
  }
}

// Helper function for refreshing user status (time boundary logic)
export function refreshUserStatusToTimeBasedLogic(
  existingStatus: UserStatus,
  user: MockUser,
  currentTime: Date = new Date(),
): UserStatus {
  const { status: currentStatus } = determineBasicTimeStatus(user, currentTime, 0)

  const refreshHistoryEntry: StatusHistoryEntry = {
    id: `refresh-${user.id}-${Date.now()}`,
    status: currentStatus,
    statusDetail: undefined, // Clear any AI-set details on refresh
    timestamp: currentTime,
    source: 'system',
  }

  return {
    ...existingStatus,
    currentStatus,
    statusDetail: undefined, // Clear status detail on refresh
    lastUpdated: currentTime,
    statusHistory: [...existingStatus.statusHistory, refreshHistoryEntry],
  }
}

// Helper function to add status change to history
export function addStatusChangeToHistory(
  userStatus: UserStatus,
  newStatus: StatusType,
  statusDetail: string | undefined,
  source: 'system' | 'ai_modified',
  timestamp: Date = new Date(),
): UserStatus {
  const historyEntry: StatusHistoryEntry = {
    id: `${source}-${userStatus.userId}-${Date.now()}`,
    status: newStatus,
    statusDetail,
    timestamp,
    source,
  }

  return {
    ...userStatus,
    currentStatus: newStatus,
    statusDetail,
    lastUpdated: timestamp,
    statusHistory: [...userStatus.statusHistory, historyEntry],
  }
}
