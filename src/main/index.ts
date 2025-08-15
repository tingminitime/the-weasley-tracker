import fs from 'node:fs'
import { join } from 'node:path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { initializeMockData } from '@shared/mockData'
import { app, BrowserWindow, ipcMain, screen, shell } from 'electron'
import debug from 'electron-debug'
import icon from '../../resources/icon.png?asset'
import { DataSynchronizer } from './services/DataSynchronizer'
import { StatusManager } from './services/StatusManager'
import { dataStore } from './stores/DataStore'

debug()

// Initialize business logic services
const statusManager = new StatusManager(dataStore)
const dataSynchronizer = new DataSynchronizer(dataStore, statusManager)

function shouldDisableGPU() {
  // 1. 明確的環境變數控制
  if (process.env.ELECTRON_DISABLE_GPU === '1') {
    return true
  }

  // 2. 自動檢測 WSL
  if (process.platform === 'linux') {
    try {
      const version = fs.readFileSync('/proc/version', 'utf8')
      if (version.toLowerCase().includes('microsoft')
        || version.toLowerCase().includes('wsl')) {
        console.log('檢測到 WSL 環境，自動禁用 GPU 加速')
        return true
      }
    }
    catch {
      // 無法讀取，不做處理
    }
  }

  return false
}

if (shouldDisableGPU()) {
  app.disableHardwareAcceleration()
}

function createWindow(): void {
  const display = screen.getPrimaryDisplay()
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: Math.min(1600, Math.floor(display.workAreaSize.width * 0.8)), // 最大1200px，或螢幕寬度的80%
    height: Math.min(900, Math.floor(display.workAreaSize.height * 0.85)), // 最大800px，或螢幕高度的85%
    show: false,
    autoHideMenuBar: true,
    title: 'The Weasley Tracker',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  }
  else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.disableHardwareAcceleration()

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Data operations IPC handlers
  ipcMain.handle('data:getUsers', () => {
    return dataStore.getUsers()
  })

  ipcMain.handle('data:getUserById', (_, userId: string) => {
    return dataStore.getUserById(userId)
  })

  ipcMain.handle('data:login', (_, request) => {
    return dataStore.login(request)
  })

  ipcMain.handle('data:logout', () => {
    return dataStore.logout()
  })

  ipcMain.handle('data:getAuthSession', () => {
    return dataStore.getAuthSession()
  })

  ipcMain.handle('data:getCurrentUser', () => {
    return dataStore.getCurrentUser()
  })

  ipcMain.handle('data:getUserStatuses', () => {
    return dataStore.getUserStatuses()
  })

  ipcMain.handle('data:getUserStatusById', (_, userId: string) => {
    return dataStore.getUserStatusById(userId)
  })

  ipcMain.handle('data:updateUserStatus', (_, status) => {
    return dataStore.updateUserStatus(status)
  })

  ipcMain.handle('data:getAttendanceRecords', () => {
    return dataStore.getAttendanceRecords()
  })

  ipcMain.handle('data:getAttendanceRecordsByUserId', (_, userId: string) => {
    return dataStore.getAttendanceRecordsByUserId(userId)
  })

  ipcMain.handle('data:getCalendarEvents', () => {
    return dataStore.getCalendarEvents()
  })

  ipcMain.handle('data:getCalendarEventsByUserId', (_, userId: string) => {
    return dataStore.getCalendarEventsByUserId(userId)
  })

  ipcMain.handle('data:initializeMockData', () => {
    try {
      const mockData = initializeMockData()
      dataStore.setUsers(mockData.users)
      dataStore.setAttendanceRecords(mockData.attendanceRecords)
      dataStore.setCalendarEvents(mockData.calendarEvents)
      dataStore.setUserStatuses(mockData.userStatuses)
      return { success: true }
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('data:reset', () => {
    try {
      dataStore.reset()
      return { success: true }
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // Status Management IPC handlers
  ipcMain.handle('status:updateUserStatus', (_, request) => {
    return statusManager.updateUserStatus(request)
  })

  ipcMain.handle('status:refreshUserStatus', (_, userId: string) => {
    return statusManager.refreshUserStatus(userId)
  })

  ipcMain.handle('status:refreshAllUserStatuses', () => {
    return statusManager.refreshAllUserStatuses()
  })

  ipcMain.handle('status:queryUserStatuses', (_, query) => {
    return statusManager.queryUserStatuses(query)
  })

  ipcMain.handle('status:cleanupExpiredStatuses', () => {
    return statusManager.cleanupExpiredStatuses()
  })

  ipcMain.handle('status:getStatusHistory', (_, userId: string, days?: number) => {
    return statusManager.getStatusHistory(userId, days)
  })

  ipcMain.handle('status:removeTimeSlot', (_, userId: string, timeSlotId: string) => {
    return statusManager.removeTimeSlot(userId, timeSlotId)
  })

  ipcMain.handle('status:getActiveUsers', () => {
    return statusManager.getActiveUsers()
  })

  ipcMain.handle('status:getUsersInMeetings', () => {
    return statusManager.getUsersInMeetings()
  })

  ipcMain.handle('status:getUsersOnLeave', () => {
    return statusManager.getUsersOnLeave()
  })

  ipcMain.handle('status:getWorkingFromHomeUsers', () => {
    return statusManager.getWorkingFromHomeUsers()
  })

  ipcMain.handle('status:scheduleStatusUpdate', (_, request) => {
    return statusManager.scheduleStatusUpdate(request)
  })

  // Data Synchronization IPC handlers
  ipcMain.handle('sync:syncAllData', (_, options) => {
    return dataSynchronizer.syncAllData(options)
  })

  ipcMain.handle('sync:syncAttendanceData', (_, options) => {
    return dataSynchronizer.syncAttendanceData(options)
  })

  ipcMain.handle('sync:syncCalendarData', (_, options) => {
    return dataSynchronizer.syncCalendarData(options)
  })

  ipcMain.handle('sync:refreshUserStatuses', (_, options) => {
    return dataSynchronizer.refreshUserStatuses(options)
  })

  ipcMain.handle('sync:getLastSyncInfo', () => {
    return dataSynchronizer.getLastSyncInfo()
  })

  ipcMain.handle('sync:validateDataConsistency', () => {
    return dataSynchronizer.validateDataConsistency()
  })

  // Enhanced DataStore IPC handlers
  ipcMain.handle('dataStore:addTimeSlotToUser', (_, userId: string, timeSlot) => {
    return dataStore.addTimeSlotToUser(userId, timeSlot)
  })

  ipcMain.handle('dataStore:removeTimeSlotFromUser', (_, userId: string, timeSlotId: string) => {
    return dataStore.removeTimeSlotFromUser(userId, timeSlotId)
  })

  ipcMain.handle('dataStore:updateTimeSlotInUser', (_, userId: string, timeSlot) => {
    return dataStore.updateTimeSlotInUser(userId, timeSlot)
  })

  ipcMain.handle('dataStore:getTimeSlotsByUserId', (_, userId: string) => {
    return dataStore.getTimeSlotsByUserId(userId)
  })

  ipcMain.handle('dataStore:getTimeSlotsBySource', (_, source) => {
    return dataStore.getTimeSlotsBySource(source)
  })

  ipcMain.handle('dataStore:bulkUpdateUserStatuses', (_, statuses) => {
    return dataStore.bulkUpdateUserStatuses(statuses)
  })

  ipcMain.handle('dataStore:cleanupExpiredTimeSlots', () => {
    return dataStore.cleanupExpiredTimeSlots()
  })

  ipcMain.handle('dataStore:batchGetUserData', (_, userIds: string[]) => {
    return dataStore.batchGetUserData(userIds)
  })

  ipcMain.handle('dataStore:getUserStatusStats', () => {
    return dataStore.getUserStatusStats()
  })

  createWindow()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0)
      createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
