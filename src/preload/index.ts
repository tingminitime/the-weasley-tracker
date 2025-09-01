import type {
  LoginRequest,
  MockUser,
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

  // Simplified status refresh API
  refreshUserStatuses: () => ipcRenderer.invoke('data:refreshUserStatuses'),

  // Batch operations
  batchGetUserData: (userIds: string[]) => ipcRenderer.invoke('data:batchGetUserData', userIds),
  getUserStatusStats: () => ipcRenderer.invoke('data:getUserStatusStats'),
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
