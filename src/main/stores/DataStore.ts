import type {
  AppData,
  AuthSession,
  DataOperationResult,
  LoginRequest,
  LoginResponse,
  MockUser,
  UserStatus,
} from '@shared/types'
import { Buffer } from 'node:buffer'
import path from 'node:path'
import Store from 'electron-store'

export class DataStore {
  private store: Store<AppData>

  constructor() {
    this.store = new Store<AppData>({
      cwd: path.join(process.cwd(), 'data'),
      defaults: {
        users: [],
        userStatuses: [],
        authSession: {
          currentUserId: null,
          isLoggedIn: false,
        },
        initializedDate: new Date().toISOString().split('T')[0],
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
      userStatuses: [],
      authSession: {
        currentUserId: null,
        isLoggedIn: false,
      },
      initializedDate: new Date().toISOString().split('T')[0],
    }
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

  // Batch operations for performance
  batchGetUserData(userIds: string[]): {
    users: MockUser[]
    statuses: UserStatus[]
  } {
    const users = userIds.map(id => this.getUserById(id)).filter(Boolean) as MockUser[]
    const statuses = userIds.map(id => this.getUserStatusById(id)).filter(Boolean) as UserStatus[]

    return { users, statuses }
  }

  // Statistics and reporting
  getUserStatusStats(): {
    totalUsers: number
    statusCounts: Record<string, number>
  } {
    const statuses = this.getUserStatuses()
    const totalUsers = statuses.length

    const statusCounts: Record<string, number> = {}

    statuses.forEach((status) => {
      statusCounts[status.currentStatus] = (statusCounts[status.currentStatus] || 0) + 1
    })

    return { totalUsers, statusCounts }
  }

  // Initialization date operations
  getInitializedDate(): string {
    return this.store.get('initializedDate', new Date().toISOString().split('T')[0])
  }

  setInitializedDate(date: string): void {
    this.store.set('initializedDate', date)
  }

  // Check for cross-day reset and handle data regeneration
  checkAndHandleCrossDayReset(): boolean {
    const currentDate = new Date().toISOString().split('T')[0]
    const storedDate = this.getInitializedDate()

    if (currentDate !== storedDate) {
      // Cross-day reset needed
      this.setInitializedDate(currentDate)
      return true
    }

    return false
  }

  // Get all data (for debugging)
  getAllData(): AppData {
    return this.store.store
  }

  // API Key management methods
  hasApiKey(): boolean {
    const apiKey = this.store.get('apiKey', '')
    return apiKey.length > 0
  }

  getApiKey(): string | null {
    const apiKey = this.store.get('apiKey', '')
    return apiKey || null
  }

  setApiKey(apiKey: string): void {
    // Basic encryption - in production, consider using node:crypto for better encryption
    const encrypted = Buffer.from(apiKey).toString('base64')
    this.store.set('apiKey', encrypted)
  }

  clearApiKey(): void {
    this.store.delete('apiKey')
  }

  private decryptApiKey(encrypted: string): string {
    try {
      return Buffer.from(encrypted, 'base64').toString('utf8')
    }
    catch {
      return ''
    }
  }

  getDecryptedApiKey(): string | null {
    const encrypted = this.store.get('apiKey', '')
    if (!encrypted)
      return null

    const decrypted = this.decryptApiKey(encrypted)
    return decrypted || null
  }
}

export const dataStore = new DataStore()
