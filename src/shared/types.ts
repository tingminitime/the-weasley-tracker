export type StatusType = 'on_duty' | 'off_duty' | 'on_leave' | 'wfh' | 'out' | 'meeting'

export interface MockUser {
  id: string
  name: string
  department: string
  tag?: string
  customTags?: string[]
  workSchedule: {
    startTime: string // Default "08:30"
    endTime: string // Default "17:30"
  }
}

export interface AttendanceRecord {
  id: string
  userId: string
  checkIn?: Date // Check-in time (both office and wfh)
  checkOut?: Date // Check-out time (both office and wfh)
  workType: 'office' | 'wfh'
  date: string // YYYY-MM-DD
  status: 'on_duty' | 'off_duty' | 'on_leave' | 'wfh'
  startTime: Date // Scheduled start time
  endTime: Date // Scheduled end time
}

export interface CalendarEvent {
  id: string
  userId: string
  title: string
  startTime: Date
  endTime: Date
  status: 'scheduled' | 'ongoing' | 'completed' | 'canceled'
  eventStatus: 'meeting'
}

export interface TimeSlot {
  id: string
  startTime: Date
  endTime: Date
  status: StatusType
  source: 'attendance' | 'calendar' | 'ai_modified'
  priority: number // 3=AI modified, 2=attendance, 1=calendar
  createdAt: Date
  expiresAt: Date
}

export interface UserStatus {
  userId: string
  name: string

  // Current effective status (calculated by priority)
  currentStatus: StatusType
  lastUpdated: Date
  expiresAt: Date

  // All time slots (sorted by priority and time)
  timeSlots: TimeSlot[]
}

// Authentication types
export interface AuthSession {
  currentUserId: string | null
  isLoggedIn: boolean
  loginTime?: Date
}

// API types for IPC communication
export interface DataOperationResult<T> {
  success: boolean
  data?: T
  error?: string
}

export interface LoginRequest {
  userId: string
}

export interface LoginResponse {
  success: boolean
  user?: MockUser
  error?: string
}

// Chat types
export interface ChatMessage {
  id: string
  content: string
  type: 'user' | 'ai'
  timestamp: Date
  isTyping?: boolean
}

export interface ChatSession {
  id: string
  messages: ChatMessage[]
  createdAt: Date
  lastMessageAt: Date
}

// Store data structure
export interface AppData {
  users: MockUser[]
  attendanceRecords: AttendanceRecord[]
  calendarEvents: CalendarEvent[]
  userStatuses: UserStatus[]
  authSession: AuthSession
}
