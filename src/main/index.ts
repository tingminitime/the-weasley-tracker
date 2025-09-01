import fs from 'node:fs'
import { join } from 'node:path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { initializeMockData } from '@shared/mockData'
import { app, BrowserWindow, ipcMain, screen, shell } from 'electron'
import debug from 'electron-debug'
import icon from '../../resources/icon.png?asset'
import { dataStore } from './stores/DataStore'

debug()

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

  ipcMain.handle('data:initializeMockData', () => {
    try {
      const mockData = initializeMockData()
      dataStore.setUsers(mockData.users)
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

  ipcMain.handle('data:updateUserTag', (_, userId: string, tag: string) => {
    return dataStore.updateUserTag(userId, tag)
  })

  ipcMain.handle('data:getUserTag', (_, userId: string) => {
    return dataStore.getUserTag(userId)
  })

  // Custom Tags IPC handlers
  ipcMain.handle('data:getUserCustomTags', (_, userId: string) => {
    return dataStore.getUserCustomTags(userId)
  })

  ipcMain.handle('data:addUserCustomTag', (_, userId: string, tag: string) => {
    return dataStore.addUserCustomTag(userId, tag)
  })

  ipcMain.handle('data:updateUserCustomTag', (_, userId: string, oldTag: string, newTag: string) => {
    return dataStore.updateUserCustomTag(userId, oldTag, newTag)
  })

  ipcMain.handle('data:deleteUserCustomTag', (_, userId: string, tag: string) => {
    return dataStore.deleteUserCustomTag(userId, tag)
  })

  // Simplified status refresh handler
  ipcMain.handle('data:refreshUserStatuses', () => {
    try {
      // Simple refresh: apply basic time boundary logic to all users
      const users = dataStore.getUsers()
      const now = new Date()
      const today = now.toISOString().split('T')[0]

      const refreshedStatuses = users.map((user) => {
        const existingStatus = dataStore.getUserStatusById(user.id)

        if (existingStatus && existingStatus.initializedDate === today) {
          // Same day - just update to basic time status
          const basicStatus = getBasicTimeStatus(now, user)
          return {
            ...existingStatus,
            currentStatus: basicStatus,
            statusDetail: undefined,
            lastUpdated: now,
            statusHistory: [...existingStatus.statusHistory, {
              id: `refresh-${user.id}-${now.getTime()}`,
              status: basicStatus,
              timestamp: now,
              source: 'system' as const,
            }],
          }
        }
        else {
          // Cross-day or new status - reinitialize
          const basicStatus = getBasicTimeStatus(now, user)
          return {
            userId: user.id,
            name: user.name,
            currentStatus: basicStatus,
            lastUpdated: now,
            initializedDate: today,
            statusHistory: [{
              id: `init-${user.id}-${today}`,
              status: basicStatus,
              timestamp: now,
              source: 'system' as const,
            }],
          }
        }
      })

      dataStore.setUserStatuses(refreshedStatuses)
      return { success: true }
    }
    catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // Helper function for basic time status
  function getBasicTimeStatus(currentTime: Date, user: any): 'on_duty' | 'off_duty' {
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

  // Simplified batch data handler
  ipcMain.handle('data:batchGetUserData', (_, userIds: string[]) => {
    return dataStore.batchGetUserData(userIds)
  })

  ipcMain.handle('data:getUserStatusStats', () => {
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
