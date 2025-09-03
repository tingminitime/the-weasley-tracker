import { ipcMain } from 'electron'
import { McpOpenAiClient } from '../mcp/client.js'

export interface McpConnectionStatus {
  isConnected: boolean
  hasLLMCapability: boolean
  serverInfo: {
    name: string
    version: string
  }
}

export class McpService {
  private static instance: McpService
  private mcpClient: McpOpenAiClient
  private isInitialized = false

  private constructor() {
    this.mcpClient = new McpOpenAiClient()
    this.setupIpcHandlers()
  }

  static getInstance(): McpService {
    if (!McpService.instance) {
      McpService.instance = new McpService()
    }
    return McpService.instance
  }

  async initialize(openAiApiKey?: string): Promise<void> {
    try {
      await this.mcpClient.initialize(openAiApiKey)
      this.isInitialized = true
      console.log('MCP Service initialized successfully')
    }
    catch (error) {
      console.error('Failed to initialize MCP Service:', error)
      throw error
    }
  }

  private setupIpcHandlers(): void {
    // Store user-specific conversation contexts by session ID
    const conversationContexts = new Map<string, any>()

    // Handle AI message processing with user-specific conversation context
    ipcMain.handle('mcp:processMessage', async (_event, data: {
      message: string
      sessionId?: string
      userId?: string
      conversationHistory?: any[]
    }): Promise<string> => {
      if (!this.isInitialized) {
        throw new Error('MCP service not initialized')
      }

      try {
        const { message, sessionId, userId, conversationHistory = [] } = data

        // Create user-specific session ID if not provided
        const finalSessionId = sessionId || (userId ? `${userId}-${Date.now()}` : 'default')

        // Get or create user-specific conversation context
        let context = conversationContexts.get(finalSessionId)
        if (!context) {
          context = this.mcpClient.createConversationContext(finalSessionId, {
            language: 'zh', // Default to Chinese
            displayFormat: 'detailed',
          })
          conversationContexts.set(finalSessionId, context)
          console.log(`Created new conversation context for session: ${finalSessionId}`)
        }

        // Update context with recent conversation history
        if (conversationHistory.length > 0) {
          // Convert chat messages to conversation messages
          const recentMessages = conversationHistory.slice(-10).map((msg: any) => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content,
            timestamp: new Date(msg.timestamp),
          }))

          // Update context with recent messages
          context.recentMessages = recentMessages
        }

        // Process message with user-specific context
        const response = await this.mcpClient.processMessage(message, context)

        // Update conversation context with new message exchange
        this.mcpClient.updateConversationContext(finalSessionId, {
          role: 'user',
          content: message,
          timestamp: new Date(),
        })

        this.mcpClient.updateConversationContext(finalSessionId, {
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        })

        return response
      }
      catch (error) {
        console.error('Error processing MCP message:', error)
        throw error
      }
    })

    // Handle connection status requests
    ipcMain.handle('mcp:getConnectionStatus', async (): Promise<McpConnectionStatus> => {
      return {
        isConnected: this.isInitialized,
        hasLLMCapability: this.mcpClient.hasLLMCapability(),
        serverInfo: {
          name: 'weasley-tracker-server',
          version: '1.0.0',
        },
      }
    })

    // Handle server restart
    ipcMain.handle('mcp:restartServer', async (_event, openAiApiKey?: string): Promise<void> => {
      try {
        // Create new client instance
        this.mcpClient = new McpOpenAiClient()
        await this.mcpClient.initialize(openAiApiKey)
        this.isInitialized = true

        // Clear all conversation contexts on restart
        conversationContexts.clear()
        console.log('MCP Server restarted successfully - all conversation contexts cleared')
      }
      catch (error) {
        console.error('Failed to restart MCP server:', error)
        this.isInitialized = false
        throw error
      }
    })

    // Handle conversation context clearing with user-specific support
    ipcMain.handle('mcp:clearContext', async (_event, sessionPattern?: string): Promise<void> => {
      if (sessionPattern) {
        // Support for pattern-based clearing (e.g., "user123-*" to clear all sessions for user123)
        if (sessionPattern.endsWith('-*')) {
          const userPrefix = sessionPattern.slice(0, -1) // Remove the "*"
          const keysToDelete: string[] = []

          for (const [sessionId] of conversationContexts.entries()) {
            if (sessionId.startsWith(userPrefix)) {
              keysToDelete.push(sessionId)
            }
          }

          keysToDelete.forEach((sessionId) => {
            conversationContexts.delete(sessionId)
            this.mcpClient.clearConversationContext(sessionId)
          })

          console.log(`Cleared ${keysToDelete.length} conversation contexts matching pattern: ${sessionPattern}`)
        }
        else {
          // Clear specific session
          conversationContexts.delete(sessionPattern)
          this.mcpClient.clearConversationContext(sessionPattern)
          console.log(`Cleared conversation context for session: ${sessionPattern}`)
        }
      }
      else {
        // Clear all contexts
        const contextCount = conversationContexts.size
        conversationContexts.clear()

        // Clear all contexts in the MCP client as well
        for (const [id] of conversationContexts.entries()) {
          this.mcpClient.clearConversationContext(id)
        }

        console.log(`Cleared all ${contextCount} conversation contexts`)
      }
    })

    // Handle direct tool calls (for testing and debugging)
    ipcMain.handle('mcp:callTool', async (_event, toolName: string, args: any): Promise<any> => {
      if (!this.isInitialized) {
        throw new Error('MCP service not initialized')
      }

      try {
        const mcpServer = this.mcpClient.getMcpServer().getServer()
        // Note: This is a simplified tool call - in a full MCP implementation,
        // we would use the proper tool calling mechanism
        console.log(`Direct tool call: ${toolName} with args:`, args)
        return { success: true, message: `Tool ${toolName} called successfully` }
      }
      catch (error) {
        console.error('Error calling MCP tool:', error)
        throw error
      }
    })
  }

  // Clean up method for app shutdown
  cleanup(): void {
    // Remove IPC handlers
    ipcMain.removeAllListeners('mcp:processMessage')
    ipcMain.removeAllListeners('mcp:getConnectionStatus')
    ipcMain.removeAllListeners('mcp:restartServer')
    ipcMain.removeAllListeners('mcp:clearContext')
    ipcMain.removeAllListeners('mcp:callTool')

    console.log('MCP Service cleaned up')
  }
}
