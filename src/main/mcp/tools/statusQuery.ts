import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import type { StatusType } from '../../../shared/types.js'
import { z } from 'zod'
import { dataStore } from '../../stores/DataStore.js'

const StatusTypeSchema = z.enum(['on_duty', 'off_duty', 'on_leave', 'wfh', 'out', 'meeting'])

export const getUserStatusTool: Tool = {
  name: 'getUserStatus',
  description: 'Get the current status of a specific user by their ID or name',
  inputSchema: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'User ID or name to query status for',
      },
    },
    required: ['userId'],
  },
}

export const getUsersInStatusTool: Tool = {
  name: 'getUsersInStatus',
  description: 'Get all users who currently have a specific status',
  inputSchema: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['on_duty', 'off_duty', 'on_leave', 'wfh', 'out', 'meeting'],
        description: 'Status type to filter users by',
      },
    },
    required: ['status'],
  },
}

export const getAllUserStatusesTool: Tool = {
  name: 'getAllUserStatuses',
  description: 'Get current status of all users in the system',
  inputSchema: {
    type: 'object',
    properties: {},
    additionalProperties: false,
  },
}

export async function handleGetUserStatus(args: { userId: string }) {
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

  const user = dataStore.getUsers().find(u => u.id === userStatus.userId)
  const statusDetail = userStatus.statusDetail ? ` - ${userStatus.statusDetail}` : ''

  return {
    content: [{
      type: 'text' as const,
      text: `${user?.name || userStatus.name} is currently ${userStatus.currentStatus.replace('_', ' ')}${statusDetail}. Last updated: ${userStatus.lastUpdated.toLocaleString()}`,
    }],
  }
}

export async function handleGetUsersInStatus(args: { status: StatusType }) {
  const { status } = args

  const userStatuses = dataStore.getUserStatuses()
  const usersWithStatus = userStatuses.filter(u => u.currentStatus === status)

  if (usersWithStatus.length === 0) {
    return {
      content: [{
        type: 'text' as const,
        text: `No users are currently ${status.replace('_', ' ')}.`,
      }],
    }
  }

  const userList = usersWithStatus.map((u) => {
    const detail = u.statusDetail ? ` (${u.statusDetail})` : ''
    return `• ${u.name}${detail}`
  }).join('\n')

  return {
    content: [{
      type: 'text' as const,
      text: `Users currently ${status.replace('_', ' ')}:\n${userList}`,
    }],
  }
}

export async function handleGetAllUserStatuses() {
  const userStatuses = dataStore.getUserStatuses()

  if (userStatuses.length === 0) {
    return {
      content: [{
        type: 'text' as const,
        text: 'No user status data available.',
      }],
    }
  }

  const statusList = userStatuses.map((u) => {
    const detail = u.statusDetail ? ` - ${u.statusDetail}` : ''
    return `• ${u.name}: ${u.currentStatus.replace('_', ' ')}${detail}`
  }).join('\n')

  return {
    content: [{
      type: 'text' as const,
      text: `Current status of all users:\n${statusList}`,
    }],
  }
}

// Phase 6 Enhancement: Batch Query Tools
export async function handleQueryUsersByDepartment(args: { department: string }) {
  const { department } = args
  const users = dataStore.getUsers()
  const userStatuses = dataStore.getUserStatuses()

  // Filter users by department
  const departmentUsers = users.filter(user =>
    user.department.toLowerCase() === department.toLowerCase(),
  )

  if (departmentUsers.length === 0) {
    return {
      content: [{
        type: 'text' as const,
        text: `找不到 ${department} 部門的用戶`,
      }],
    }
  }

  // Get status for each department user
  const departmentStatuses = departmentUsers.map((user) => {
    const userStatus = userStatuses.find(status => status.userId === user.id)
    return {
      userId: user.id,
      name: user.name,
      department: user.department,
      currentStatus: userStatus?.currentStatus || 'unknown',
      statusDetail: userStatus?.statusDetail,
      lastUpdated: userStatus?.lastUpdated,
    }
  })

  return {
    content: [{
      type: 'text' as const,
      text: `查詢到 ${department} 部門共 ${departmentUsers.length} 位員工:\n${departmentStatuses.map(user =>
        `${user.name} (${user.userId}): ${user.currentStatus}${user.statusDetail ? ` - ${user.statusDetail}` : ''}`,
      ).join('\n')}`,
    }],
  }
}

export async function handleQueryUsersByMultipleStatuses(args: { statuses: StatusType[] }) {
  const { statuses } = args
  const userStatuses = dataStore.getUserStatuses()

  if (!statuses || statuses.length === 0) {
    return {
      content: [{
        type: 'text' as const,
        text: '請提供至少一個狀態類型',
      }],
    }
  }

  // Filter users by multiple statuses
  const matchingUsers = userStatuses.filter(userStatus =>
    statuses.includes(userStatus.currentStatus),
  )

  if (matchingUsers.length === 0) {
    return {
      content: [{
        type: 'text' as const,
        text: `找不到狀態為 ${statuses.join(', ')} 的用戶`,
      }],
    }
  }

  const userList = matchingUsers.map(status =>
    `${status.name} (${status.userId}): ${status.currentStatus}${status.statusDetail ? ` - ${status.statusDetail}` : ''}`,
  ).join('\n')

  return {
    content: [{
      type: 'text' as const,
      text: `查詢到 ${matchingUsers.length} 位員工處於以下狀態 [${statuses.join(', ')}]:\n${userList}`,
    }],
  }
}

// Phase 6 Tool Definitions
export const queryUsersByDepartmentTool = z.object({
  department: z.string().describe('Department name to filter users by'),
})

export const queryUsersByMultipleStatusesTool = z.object({
  statuses: z.array(StatusTypeSchema).describe('Array of status types to filter by'),
})
