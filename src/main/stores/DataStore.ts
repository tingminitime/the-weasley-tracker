import type {
  AppData,
  AttendanceRecord,
  AuthSession,
  CalendarEvent,
  DataOperationResult,
  LoginRequest,
  LoginResponse,
  MockUser,
  UserStatus,
} from '@shared/types'
import Store from 'electron-store'

export class DataStore {
  private store: Store<AppData>

  constructor() {
    this.store = new Store<AppData>({
      defaults: {
        users: [],
        attendanceRecords: [],
        calendarEvents: [],
        userStatuses: [],
        authSession: {
          currentUserId: null,
          isLoggedIn: false,
        },
      },
    })
  }

  // User operations
  getUsers(): MockUser[] {
    return this.store.get('users', [])
  }

  getUserById(id: string): MockUser | undefined {
    const users = this.getUsers()
    return users.find(user => user.id === id)
  }

  setUsers(users: MockUser[]): void {
    this.store.set('users', users)
  }

  addUser(user: MockUser): DataOperationResult<MockUser> {
    try {
      const users = this.getUsers()
      if (users.some(u => u.id === user.id)) {
        return { success: false, error: 'User with this ID already exists' }
      }
      users.push(user)
      this.setUsers(users)
      return { success: true, data: user }
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  }

  // Attendance operations
  getAttendanceRecords(): AttendanceRecord[] {
    return this.store.get('attendanceRecords', [])
  }

  getAttendanceRecordsByUserId(userId: string): AttendanceRecord[] {
    const records = this.getAttendanceRecords()
    return records.filter(record => record.userId === userId)
  }

  getAttendanceRecordsByDate(date: string): AttendanceRecord[] {
    const records = this.getAttendanceRecords()
    return records.filter(record => record.date === date)
  }

  setAttendanceRecords(records: AttendanceRecord[]): void {
    this.store.set('attendanceRecords', records)
  }

  addAttendanceRecord(record: AttendanceRecord): DataOperationResult<AttendanceRecord> {
    try {
      const records = this.getAttendanceRecords()
      records.push(record)
      this.setAttendanceRecords(records)
      return { success: true, data: record }
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  }

  // Calendar operations
  getCalendarEvents(): CalendarEvent[] {
    return this.store.get('calendarEvents', [])
  }

  getCalendarEventsByUserId(userId: string): CalendarEvent[] {
    const events = this.getCalendarEvents()
    return events.filter(event => event.userId === userId)
  }

  setCalendarEvents(events: CalendarEvent[]): void {
    this.store.set('calendarEvents', events)
  }

  addCalendarEvent(event: CalendarEvent): DataOperationResult<CalendarEvent> {
    try {
      const events = this.getCalendarEvents()
      events.push(event)
      this.setCalendarEvents(events)
      return { success: true, data: event }
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  }

  // User status operations
  getUserStatuses(): UserStatus[] {
    return this.store.get('userStatuses', [])
  }

  getUserStatusById(userId: string): UserStatus | undefined {
    const statuses = this.getUserStatuses()
    return statuses.find(status => status.userId === userId)
  }

  setUserStatuses(statuses: UserStatus[]): void {
    this.store.set('userStatuses', statuses)
  }

  updateUserStatus(status: UserStatus): DataOperationResult<UserStatus> {
    try {
      const statuses = this.getUserStatuses()
      const index = statuses.findIndex(s => s.userId === status.userId)

      if (index >= 0) {
        statuses[index] = status
      }
      else {
        statuses.push(status)
      }

      this.setUserStatuses(statuses)
      return { success: true, data: status }
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  }

  // Authentication operations
  getAuthSession(): AuthSession {
    return this.store.get('authSession', {
      currentUserId: null,
      isLoggedIn: false,
    })
  }

  login(request: LoginRequest): LoginResponse {
    try {
      const user = this.getUserById(request.userId)
      if (!user) {
        return { success: false, error: 'User not found' }
      }

      const session: AuthSession = {
        currentUserId: request.userId,
        isLoggedIn: true,
        loginTime: new Date(),
      }

      this.store.set('authSession', session)
      return { success: true, user }
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  }

  logout(): DataOperationResult<void> {
    try {
      const session: AuthSession = {
        currentUserId: null,
        isLoggedIn: false,
      }
      this.store.set('authSession', session)
      return { success: true }
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  }

  getCurrentUser(): MockUser | null {
    const session = this.getAuthSession()
    if (!session.isLoggedIn || !session.currentUserId) {
      return null
    }
    return this.getUserById(session.currentUserId) || null
  }

  // Utility operations
  clear(): void {
    this.store.clear()
  }

  reset(): void {
    this.store.store = {
      users: [],
      attendanceRecords: [],
      calendarEvents: [],
      userStatuses: [],
      authSession: {
        currentUserId: null,
        isLoggedIn: false,
      },
    }
  }

  // Get all data (for debugging)
  getAllData(): AppData {
    return this.store.store
  }
}

export const dataStore = new DataStore()
