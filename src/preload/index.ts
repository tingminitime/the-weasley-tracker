import type { AttendanceRecord, CalendarEvent, LoginRequest, MockUser, UserStatus } from '@shared/types'
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
