import type { ElectronAPI } from '@electron-toolkit/preload'
import type { AttendanceRecord, CalendarEvent, LoginRequest, MockUser, UserStatus } from '@shared/types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      // Authentication APIs
      login: (request: LoginRequest) => Promise<any>
      logout: () => Promise<any>
      getAuthSession: () => Promise<any>
      getCurrentUser: () => Promise<MockUser | null>

      // User APIs
      getUsers: () => Promise<MockUser[]>
      getUserById: (userId: string) => Promise<MockUser | undefined>

      // User Status APIs
      getUserStatuses: () => Promise<UserStatus[]>
      getUserStatusById: (userId: string) => Promise<UserStatus | undefined>
      updateUserStatus: (status: UserStatus) => Promise<any>

      // Attendance APIs
      getAttendanceRecords: () => Promise<AttendanceRecord[]>
      getAttendanceRecordsByUserId: (userId: string) => Promise<AttendanceRecord[]>

      // Calendar APIs
      getCalendarEvents: () => Promise<CalendarEvent[]>
      getCalendarEventsByUserId: (userId: string) => Promise<CalendarEvent[]>

      // Utility APIs
      initializeMockData: () => Promise<any>
      resetData: () => Promise<any>
      updateUserTag: (userId: string, tag: string) => Promise<any>
      getUserTag: (userId: string) => Promise<string | undefined>
    }
  }
}
