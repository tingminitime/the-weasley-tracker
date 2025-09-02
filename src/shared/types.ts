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

export interface StatusHistoryEntry {
  id: string
  status: StatusType
  statusDetail?: string // Status description
  timestamp: Date // Change timestamp
  source: 'system' | 'ai_modified' // Change source: system auto or AI modified
}

export interface UserStatus {
  userId: string
  name: string

  // Current status
  currentStatus: StatusType
  statusDetail?: string // Optional status description
  lastUpdated: Date

  // Daily status change history
  statusHistory: StatusHistoryEntry[]
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
  userStatuses: UserStatus[]
  authSession: AuthSession
  initializedDate: string // Initialization date (YYYY-MM-DD)
}
