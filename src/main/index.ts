import fs from 'node:fs'
import { join } from 'node:path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { initializeMockData } from '@shared/mockData'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import icon from '../../resources/icon.png?asset'
import { dataStore } from './stores/DataStore'

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
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
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
