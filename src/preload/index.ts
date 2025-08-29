import type {
  AttendanceRecord,
  CalendarEvent,
  LoginRequest,
  MockUser,
  TimeSlot,
  UserStatus,
} from '@shared/types'
import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {
  // Authentication APIs
  login: (request: LoginRequest) => ipcRenderer.invoke('data:login', request),
  logout: () => ipcRenderer.invoke('data:logout'),
  getAuthSession: () => ipcRenderer.invoke('data:getAuthSession'),
  getCurrentUser: () => ipcRenderer.invoke('data:getCurrentUser'),

  // User APIs
  getUsers: (): Promise<MockUser[]> => ipcRenderer.invoke('data:getUsers'),
  getUserById: (userId: string): Promise<MockUser | undefined> =>
    ipcRenderer.invoke('data:getUserById', userId),

  // User Status APIs
  getUserStatuses: (): Promise<UserStatus[]> => ipcRenderer.invoke('data:getUserStatuses'),
  getUserStatusById: (userId: string): Promise<UserStatus | undefined> =>
    ipcRenderer.invoke('data:getUserStatusById', userId),
  updateUserStatus: (status: UserStatus) => ipcRenderer.invoke('data:updateUserStatus', status),

  // Attendance APIs
  getAttendanceRecords: (): Promise<AttendanceRecord[]> => ipcRenderer.invoke('data:getAttendanceRecords'),
  getAttendanceRecordsByUserId: (userId: string): Promise<AttendanceRecord[]> =>
    ipcRenderer.invoke('data:getAttendanceRecordsByUserId', userId),

  // Calendar APIs
  getCalendarEvents: (): Promise<CalendarEvent[]> => ipcRenderer.invoke('data:getCalendarEvents'),
  getCalendarEventsByUserId: (userId: string): Promise<CalendarEvent[]> =>
    ipcRenderer.invoke('data:getCalendarEventsByUserId', userId),

  // Utility APIs
  initializeMockData: () => ipcRenderer.invoke('data:initializeMockData'),
  resetData: () => ipcRenderer.invoke('data:reset'),
  updateUserTag: (userId: string, tag: string) => ipcRenderer.invoke('data:updateUserTag', userId, tag),
  getUserTag: (userId: string) => ipcRenderer.invoke('data:getUserTag', userId),

  // Custom Tags APIs
  getUserCustomTags: (userId: string): Promise<string[]> => ipcRenderer.invoke('data:getUserCustomTags', userId),
  addUserCustomTag: (userId: string, tag: string) => ipcRenderer.invoke('data:addUserCustomTag', userId, tag),
  updateUserCustomTag: (userId: string, oldTag: string, newTag: string) => ipcRenderer.invoke('data:updateUserCustomTag', userId, oldTag, newTag),
  deleteUserCustomTag: (userId: string, tag: string) => ipcRenderer.invoke('data:deleteUserCustomTag', userId, tag),

  // Status Management APIs
  statusUpdateUserStatus: (request: any) => ipcRenderer.invoke('status:updateUserStatus', request),
  statusRefreshUserStatus: (userId: string) => ipcRenderer.invoke('status:refreshUserStatus', userId),
  statusRefreshAllUserStatuses: () => ipcRenderer.invoke('status:refreshAllUserStatuses'),
  statusQueryUserStatuses: (query: any) => ipcRenderer.invoke('status:queryUserStatuses', query),
  statusCleanupExpiredStatuses: () => ipcRenderer.invoke('status:cleanupExpiredStatuses'),
  statusGetStatusHistory: (userId: string, days?: number) =>
    ipcRenderer.invoke('status:getStatusHistory', userId, days),
  statusRemoveTimeSlot: (userId: string, timeSlotId: string) =>
    ipcRenderer.invoke('status:removeTimeSlot', userId, timeSlotId),
  statusGetActiveUsers: () => ipcRenderer.invoke('status:getActiveUsers'),
  statusGetUsersInMeetings: () => ipcRenderer.invoke('status:getUsersInMeetings'),
  statusGetUsersOnLeave: () => ipcRenderer.invoke('status:getUsersOnLeave'),
  statusGetWorkingFromHomeUsers: () => ipcRenderer.invoke('status:getWorkingFromHomeUsers'),
  statusScheduleStatusUpdate: (request: any) => ipcRenderer.invoke('status:scheduleStatusUpdate', request),

  // Data Synchronization APIs
  syncAllData: (options?: any) => ipcRenderer.invoke('sync:syncAllData', options),
  syncAttendanceData: (options?: any) => ipcRenderer.invoke('sync:syncAttendanceData', options),
  syncCalendarData: (options?: any) => ipcRenderer.invoke('sync:syncCalendarData', options),
  syncRefreshUserStatuses: (options?: any) => ipcRenderer.invoke('sync:refreshUserStatuses', options),
  syncGetLastSyncInfo: () => ipcRenderer.invoke('sync:getLastSyncInfo'),
  syncValidateDataConsistency: () => ipcRenderer.invoke('sync:validateDataConsistency'),

  // Enhanced DataStore APIs
  dataStoreAddTimeSlotToUser: (userId: string, timeSlot: TimeSlot) =>
    ipcRenderer.invoke('dataStore:addTimeSlotToUser', userId, timeSlot),
  dataStoreRemoveTimeSlotFromUser: (userId: string, timeSlotId: string) =>
    ipcRenderer.invoke('dataStore:removeTimeSlotFromUser', userId, timeSlotId),
  dataStoreUpdateTimeSlotInUser: (userId: string, timeSlot: TimeSlot) =>
    ipcRenderer.invoke('dataStore:updateTimeSlotInUser', userId, timeSlot),
  dataStoreGetTimeSlotsByUserId: (userId: string): Promise<TimeSlot[]> =>
    ipcRenderer.invoke('dataStore:getTimeSlotsByUserId', userId),
  dataStoreGetTimeSlotsBySource: (source: 'attendance' | 'calendar' | 'ai_modified'): Promise<TimeSlot[]> =>
    ipcRenderer.invoke('dataStore:getTimeSlotsBySource', source),
  dataStoreBulkUpdateUserStatuses: (statuses: UserStatus[]) =>
    ipcRenderer.invoke('dataStore:bulkUpdateUserStatuses', statuses),
  dataStoreCleanupExpiredTimeSlots: () => ipcRenderer.invoke('dataStore:cleanupExpiredTimeSlots'),
  dataStoreBatchGetUserData: (userIds: string[]) =>
    ipcRenderer.invoke('dataStore:batchGetUserData', userIds),
  dataStoreGetUserStatusStats: () => ipcRenderer.invoke('dataStore:getUserStatusStats'),
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  }
  catch (error) {
    console.error(error)
  }
}
else {
  // @ts-expect-error (define in dts)
  window.electron = electronAPI
  // @ts-expect-error (define in dts)
  window.api = api
}
