import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

// Database imports
import { initDatabase, closeDatabase } from './database'
import * as expensesRepo from './database/repositories/expenses'
import * as categoriesRepo from './database/repositories/categories'
import * as subcategoriesRepo from './database/repositories/subcategories'
import * as reportsRepo from './database/repositories/reports'
import * as settingsRepo from './database/repositories/settings'

// Sync imports
import * as syncModule from './sync'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Register IPC handlers
function registerIpcHandlers(): void {
  // Expenses
  ipcMain.handle('db:expenses:getAll', () => {
    return expensesRepo.getAllExpenses()
  })

  ipcMain.handle('db:expenses:getFiltered', (_, filters) => {
    return expensesRepo.getFilteredExpenses(filters)
  })

  ipcMain.handle('db:expenses:create', (_, input) => {
    return expensesRepo.createExpense(input)
  })

  ipcMain.handle('db:expenses:update', (_, { id, data }) => {
    return expensesRepo.updateExpense(id, data)
  })

  ipcMain.handle('db:expenses:delete', (_, id) => {
    return expensesRepo.deleteExpense(id)
  })

  // Categories
  ipcMain.handle('db:categories:getAll', () => {
    return categoriesRepo.getAllCategories()
  })

  ipcMain.handle('db:categories:create', (_, input) => {
    return categoriesRepo.createCategory(input)
  })

  ipcMain.handle('db:categories:update', (_, { id, data }) => {
    return categoriesRepo.updateCategory(id, data)
  })

  ipcMain.handle('db:categories:delete', (_, id) => {
    return categoriesRepo.deleteCategory(id)
  })

  // Subcategories
  ipcMain.handle('db:subcategories:getByCategory', (_, categoryId) => {
    return subcategoriesRepo.getSubcategoriesByCategory(categoryId)
  })

  ipcMain.handle('db:subcategories:create', (_, input) => {
    return subcategoriesRepo.createSubcategory(input)
  })

  ipcMain.handle('db:subcategories:delete', (_, id) => {
    return subcategoriesRepo.deleteSubcategory(id)
  })

  // Reports
  ipcMain.handle('db:reports:monthlySummary', (_, { year, month }) => {
    return reportsRepo.getMonthlySummary(year, month)
  })

  ipcMain.handle('db:reports:categoryBreakdown', (_, { dateFrom, dateTo }) => {
    return reportsRepo.getCategoryBreakdown(dateFrom, dateTo)
  })

  // Settings
  ipcMain.handle('db:settings:get', (_, key) => {
    return settingsRepo.getSetting(key)
  })

  ipcMain.handle('db:settings:set', (_, { key, value }) => {
    const result = settingsRepo.setSetting(key, value)
    // Reset sync instance if OAuth credentials changed
    if (key === 'google_client_id' || key === 'google_client_secret') {
      syncModule.resetSyncInstance()
    }
    return result
  })

  // Sync
  ipcMain.handle('sync:status', async () => {
    return syncModule.getSyncStatus()
  })

  ipcMain.handle('sync:authenticate', async () => {
    return syncModule.authenticate()
  })

  ipcMain.handle('sync:push', async () => {
    return syncModule.pushToCloud()
  })

  ipcMain.handle('sync:pull', async () => {
    return syncModule.pullFromCloud()
  })

  ipcMain.handle('sync:bidirectional', async () => {
    return syncModule.syncBidirectional()
  })

  ipcMain.handle('sync:logout', async () => {
    return syncModule.logout()
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.expense-tracker')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialize database
  initDatabase()

  // Register IPC handlers
  registerIpcHandlers()

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  closeDatabase()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  closeDatabase()
})
