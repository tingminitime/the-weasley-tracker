import type { ChatMessage, StatusType, TimeSlot } from '@shared/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useAuthStore } from './auth'
import { useDataStore } from './data'

export const useChatStore = defineStore('chat', () => {
  const dataStore = useDataStore()
  const authStore = useAuthStore()

  const messages = ref<ChatMessage[]>([])
  const isTyping = ref(false)

  const conversationHistory = computed(() => messages.value)

  function generateMessageId(): string {
    return Date.now().toString() + Math.random().toString(36).substring(2, 11)
  }

  async function sendUserMessage(content: string) {
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      content: content.trim(),
      type: 'user',
      timestamp: new Date(),
    }

    messages.value.push(userMessage)

    // Process AI response
    await processAIResponse(content)
  }

  async function processAIResponse(userInput: string) {
    // Show typing indicator
    isTyping.value = true
    const typingMessage: ChatMessage = {
      id: 'typing',
      content: '',
      type: 'ai',
      timestamp: new Date(),
      isTyping: true,
    }
    messages.value.push(typingMessage)

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

    // Remove typing indicator
    messages.value = messages.value.filter(msg => msg.id !== 'typing')
    isTyping.value = false

    // Generate AI response
    const response = await generateMockAIResponse(userInput)

    const aiMessage: ChatMessage = {
      id: generateMessageId(),
      content: response,
      type: 'ai',
      timestamp: new Date(),
    }

    messages.value.push(aiMessage)
  }

  async function generateMockAIResponse(userInput: string): Promise<string> {
    const input = userInput.toLowerCase()

    // Status query patterns
    if (input.includes('現在在做什麼') || input.includes('現在的狀態') || input.includes('狀態是什麼')) {
      return await handleStatusQuery(userInput)
    }

    // Batch queries
    if (input.includes('有誰') || input.includes('誰在') || input.includes('哪些人')) {
      return await handleBatchQuery(userInput)
    }

    // Status updates
    if (input.includes('我要') || input.includes('我現在') || input.includes('我在')
      || input.includes('外出') || input.includes('會議') || input.includes('家工作')
      || input.includes('請假') || input.includes('下班')) {
      return await handleStatusUpdate(userInput)
    }

    // Default responses
    const defaultResponses = [
      '我理解您的問題。您可以詢問同事的狀態，或告訴我您的狀態變化。',
      '您可以問我：「小王現在在做什麼？」或「我要外出，下午3點回來」',
      '我可以幫您查詢狀態或更新您的狀態。請告訴我您需要什麼幫助。',
    ]

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
  }

  async function handleStatusQuery(userInput: string): Promise<string> {
    // Extract user names from input
    const users = dataStore.users
    const foundUser = users.find(user => userInput.includes(user.name))

    if (foundUser) {
      const userStatus = dataStore.getUserStatusById(foundUser.id)
      const attendance = dataStore.getAttendanceByUserId(foundUser.id)
      const calendar = dataStore.getCalendarByUserId(foundUser.id)

      if (userStatus) {
        const statusText = getStatusText(userStatus.currentStatus)
        const detail = userStatus.statusDetail ? `（${userStatus.statusDetail}）` : ''
        const lastUpdated = userStatus.lastUpdated.toLocaleTimeString('zh-TW', {
          hour: '2-digit',
          minute: '2-digit',
        })

        return `${foundUser.name} 目前的狀態是：${statusText}${detail}\n最後更新時間：${lastUpdated}`
      }
      else {
        return `找不到 ${foundUser.name} 的狀態資料。`
      }
    }
    else {
      return '請告訴我您想查詢哪位同事的狀態，例如：「小王現在在做什麼？」'
    }
  }

  async function handleBatchQuery(userInput: string): Promise<string> {
    const input = userInput.toLowerCase()

    // Query by status type
    let targetStatus: StatusType | null = null
    if (input.includes('會議'))
      targetStatus = 'meeting'
    else if (input.includes('外出'))
      targetStatus = 'out'
    else if (input.includes('請假'))
      targetStatus = 'on_leave'
    else if (input.includes('家工作') || input.includes('居家'))
      targetStatus = 'wfh'
    else if (input.includes('上班') || input.includes('在公司'))
      targetStatus = 'on_duty'
    else if (input.includes('下班'))
      targetStatus = 'off_duty'

    const usersWithStatus = dataStore.getUsersWithStatus()
    let filteredUsers = usersWithStatus

    if (targetStatus) {
      filteredUsers = usersWithStatus.filter(userData =>
        userData.status?.currentStatus === targetStatus,
      )
    }

    if (filteredUsers.length === 0) {
      const statusText = targetStatus ? getStatusText(targetStatus) : '符合條件'
      return `目前沒有${statusText}的同事。`
    }

    const results = filteredUsers.map((userData) => {
      const status = userData.status?.currentStatus
      const statusText = status ? getStatusText(status) : '未知'
      const detail = userData.status?.statusDetail ? `（${userData.status.statusDetail}）` : ''
      return `• ${userData.user.name}: ${statusText}${detail}`
    })

    const statusTypeText = targetStatus ? getStatusText(targetStatus) : '目前狀態'
    return `${statusTypeText}的同事有：\n\n${results.join('\n')}`
  }

  async function handleStatusUpdate(userInput: string): Promise<string> {
    if (!authStore.currentUser) {
      return '請先登入才能更新狀態。'
    }

    const userId = authStore.currentUser.id
    const userName = authStore.currentUser.name
    const input = userInput.toLowerCase()

    let newStatus: StatusType
    let statusDetail = ''
    let endTime: Date

    // Parse status from input
    if (input.includes('外出')) {
      newStatus = 'out'
      statusDetail = '外出'
      // Extract time if mentioned
      const timeMatch = input.match(/(\d{1,2})[點時:]?(\d{0,2})/g)
      if (timeMatch) {
        const time = timeMatch[timeMatch.length - 1] // Use last time mentioned
        endTime = parseTimeString(time)
      }
      else {
        endTime = new Date()
        endTime.setHours(17, 30, 0, 0) // Default end of workday
      }
    }
    else if (input.includes('會議')) {
      newStatus = 'meeting'
      statusDetail = '會議中'
      endTime = new Date()
      endTime.setHours(endTime.getHours() + 1) // Default 1 hour
    }
    else if (input.includes('家工作') || input.includes('居家')) {
      newStatus = 'wfh'
      statusDetail = '居家辦公'
      endTime = new Date()
      endTime.setHours(17, 30, 0, 0)
    }
    else if (input.includes('請假')) {
      newStatus = 'on_leave'
      statusDetail = '請假'
      endTime = new Date()
      endTime.setHours(23, 59, 59, 999)
    }
    else if (input.includes('下班')) {
      newStatus = 'off_duty'
      statusDetail = '已下班'
      endTime = new Date()
      endTime.setHours(8, 30, 0, 0)
      endTime.setDate(endTime.getDate() + 1) // Next working day
    }
    else {
      newStatus = 'on_duty'
      statusDetail = '上班中'
      endTime = new Date()
      endTime.setHours(17, 30, 0, 0)
    }

    // Create new time slot
    const timeSlot: TimeSlot = {
      id: generateMessageId(),
      startTime: new Date(),
      endTime,
      status: newStatus,
      statusDetail,
      source: 'ai_modified',
      priority: 3,
      createdAt: new Date(),
      expiresAt: endTime,
    }

    // Update user status
    const currentStatus = dataStore.getUserStatusById(userId)
    const updatedStatus = {
      userId,
      name: userName,
      currentStatus: newStatus,
      statusDetail,
      lastUpdated: new Date(),
      expiresAt: endTime,
      timeSlots: currentStatus ? [timeSlot, ...currentStatus.timeSlots] : [timeSlot],
    }

    try {
      const result = await dataStore.updateUserStatus(updatedStatus)
      if (result.success) {
        const statusText = getStatusText(newStatus)
        const endTimeText = endTime.toLocaleTimeString('zh-TW', {
          hour: '2-digit',
          minute: '2-digit',
        })
        return `已為您更新狀態為：${statusText}${statusDetail ? `（${statusDetail}）` : ''}\n預計結束時間：${endTimeText}`
      }
      else {
        return `更新狀態失敗：${result.error || '未知錯誤'}`
      }
    }
    catch (error) {
      return `更新狀態時發生錯誤：${String(error)}`
    }
  }

  function parseTimeString(timeStr: string): Date {
    const match = timeStr.match(/(\d{1,2})(?:[點時:](\d{0,2}))?/)
    if (match) {
      const hour = Number.parseInt(match[1])
      const minute = match[2] ? Number.parseInt(match[2]) : 0

      const date = new Date()
      date.setHours(hour, minute, 0, 0)

      // If time is before current time, assume next day
      if (date < new Date()) {
        date.setDate(date.getDate() + 1)
      }

      return date
    }

    // Default to end of workday
    const date = new Date()
    date.setHours(17, 30, 0, 0)
    return date
  }

  function getStatusText(status: StatusType): string {
    switch (status) {
      case 'on_duty': return '上班中'
      case 'off_duty': return '已下班'
      case 'on_leave': return '請假'
      case 'wfh': return '居家辦公'
      case 'out': return '外出'
      case 'meeting': return '會議中'
      default: return '未知狀態'
    }
  }

  function clearMessages() {
    messages.value = []
  }

  return {
    // State
    messages,
    isTyping,

    // Getters
    conversationHistory,

    // Actions
    sendUserMessage,
    clearMessages,
  }
})
