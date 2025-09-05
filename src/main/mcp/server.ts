import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import {
  handleBulkStatusUpdate, // Phase 6 Batch Tools
  handleGetAllUserStatuses, // Phase 5 Handlers
  handleGetUsersInStatus, // Phase 5 Handlers
  handleGetUserStatus, // Phase 5 Handlers
  handleQueryUsersByDepartment, // Phase 6 Batch Tools
  handleQueryUsersByMultipleStatuses, // Phase 6 Batch Tools
  handleRefreshAllStatuses, // Phase 5 Handlers
  handleRefreshUserStatus, // Phase 5 Handlers
  handleUpdateUserStatus, // Phase 5 Handlers
} from './tools/index.js'

export class WeasleyTrackerMcpServer {
  private server: McpServer

  constructor() {
    this.server = new McpServer({
      name: 'weasley-tracker-server',
      version: '1.0.0',
    })

    this.setupTools()
  }

  private setupTools() {
    // Status Query Tools
    this.server.registerTool(
      'getUserStatus',
      {
        title: 'Get User Status',
        description: 'Get the current status of a specific user by their ID or name',
        inputSchema: {
          userId: z.string().describe('User ID or name to query status for'),
        },
      },
      handleGetUserStatus,
    )

    this.server.registerTool(
      'getUsersInStatus',
      {
        title: 'Get Users In Status',
        description: 'Get all users who currently have a specific status',
        inputSchema: {
          status: z.enum(['on_duty', 'off_duty', 'on_leave', 'wfh', 'out', 'meeting'])
            .describe('Status type to filter users by'),
        },
      },
      handleGetUsersInStatus,
    )

    this.server.registerTool(
      'getAllUserStatuses',
      {
        title: 'Get All User Statuses',
        description: 'Get current status of all users in the system',
        inputSchema: {},
      },
      handleGetAllUserStatuses,
    )

    // Status Update Tools
    this.server.registerTool(
      'updateUserStatus',
      {
        title: 'Update User Status',
        description: 'Update a user\'s status with optional description',
        inputSchema: {
          userId: z.string().describe('User ID or name to update status for'),
          status: z.enum(['on_duty', 'off_duty', 'on_leave', 'wfh', 'out', 'meeting'])
            .describe('New status to set for the user'),
          statusDetail: z.string().optional().describe('Optional description or additional details about the status'),
        },
      },
      handleUpdateUserStatus,
    )

    this.server.registerTool(
      'refreshUserStatus',
      {
        title: 'Refresh User Status',
        description: 'Apply time-based automatic status logic to a specific user',
        inputSchema: {
          userId: z.string().describe('User ID or name to refresh status for'),
        },
      },
      handleRefreshUserStatus,
    )

    this.server.registerTool(
      'refreshAllStatuses',
      {
        title: 'Refresh All Statuses',
        description: 'Apply time-based automatic status logic to all users',
        inputSchema: {},
      },
      handleRefreshAllStatuses,
    )

    // Phase 6 Batch Query Tools
    this.server.registerTool(
      'queryUsersByDepartment',
      {
        title: 'Query Users By Department',
        description: 'Get all users in a specific department with their current statuses',
        inputSchema: {
          department: z.string().describe('Department name to filter users by'),
        },
      },
      handleQueryUsersByDepartment,
    )

    this.server.registerTool(
      'queryUsersByMultipleStatuses',
      {
        title: 'Query Users By Multiple Statuses',
        description: 'Get users who have any of the specified statuses',
        inputSchema: {
          statuses: z.array(z.enum(['on_duty', 'off_duty', 'on_leave', 'wfh', 'out', 'meeting']))
            .describe('Array of status types to filter by'),
        },
      },
      handleQueryUsersByMultipleStatuses,
    )

    this.server.registerTool(
      'bulkStatusUpdate',
      {
        title: 'Bulk Status Update',
        description: 'Update status for multiple users at once',
        inputSchema: {
          userIds: z.array(z.string()).describe('Array of user IDs or names to update'),
          status: z.enum(['on_duty', 'off_duty', 'on_leave', 'wfh', 'out', 'meeting'])
            .describe('New status to set for all users'),
          statusDetail: z.string().optional().describe('Optional description for all updates'),
        },
      },
      handleBulkStatusUpdate,
    )
  }

  getServer(): McpServer {
    return this.server
  }
}
