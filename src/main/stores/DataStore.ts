import type {
  AppData,
  AttendanceRecord,
  AuthSession,
  CalendarEvent,
  DataOperationResult,
  LoginRequest,
  LoginResponse,
  MockUser,
  TimeSlot,
  UserStatus,
} from '@shared/types'
import path from 'node:path'
import Store from 'electron-store'

export class DataStore {
  private store: Store<AppData>

  constructor() {
    this.store = new Store<AppData>({
      cwd: path.join(process.cwd(), 'data'),
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

  // Tag operations
  updateUserTag(userId: string, tag: string): DataOperationResult<MockUser> {
    try {
      const users = this.getUsers()
      const userIndex = users.findIndex(user => user.id === userId)

      if (userIndex === -1) {
        return { success: false, error: 'User not found' }
      }

      // Validate that the tag exists in user's custom tags (if they have any)
      // Allow empty string (clear tag) or validate against custom tags
      const user = users[userIndex]
      if (tag && user.customTags && user.customTags.length > 0 && !user.customTags.includes(tag)) {
        return { success: false, error: 'Tag not found in user custom tags' }
      }

      users[userIndex] = { ...users[userIndex], tag }
      this.setUsers(users)

      return { success: true, data: users[userIndex] }
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  }

  getUserTag(userId: string): string | undefined {
    const user = this.getUserById(userId)
    return user?.tag
  }

  // Custom Tags operations
  getUserCustomTags(userId: string): string[] {
    const user = this.getUserById(userId)
    return user?.customTags || []
  }

  addUserCustomTag(userId: string, tag: string): DataOperationResult<string> {
    try {
      const users = this.getUsers()
      const userIndex = users.findIndex(user => user.id === userId)

      if (userIndex === -1) {
        return { success: false, error: 'User not found' }
      }

      const user = users[userIndex]
      const customTags = user.customTags || []

      // Check if tag already exists
      if (customTags.includes(tag)) {
        return { success: false, error: 'Tag already exists' }
      }

      // Check tag is not empty
      if (!tag.trim()) {
        return { success: false, error: 'Tag cannot be empty' }
      }

      const updatedTags = [...customTags, tag.trim()]
      users[userIndex] = { ...user, customTags: updatedTags }
      this.setUsers(users)

      return { success: true, data: tag.trim() }
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  }

  updateUserCustomTag(userId: string, oldTag: string, newTag: string): DataOperationResult<string> {
    try {
      const users = this.getUsers()
      const userIndex = users.findIndex(user => user.id === userId)

      if (userIndex === -1) {
        return { success: false, error: 'User not found' }
      }

      const user = users[userIndex]
      const customTags = user.customTags || []

      // Check if old tag exists
      const tagIndex = customTags.indexOf(oldTag)
      if (tagIndex === -1) {
        return { success: false, error: 'Tag not found' }
      }

      // Check new tag is not empty
      if (!newTag.trim()) {
        return { success: false, error: 'Tag cannot be empty' }
      }

      // Check if new tag already exists (and is different from old tag)
      if (newTag.trim() !== oldTag && customTags.includes(newTag.trim())) {
        return { success: false, error: 'Tag already exists' }
      }

      // Update the tag
      const updatedTags = [...customTags]
      updatedTags[tagIndex] = newTag.trim()

      // Update user's selected tag if it matches the old tag
      const updatedUser = {
        ...user,
        customTags: updatedTags,
        tag: user.tag === oldTag ? newTag.trim() : user.tag,
      }

      users[userIndex] = updatedUser
      this.setUsers(users)

      return { success: true, data: newTag.trim() }
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  }

  deleteUserCustomTag(userId: string, tag: string): DataOperationResult<void> {
    try {
      const users = this.getUsers()
      const userIndex = users.findIndex(user => user.id === userId)

      if (userIndex === -1) {
        return { success: false, error: 'User not found' }
      }

      const user = users[userIndex]
      const customTags = user.customTags || []

      // Check if tag exists
      if (!customTags.includes(tag)) {
        return { success: false, error: 'Tag not found' }
      }

      // Remove the tag
      const updatedTags = customTags.filter(t => t !== tag)

      // Clear user's selected tag if it matches the deleted tag
      const updatedUser = {
        ...user,
        customTags: updatedTags,
        tag: user.tag === tag ? undefined : user.tag,
      }

      users[userIndex] = updatedUser
      this.setUsers(users)

      return { success: true }
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
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

  // TimeSlot operations
  addTimeSlotToUser(userId: string, timeSlot: TimeSlot): DataOperationResult<TimeSlot> {
    try {
      const userStatus = this.getUserStatusById(userId)
      if (!userStatus) {
        return { success: false, error: 'User status not found' }
      }

      const updatedTimeSlots = [...userStatus.timeSlots, timeSlot]
      const updatedStatus: UserStatus = {
        ...userStatus,
        timeSlots: updatedTimeSlots,
        lastUpdated: new Date(),
      }

      const result = this.updateUserStatus(updatedStatus)
      if (result.success) {
        return { success: true, data: timeSlot }
      }
      return { success: false, error: result.error }
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  }

  removeTimeSlotFromUser(userId: string, timeSlotId: string): DataOperationResult<void> {
    try {
      const userStatus = this.getUserStatusById(userId)
      if (!userStatus) {
        return { success: false, error: 'User status not found' }
      }

      const updatedTimeSlots = userStatus.timeSlots.filter(slot => slot.id !== timeSlotId)
      if (updatedTimeSlots.length === userStatus.timeSlots.length) {
        return { success: false, error: 'Time slot not found' }
      }

      const updatedStatus: UserStatus = {
        ...userStatus,
        timeSlots: updatedTimeSlots,
        lastUpdated: new Date(),
      }

      const result = this.updateUserStatus(updatedStatus)
      return result.success ? { success: true } : { success: false, error: result.error }
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  }

  updateTimeSlotInUser(userId: string, timeSlot: TimeSlot): DataOperationResult<TimeSlot> {
    try {
      const userStatus = this.getUserStatusById(userId)
      if (!userStatus) {
        return { success: false, error: 'User status not found' }
      }

      const slotIndex = userStatus.timeSlots.findIndex(slot => slot.id === timeSlot.id)
      if (slotIndex === -1) {
        return { success: false, error: 'Time slot not found' }
      }

      const updatedTimeSlots = [...userStatus.timeSlots]
      updatedTimeSlots[slotIndex] = timeSlot

      const updatedStatus: UserStatus = {
        ...userStatus,
        timeSlots: updatedTimeSlots,
        lastUpdated: new Date(),
      }

      const result = this.updateUserStatus(updatedStatus)
      if (result.success) {
        return { success: true, data: timeSlot }
      }
      return { success: false, error: result.error }
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  }

  getTimeSlotsByUserId(userId: string): TimeSlot[] {
    const userStatus = this.getUserStatusById(userId)
    return userStatus ? userStatus.timeSlots : []
  }

  getTimeSlotsBySource(source: 'attendance' | 'calendar' | 'ai_modified'): TimeSlot[] {
    const allStatuses = this.getUserStatuses()
    const allTimeSlots: TimeSlot[] = []

    allStatuses.forEach((status) => {
      const filteredSlots = status.timeSlots.filter(slot => slot.source === source)
      allTimeSlots.push(...filteredSlots)
    })

    return allTimeSlots
  }

  bulkUpdateUserStatuses(statuses: UserStatus[]): DataOperationResult<UserStatus[]> {
    try {
      const currentStatuses = this.getUserStatuses()
      const statusMap = new Map(currentStatuses.map(s => [s.userId, s]))

      statuses.forEach((status) => {
        statusMap.set(status.userId, status)
      })

      const updatedStatuses = Array.from(statusMap.values())
      this.setUserStatuses(updatedStatuses)

      return { success: true, data: statuses }
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  }

  // Cleanup operations
  cleanupExpiredTimeSlots(): DataOperationResult<number> {
    try {
      const now = new Date()
      const allStatuses = this.getUserStatuses()
      let cleanupCount = 0

      const updatedStatuses = allStatuses.map((status) => {
        const validTimeSlots = status.timeSlots.filter(slot => slot.expiresAt > now)

        if (validTimeSlots.length !== status.timeSlots.length) {
          cleanupCount += (status.timeSlots.length - validTimeSlots.length)
          return {
            ...status,
            timeSlots: validTimeSlots,
            lastUpdated: now,
          }
        }

        return status
      })

      if (cleanupCount > 0) {
        this.setUserStatuses(updatedStatuses)
      }

      return { success: true, data: cleanupCount }
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  }

  // Batch operations for performance
  batchGetUserData(userIds: string[]): {
    users: MockUser[]
    statuses: UserStatus[]
    attendance: AttendanceRecord[]
    calendar: CalendarEvent[]
  } {
    const users = userIds.map(id => this.getUserById(id)).filter(Boolean) as MockUser[]
    const statuses = userIds.map(id => this.getUserStatusById(id)).filter(Boolean) as UserStatus[]

    const attendance = this.getAttendanceRecords().filter(record =>
      userIds.includes(record.userId),
    )

    const calendar = this.getCalendarEvents().filter(event =>
      userIds.includes(event.userId),
    )

    return { users, statuses, attendance, calendar }
  }

  // Statistics and reporting
  getUserStatusStats(): {
    totalUsers: number
    statusCounts: Record<string, number>
    activeSlotsCount: number
  } {
    const statuses = this.getUserStatuses()
    const totalUsers = statuses.length

    const statusCounts: Record<string, number> = {}
    let activeSlotsCount = 0

    statuses.forEach((status) => {
      statusCounts[status.currentStatus] = (statusCounts[status.currentStatus] || 0) + 1

      const now = new Date()
      const activeSlots = status.timeSlots.filter(slot =>
        slot.startTime <= now && slot.endTime >= now,
      )
      activeSlotsCount += activeSlots.length
    })

    return { totalUsers, statusCounts, activeSlotsCount }
  }

  // Get all data (for debugging)
  getAllData(): AppData {
    return this.store.store
  }
}

export const dataStore = new DataStore()
