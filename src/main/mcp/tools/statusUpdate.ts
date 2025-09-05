import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import type { MockUser, StatusType } from '../../../shared/types.js'
import { dataStore } from '../../stores/DataStore.js'

// Helper function for basic time status
function getBasicTimeStatus(currentTime: Date, user: MockUser): StatusType {
  const workStart = new Date(currentTime)
  const [startHour, startMinute] = user.workSchedule.startTime.split(':').map(Number)
  workStart.setHours(startHour, startMinute, 0, 0)

  const workEnd = new Date(currentTime)
  const [endHour, endMinute] = user.workSchedule.endTime.split(':').map(Number)
  workEnd.setHours(endHour, endMinute, 0, 0)

  if (currentTime < workStart || currentTime > workEnd) {
    return 'off_duty'
  }
  else {
    return 'on_duty'
  }
}

export const updateUserStatusTool: Tool = {
  name: 'updateUserStatus',
  description: 'Update a user\'s status with optional description',
  inputSchema: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'User ID or name to update status for',
      },
      status: {
        type: 'string',
        enum: ['on_duty', 'off_duty', 'on_leave', 'wfh', 'out', 'meeting'],
        description: 'New status to set for the user',
      },
      statusDetail: {
        type: 'string',
        description: 'Optional description or additional details about the status',
      },
    },
    required: ['userId', 'status'],
  },
}

export const refreshUserStatusTool: Tool = {
  name: 'refreshUserStatus',
  description: 'Apply time-based automatic status logic to a specific user',
  inputSchema: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'User ID or name to refresh status for',
      },
    },
    required: ['userId'],
  },
}

export const refreshAllStatusesTool: Tool = {
  name: 'refreshAllStatuses',
  description: 'Apply time-based automatic status logic to all users',
  inputSchema: {
    type: 'object',
    properties: {},
    additionalProperties: false,
  },
}

export async function handleUpdateUserStatus(args: { userId: string, status: StatusType, statusDetail?: string }) {
  const { userId, status, statusDetail } = args

  // Try to find user by ID first, then by name
  const userStatuses = dataStore.getUserStatuses()
  let userStatus = userStatuses.find(u => u.userId === userId)

  if (!userStatus) {
    userStatus = userStatuses.find(u => u.name.toLowerCase().includes(userId.toLowerCase()))
  }

  if (!userStatus) {
    return {
      content: [{
        type: 'text' as const,
        text: `User "${userId}" not found. Available users: ${userStatuses.map(u => u.name).join(', ')}`,
      }],
    }
  }

  // Update the user's status
  const previousStatus = userStatus.currentStatus
  const previousDetail = userStatus.statusDetail

  // Create updated status object
  const updatedStatus = {
    ...userStatus,
    currentStatus: status,
    statusDetail,
    lastUpdated: new Date(),
    statusHistory: [...userStatus.statusHistory, {
      id: `update-${userStatus.userId}-${Date.now()}`,
      status,
      statusDetail,
      timestamp: new Date(),
      source: 'ai_modified' as const,
    }],
  }

  dataStore.updateUserStatus(updatedStatus)

  const user = dataStore.getUsers().find(u => u.id === userStatus.userId)
  const userName = user?.name || userStatus.name
  const userTag = dataStore.getUserTag(userStatus.userId)
  const tagDisplay = userTag ? ` [TEMP_STATUS:${userTag}]` : ''
  const newDetail = statusDetail ? ` - ${statusDetail}` : ''
  const oldDetail = previousDetail ? ` - ${previousDetail}` : ''

  return {
    content: [{
      type: 'text' as const,
      text: `Updated ${userName}${tagDisplay}'s status from ${previousStatus.replace('_', ' ')}${oldDetail} to ${status.replace('_', ' ')}${newDetail}.`,
    }],
  }
}

export async function handleRefreshUserStatus(args: { userId: string }) {
  const { userId } = args

  // Try to find user by ID first, then by name
  const userStatuses = dataStore.getUserStatuses()
  let userStatus = userStatuses.find(u => u.userId === userId)

  if (!userStatus) {
    userStatus = userStatuses.find(u => u.name.toLowerCase().includes(userId.toLowerCase()))
  }

  if (!userStatus) {
    return {
      content: [{
        type: 'text' as const,
        text: `User "${userId}" not found. Available users: ${userStatuses.map(u => u.name).join(', ')}`,
      }],
    }
  }

  const previousStatus = userStatus.currentStatus
  const previousDetail = userStatus.statusDetail

  // Apply time-based logic
  const user = dataStore.getUsers().find(u => u.id === userStatus.userId)!
  const basicStatus = getBasicTimeStatus(new Date(), user)

  // Update user with time-based status
  const updatedStatus = {
    ...userStatus,
    currentStatus: basicStatus,
    statusDetail: undefined, // Clear custom status detail
    lastUpdated: new Date(),
    statusHistory: [...userStatus.statusHistory, {
      id: `refresh-${userStatus.userId}-${Date.now()}`,
      status: basicStatus,
      timestamp: new Date(),
      source: 'system' as const,
    }],
  }

  dataStore.updateUserStatus(updatedStatus)
  const userName = user?.name || userStatus.name
  const userTag = dataStore.getUserTag(userStatus.userId)
  const tagDisplay = userTag ? ` [TEMP_STATUS:${userTag}]` : ''

  if (previousStatus === updatedStatus.currentStatus) {
    return {
      content: [{
        type: 'text' as const,
        text: `${userName}${tagDisplay}'s status remains ${updatedStatus.currentStatus.replace('_', ' ')} after applying time-based logic.`,
      }],
    }
  }

  const oldDetail = previousDetail ? ` - ${previousDetail}` : ''
  const newDetail = updatedStatus.statusDetail ? ` - ${updatedStatus.statusDetail}` : ''

  return {
    content: [{
      type: 'text' as const,
      text: `Refreshed ${userName}${tagDisplay}'s status from ${previousStatus.replace('_', ' ')}${oldDetail} to ${updatedStatus.currentStatus.replace('_', ' ')}${newDetail} based on current time.`,
    }],
  }
}

export async function handleRefreshAllStatuses() {
  const userStatuses = dataStore.getUserStatuses()

  if (userStatuses.length === 0) {
    return {
      content: [{
        type: 'text' as const,
        text: 'No users found to refresh.',
      }],
    }
  }

  // Store previous statuses for comparison
  const previousStatuses = userStatuses.map(u => ({
    userId: u.userId,
    name: u.name,
    status: u.currentStatus,
    detail: u.statusDetail,
  }))

  // Apply time-based logic to all users
  const users = dataStore.getUsers()
  const now = new Date()
  const updatedStatuses = userStatuses.map((userStatus) => {
    const user = users.find(u => u.id === userStatus.userId)!
    const basicStatus = getBasicTimeStatus(now, user)

    return {
      ...userStatus,
      currentStatus: basicStatus,
      statusDetail: undefined, // Clear custom status detail
      lastUpdated: now,
      statusHistory: [...userStatus.statusHistory, {
        id: `refresh-all-${userStatus.userId}-${Date.now()}`,
        status: basicStatus,
        timestamp: now,
        source: 'system' as const,
      }],
    }
  })

  // Update all statuses
  dataStore.setUserStatuses(updatedStatuses)
  const changes: string[] = []

  previousStatuses.forEach((prev) => {
    const updated = updatedStatuses.find(u => u.userId === prev.userId)
    if (updated && prev.status !== updated.currentStatus) {
      const userTag = dataStore.getUserTag(prev.userId)
      const tagDisplay = userTag ? ` [TEMP_STATUS:${userTag}]` : ''
      const oldDetail = prev.detail ? ` - ${prev.detail}` : ''
      const newDetail = updated.statusDetail ? ` - ${updated.statusDetail}` : ''
      changes.push(`• ${prev.name}${tagDisplay}: ${prev.status.replace('_', ' ')}${oldDetail} → ${updated.currentStatus.replace('_', ' ')}${newDetail}`)
    }
  })

  if (changes.length === 0) {
    return {
      content: [{
        type: 'text' as const,
        text: 'All user statuses refreshed. No changes were needed based on current time-based logic.',
      }],
    }
  }

  return {
    content: [{
      type: 'text' as const,
      text: `Refreshed all user statuses. Changes applied:\n${changes.join('\n')}`,
    }],
  }
}

// Phase 6 Enhancement: Bulk Status Update Tool
export async function handleBulkStatusUpdate(args: { userIds: string[], status: StatusType, statusDetail?: string }) {
  const { userIds, status, statusDetail } = args

  if (!userIds || userIds.length === 0) {
    return {
      content: [{
        type: 'text' as const,
        text: '請提供至少一個用戶ID',
      }],
    }
  }

  const users = dataStore.getUsers()
  const results: { userId: string, name?: string, success: boolean, message: string }[] = []
  const updatedUsers: string[] = []

  for (const userId of userIds) {
    try {
      // Find user by ID or name
      const user = users.find(u => u.id === userId || u.name === userId)

      if (!user) {
        results.push({
          userId,
          success: false,
          message: `找不到用戶: ${userId}`,
        })
        continue
      }

      // Get current user status to preserve history
      const existingStatuses = dataStore.getUserStatuses()
      const existingStatus = existingStatuses.find(s => s.userId === user.id)

      // Create new status history entry
      const newHistoryEntry = {
        id: `${user.id}-${Date.now()}`,
        status,
        statusDetail,
        timestamp: new Date(),
        source: 'ai_modified' as const,
      }

      // Create updated UserStatus object
      const updatedStatus = {
        userId: user.id,
        name: user.name,
        currentStatus: status,
        statusDetail,
        lastUpdated: new Date(),
        statusHistory: [
          ...(existingStatus?.statusHistory || []),
          newHistoryEntry,
        ],
      }

      // Update user status
      const result = dataStore.updateUserStatus(updatedStatus)
      const success = result.success

      if (success) {
        const userTag = dataStore.getUserTag(user.id)
        const tagDisplay = userTag ? ` [TEMP_STATUS:${userTag}]` : ''
        results.push({
          userId: user.id,
          name: user.name,
          success: true,
          message: `成功更新 ${user.name}${tagDisplay} 的狀態為 ${status}${statusDetail ? ` (${statusDetail})` : ''}`,
        })
        updatedUsers.push(`${user.name}${tagDisplay}`)
      }
      else {
        results.push({
          userId: user.id,
          name: user.name,
          success: false,
          message: `更新 ${user.name} 的狀態失敗`,
        })
      }
    }
    catch (error) {
      console.error(`Error updating status for user ${userId}:`, error)
      results.push({
        userId,
        success: false,
        message: `更新用戶 ${userId} 時發生錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`,
      })
    }
  }

  const successCount = results.filter(r => r.success).length
  const failCount = results.length - successCount

  const summaryMessage = successCount > 0
    ? `批量更新完成：成功 ${successCount} 位，失敗 ${failCount} 位。更新的用戶：${updatedUsers.join(', ')}`
    : `批量更新失敗：所有 ${failCount} 位用戶都更新失敗`

  const detailMessages = results.map(r => `• ${r.message}`).join('\n')

  return {
    content: [{
      type: 'text' as const,
      text: `${summaryMessage}\n\n詳細結果：\n${detailMessages}`,
    }],
  }
}
