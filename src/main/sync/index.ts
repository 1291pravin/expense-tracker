import { SqliteCloudBackup, type SyncResult } from 'sqlite-cloud-backup'
import { getDatabasePath, closeDatabase, initDatabase } from '../database'
import { getSetting } from '../database/repositories/settings'

let syncInstance: SqliteCloudBackup | null = null

export interface SyncStatus {
  isConnected: boolean
  lastSync: number | null
}

function getSyncInstance(): SqliteCloudBackup | null {
  if (syncInstance) {
    return syncInstance
  }

  const clientId = getSetting('google_client_id')
  const clientSecret = getSetting('google_client_secret')

  if (!clientId || !clientSecret) {
    return null
  }

  syncInstance = new SqliteCloudBackup({
    dbPath: getDatabasePath(),
    provider: 'google-drive',
    credentials: {
      clientId,
      clientSecret
    },
    options: {
      logLevel: 'info'
    }
  })

  return syncInstance
}

export async function getSyncStatus(): Promise<SyncStatus> {
  const sync = getSyncInstance()
  if (!sync) {
    return { isConnected: false, lastSync: null }
  }

  try {
    const isAuthenticated = await sync.isAuthenticated()
    const lastSyncStr = getSetting('last_sync_timestamp')
    return {
      isConnected: isAuthenticated,
      lastSync: lastSyncStr ? parseInt(lastSyncStr, 10) : null
    }
  } catch {
    return { isConnected: false, lastSync: null }
  }
}

export async function authenticate(): Promise<boolean> {
  const sync = getSyncInstance()
  if (!sync) {
    throw new Error('Sync not configured. Please set Google OAuth credentials in settings.')
  }

  await sync.authenticate()
  return true
}

export async function logout(): Promise<boolean> {
  const sync = getSyncInstance()
  if (sync) {
    await sync.logout()
    syncInstance = null
  }
  return true
}

export async function pushToCloud(): Promise<SyncResult> {
  const sync = getSyncInstance()
  if (!sync) {
    throw new Error('Sync not configured. Please set Google OAuth credentials in settings.')
  }

  // Close database before sync to ensure all data is written
  closeDatabase()

  try {
    const result = await sync.pushToCloud()
    if (result.success) {
      // Reinitialize database
      initDatabase()
      // Update last sync timestamp
      const { setSetting } = await import('../database/repositories/settings')
      setSetting('last_sync_timestamp', result.timestamp.toString())
    }
    return result
  } finally {
    // Ensure database is reinitialized
    initDatabase()
  }
}

export async function pullFromCloud(): Promise<SyncResult> {
  const sync = getSyncInstance()
  if (!sync) {
    throw new Error('Sync not configured. Please set Google OAuth credentials in settings.')
  }

  // Close database before sync
  closeDatabase()

  try {
    const result = await sync.pullFromCloud()
    if (result.success) {
      // Reinitialize database
      initDatabase()
      // Update last sync timestamp
      const { setSetting } = await import('../database/repositories/settings')
      setSetting('last_sync_timestamp', result.timestamp.toString())
    }
    return result
  } finally {
    // Ensure database is reinitialized
    initDatabase()
  }
}

export async function syncBidirectional(): Promise<SyncResult> {
  const sync = getSyncInstance()
  if (!sync) {
    throw new Error('Sync not configured. Please set Google OAuth credentials in settings.')
  }

  // Close database before sync
  closeDatabase()

  try {
    const result = await sync.sync()
    if (result.success) {
      // Reinitialize database
      initDatabase()
      // Update last sync timestamp
      const { setSetting } = await import('../database/repositories/settings')
      setSetting('last_sync_timestamp', result.timestamp.toString())
    }
    return result
  } finally {
    // Ensure database is reinitialized
    initDatabase()
  }
}

export function resetSyncInstance(): void {
  syncInstance = null
}
