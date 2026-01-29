import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer - IPC communication with main process
const api = {
  expenses: {
    getAll: () => ipcRenderer.invoke('db:expenses:getAll'),
    getFiltered: (filters: unknown) => ipcRenderer.invoke('db:expenses:getFiltered', filters),
    create: (input: unknown) => ipcRenderer.invoke('db:expenses:create', input),
    update: (id: number, input: unknown) => ipcRenderer.invoke('db:expenses:update', { id, data: input }),
    delete: (id: number) => ipcRenderer.invoke('db:expenses:delete', id)
  },
  categories: {
    getAll: () => ipcRenderer.invoke('db:categories:getAll'),
    create: (input: unknown) => ipcRenderer.invoke('db:categories:create', input),
    update: (id: number, input: unknown) => ipcRenderer.invoke('db:categories:update', { id, data: input }),
    delete: (id: number) => ipcRenderer.invoke('db:categories:delete', id)
  },
  subcategories: {
    getByCategory: (categoryId: number) => ipcRenderer.invoke('db:subcategories:getByCategory', categoryId),
    create: (input: unknown) => ipcRenderer.invoke('db:subcategories:create', input),
    delete: (id: number) => ipcRenderer.invoke('db:subcategories:delete', id)
  },
  reports: {
    monthlySummary: (year: number, month: number) => ipcRenderer.invoke('db:reports:monthlySummary', { year, month }),
    cycleSummary: (year: number, month: number, startDay: number) => ipcRenderer.invoke('db:reports:cycleSummary', { year, month, startDay }),
    categoryBreakdown: (dateFrom: string, dateTo: string) => ipcRenderer.invoke('db:reports:categoryBreakdown', { dateFrom, dateTo })
  },
  settings: {
    get: (key: string) => ipcRenderer.invoke('db:settings:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('db:settings:set', { key, value })
  },
  sync: {
    status: () => ipcRenderer.invoke('sync:status'),
    authenticate: () => ipcRenderer.invoke('sync:authenticate'),
    push: () => ipcRenderer.invoke('sync:push'),
    pull: () => ipcRenderer.invoke('sync:pull'),
    bidirectional: () => ipcRenderer.invoke('sync:bidirectional'),
    logout: () => ipcRenderer.invoke('sync:logout')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
