import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions.js'
import OpenAI from 'openai'
import { WeasleyTrackerMcpServer } from './server.js'

// Enhanced conversation context for Phase 6
interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ConversationContext {
  recentMessages: ConversationMessage[]
  userPreferences: {
    language?: 'zh' | 'en'
    department?: string
    displayFormat?: 'detailed' | 'summary'
  }
  activeTopics: string[]
  sessionId: string
}

// Tool definition for OpenAI function calling
interface ToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, any>
      required: string[]
    }
  }
}

export class McpOpenAiClient {
  private openai: OpenAI | null = null
  private mcpServer: WeasleyTrackerMcpServer
  private initialized = false

  constructor() {
    this.mcpServer = new WeasleyTrackerMcpServer()
  }

  async initialize(apiKey?: string): Promise<void> {
    if (!apiKey) {
      console.warn('OpenAI API key not provided. MCP server will run without LLM capabilities.')
      this.initialized = true
      return
    }

    this.openai = new OpenAI({
      apiKey,
    })

    this.initialized = true
    console.log('MCP OpenAI client initialized successfully')
  }

  async processMessage(userMessage: string, conversationContext?: ConversationContext): Promise<string> {
    if (!this.initialized) {
      throw new Error('MCP client not initialized')
    }

    if (!this.openai) {
      return this.handleWithoutLLM(userMessage)
    }

    try {
      // Create enhanced system message with sophisticated prompt engineering
      const systemMessage: ChatCompletionMessageParam = {
        role: 'system',
        content: `You are an AI assistant for The Weasley Tracker (查勤魔法), an employee attendance and status management system inspired by the Weasley Clock from Harry Potter.

CORE RESPONSIBILITIES:
- Query employee statuses with natural language understanding
- Update employee statuses with intelligent parsing
- Handle batch operations for multiple employees
- Support both English and Chinese interactions
- Provide contextual, helpful responses with validation

STATUS TYPES (6 supported):
- on_duty (上班中): Working during business hours (08:30-17:30)
- off_duty (下班): Not working, outside business hours  
- on_leave (請假): On vacation or personal leave
- wfh (在家工作): Working from home
- out (外出): Temporarily out of office
- meeting (會議中): In a meeting

TEMPORARY STATUS TAGS (臨時狀態標籤):
- Tool responses may include [TEMP_STATUS:xxx] markers containing user-defined temporary status
- These represent current specific activities, locations, or contextual information
- Use this background information to provide natural, contextual responses
- Incorporate the temporary status details naturally into your language without repeating the format
- This information helps you understand the user's current situation better

AVAILABLE TOOLS:
1. getUserStatus - Get status of specific user by ID/name
2. getUsersInStatus - Get all users with specific status
3. getAllUserStatuses - Get status of all users
4. updateUserStatus - Update user's status with details
5. refreshUserStatus - Apply time-based logic to user
6. refreshAllStatuses - Apply time-based logic to all users
7. queryUsersByDepartment - Get users by department
8. queryUsersByMultipleStatuses - Batch status filtering
9. bulkStatusUpdate - Update multiple users at once

QUERY UNDERSTANDING EXAMPLES:
User: "小王現在在做什麼?" → Use getUserStatus with userId="小王"
User: "有誰正在會議中?" → Use getUsersInStatus with status="meeting"  
User: "技術部有誰在上班?" → Use queryUsersByDepartment with department="技術部" then filter by on_duty
User: "小李、小陳、小王的狀態是?" → Use getUserStatus multiple times or getAllUserStatuses then filter
User: "我要外出，下午3點回來" → Use updateUserStatus with current user, status="out", detail about return time

STATUS UPDATE PARSING:
- Parse time expressions: "下午3點" = 15:00, "明天" = next day
- Extract status intent: "外出" = out, "開會" = meeting, "請假" = on_leave, "在家工作" = wfh
- Handle duration: "外出一小時" = out with 1 hour duration detail
- Multiple users: "小王小李都請假" = bulk update both to on_leave

RESPONSE GUIDELINES:
- Always confirm actions before making changes
- Provide clear, contextual responses in user's language
- Include relevant details (time, duration, who's affected)
- Suggest alternatives when requests are unclear
- Use friendly, professional tone
- Handle errors gracefully with helpful suggestions

CONVERSATION CONTEXT:
${conversationContext
  ? `
Previous messages: ${conversationContext.recentMessages.slice(-3).map(m => `${m.role}: ${m.content}`).join(' | ')}
User preferences: ${JSON.stringify(conversationContext.userPreferences)}
Active topics: ${conversationContext.activeTopics.join(', ')}
`
  : 'No previous context available'}

You must use the provided tools to gather information and make updates. Always call the appropriate tool based on the user's query intent.`,
      }

      const messages: ChatCompletionMessageParam[] = [systemMessage]

      // Add conversation history if available
      if (conversationContext?.recentMessages) {
        messages.push(...conversationContext.recentMessages.slice(-5))
      }

      messages.push({
        role: 'user',
        content: userMessage,
      })

      // Get available tools from MCP server
      const tools = this.getAvailableTools()

      // Make OpenAI API call with function calling
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        tools,
        tool_choice: 'auto',
        max_tokens: 1000,
        temperature: 0.6,
      })

      const message = response.choices[0]?.message
      if (!message) {
        throw new Error('No response from OpenAI')
      }

      // Handle tool calls if present
      if (message.tool_calls && message.tool_calls.length > 0) {
        // Add the assistant's message with tool calls to the conversation
        messages.push(message)

        for (const toolCall of message.tool_calls) {
          if (toolCall.type === 'function') {
            try {
              const result = await this.callMcpTool(toolCall.function.name, JSON.parse(toolCall.function.arguments))

              // Add tool response message to the conversation
              messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify(result),
              })
            }
            catch (error) {
              console.error(`Error calling tool ${toolCall.function.name}:`, error)
              // Add error response as tool message
              messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
              })
            }
          }
        }

        // Create follow-up response with all tool results
        const followUpResponse = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages,
          max_tokens: 800,
          temperature: 0.6,
        })

        return followUpResponse.choices[0]?.message?.content || 'Unable to process tool results'
      }

      // Return direct response if no tools were called
      return message.content || 'Unable to generate response'
    }
    catch (error) {
      console.error('Error processing message with OpenAI:', error)
      return `抱歉，處理您的請求時發生錯誤。請稍後再試。\n\n錯誤詳情：${error instanceof Error ? error.message : '未知錯誤'}\n\n💡 提示：您可以試著重新表述您的問題，或使用更簡單的語句。`
    }
  }

  private handleWithoutLLM(userMessage: string): string {
    // Provide basic responses when no LLM is available
    const message = userMessage.toLowerCase()

    if (message.includes('狀態') || message.includes('status')) {
      return '我可以幫您查詢和更新員工狀態。請提供具體的用戶名稱或狀態類型。\n\n可用的狀態類型：上班中、下班、請假、在家工作、外出、會議中'
    }

    if (message.includes('誰') || message.includes('who')) {
      return '您想查詢哪種狀態的員工？我可以幫您找出正在會議中、外出或其他狀態的同事。'
    }

    return 'MCP 服務器已啟動，但需要 OpenAI API 密鑰來提供完整的 AI 功能。您仍然可以通過直接調用工具來管理員工狀態。'
  }

  getMcpServer(): WeasleyTrackerMcpServer {
    return this.mcpServer
  }

  isInitialized(): boolean {
    return this.initialized
  }

  hasLLMCapability(): boolean {
    return this.openai !== null
  }

  // Phase 6 Enhancement: OpenAI Function Calling Integration
  private getAvailableTools(): ToolDefinition[] {
    return [
      {
        type: 'function',
        function: {
          name: 'getUserStatus',
          description: 'Get the current status of a specific user by their ID or name',
          parameters: {
            type: 'object',
            properties: {
              userId: { type: 'string', description: 'User ID or name to query status for' },
            },
            required: ['userId'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getUsersInStatus',
          description: 'Get all users who currently have a specific status',
          parameters: {
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
        },
      },
      {
        type: 'function',
        function: {
          name: 'getAllUserStatuses',
          description: 'Get current status of all users in the system',
          parameters: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'updateUserStatus',
          description: 'Update a user\'s status with optional description',
          parameters: {
            type: 'object',
            properties: {
              userId: { type: 'string', description: 'User ID or name to update status for' },
              status: {
                type: 'string',
                enum: ['on_duty', 'off_duty', 'on_leave', 'wfh', 'out', 'meeting'],
                description: 'New status to set for the user',
              },
              statusDetail: { type: 'string', description: 'Optional description or additional details about the status' },
            },
            required: ['userId', 'status'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'refreshUserStatus',
          description: 'Apply time-based automatic status logic to a specific user',
          parameters: {
            type: 'object',
            properties: {
              userId: { type: 'string', description: 'User ID or name to refresh status for' },
            },
            required: ['userId'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'refreshAllStatuses',
          description: 'Apply time-based automatic status logic to all users',
          parameters: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
      },
      // Phase 6 New Batch Query Tools
      {
        type: 'function',
        function: {
          name: 'queryUsersByDepartment',
          description: 'Get all users in a specific department with their current statuses',
          parameters: {
            type: 'object',
            properties: {
              department: { type: 'string', description: 'Department name to filter users by' },
            },
            required: ['department'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'queryUsersByMultipleStatuses',
          description: 'Get users who have any of the specified statuses',
          parameters: {
            type: 'object',
            properties: {
              statuses: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['on_duty', 'off_duty', 'on_leave', 'wfh', 'out', 'meeting'],
                },
                description: 'Array of status types to filter by',
              },
            },
            required: ['statuses'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'bulkStatusUpdate',
          description: 'Update status for multiple users at once',
          parameters: {
            type: 'object',
            properties: {
              userIds: { type: 'array', items: { type: 'string' }, description: 'Array of user IDs or names to update' },
              status: {
                type: 'string',
                enum: ['on_duty', 'off_duty', 'on_leave', 'wfh', 'out', 'meeting'],
                description: 'New status to set for all users',
              },
              statusDetail: { type: 'string', description: 'Optional description for all updates' },
            },
            required: ['userIds', 'status'],
          },
        },
      },
    ]
  }

  private async callMcpTool(toolName: string, args: any): Promise<any> {
    // Import handlers directly for tool execution
    const {
      handleGetUserStatus,
      handleGetUsersInStatus,
      handleGetAllUserStatuses,
      handleUpdateUserStatus,
      handleRefreshUserStatus,
      handleRefreshAllStatuses,
      handleQueryUsersByDepartment,
      handleQueryUsersByMultipleStatuses,
      handleBulkStatusUpdate,
    } = await import('./tools/index.js')

    try {
      switch (toolName) {
        case 'getUserStatus':
          return await handleGetUserStatus(args)
        case 'getUsersInStatus':
          return await handleGetUsersInStatus(args)
        case 'getAllUserStatuses':
          return await handleGetAllUserStatuses()
        case 'updateUserStatus':
          return await handleUpdateUserStatus(args)
        case 'refreshUserStatus':
          return await handleRefreshUserStatus(args)
        case 'refreshAllStatuses':
          return await handleRefreshAllStatuses()
        case 'queryUsersByDepartment':
          return await handleQueryUsersByDepartment(args)
        case 'queryUsersByMultipleStatuses':
          return await handleQueryUsersByMultipleStatuses(args)
        case 'bulkStatusUpdate':
          return await handleBulkStatusUpdate(args)
        default:
          throw new Error(`Unknown tool: ${toolName}`)
      }
    }
    catch (error) {
      console.error(`Error calling MCP tool ${toolName}:`, error)
      throw error
    }
  }

  // Phase 6 Enhancement: Conversation Context Management
  private conversationContexts = new Map<string, ConversationContext>()

  createConversationContext(sessionId: string, initialPreferences?: ConversationContext['userPreferences']): ConversationContext {
    const context: ConversationContext = {
      recentMessages: [],
      userPreferences: initialPreferences || {},
      activeTopics: [],
      sessionId,
    }
    this.conversationContexts.set(sessionId, context)
    return context
  }

  updateConversationContext(sessionId: string, message: ConversationMessage, topics?: string[]): void {
    const context = this.conversationContexts.get(sessionId)
    if (!context)
      return

    context.recentMessages.push(message)
    if (context.recentMessages.length > 20) {
      context.recentMessages = context.recentMessages.slice(-20)
    }

    if (topics) {
      context.activeTopics = [...new Set([...context.activeTopics, ...topics])]
      if (context.activeTopics.length > 5) {
        context.activeTopics = context.activeTopics.slice(-5)
      }
    }
  }

  getConversationContext(sessionId: string): ConversationContext | undefined {
    return this.conversationContexts.get(sessionId)
  }

  clearConversationContext(sessionId: string): void {
    this.conversationContexts.delete(sessionId)
  }
}
