import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SyncStatus, SyncResult } from '../types'

export const useSettingsStore = defineStore('settings', () => {
  const currencySymbol = ref('$')
  const budgetAmount = ref<number>(0)
  const cycleStartDay = ref<number>(1)
  const syncStatus = ref<SyncStatus>({
    isConnected: false,
    lastSync: null
  })
  const syncing = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => syncStatus.value.isConnected)
  const lastSyncDate = computed(() =>
    syncStatus.value.lastSync ? new Date(syncStatus.value.lastSync) : null
  )

  // Actions
  async function loadSettings() {
    loading.value = true
    error.value = null
    try {
      const symbol = await window.api.settings.get('currency_symbol')
      if (symbol) {
        currencySymbol.value = symbol
      }
      const budget = await window.api.settings.get('budget_amount')
      if (budget) {
        budgetAmount.value = parseFloat(budget)
      }
      const startDay = await window.api.settings.get('cycle_start_day')
      if (startDay) {
        cycleStartDay.value = parseInt(startDay, 10)
      }
      const status = await window.api.sync.status()
      syncStatus.value = status
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load settings'
    } finally {
      loading.value = false
    }
  }

  async function setCurrencySymbol(symbol: string) {
    loading.value = true
    error.value = null
    try {
      await window.api.settings.set('currency_symbol', symbol)
      currencySymbol.value = symbol
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update currency'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function setBudgetAmount(amount: number) {
    loading.value = true
    error.value = null
    try {
      await window.api.settings.set('budget_amount', amount.toString())
      budgetAmount.value = amount
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update budget'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function setCycleStartDay(day: number) {
    loading.value = true
    error.value = null
    try {
      await window.api.settings.set('cycle_start_day', day.toString())
      cycleStartDay.value = day
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update cycle start day'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function authenticate() {
    syncing.value = true
    error.value = null
    try {
      await window.api.sync.authenticate()
      syncStatus.value.isConnected = true
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Authentication failed'
      throw e
    } finally {
      syncing.value = false
    }
  }

  async function logout() {
    syncing.value = true
    error.value = null
    try {
      await window.api.sync.logout()
      syncStatus.value.isConnected = false
      syncStatus.value.lastSync = null
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Logout failed'
      throw e
    } finally {
      syncing.value = false
    }
  }

  async function pushToCloud(): Promise<SyncResult> {
    syncing.value = true
    error.value = null
    try {
      const result = await window.api.sync.push()
      if (result.success) {
        syncStatus.value.lastSync = result.timestamp
      }
      return result
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Sync failed'
      throw e
    } finally {
      syncing.value = false
    }
  }

  async function pullFromCloud(): Promise<SyncResult> {
    syncing.value = true
    error.value = null
    try {
      const result = await window.api.sync.pull()
      if (result.success) {
        syncStatus.value.lastSync = result.timestamp
      }
      return result
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Sync failed'
      throw e
    } finally {
      syncing.value = false
    }
  }

  async function syncBidirectional(): Promise<SyncResult> {
    syncing.value = true
    error.value = null
    try {
      const result = await window.api.sync.bidirectional()
      if (result.success) {
        syncStatus.value.lastSync = result.timestamp
      }
      return result
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Sync failed'
      throw e
    } finally {
      syncing.value = false
    }
  }

  return {
    currencySymbol,
    budgetAmount,
    cycleStartDay,
    syncStatus,
    syncing,
    loading,
    error,
    isAuthenticated,
    lastSyncDate,
    loadSettings,
    setCurrencySymbol,
    setBudgetAmount,
    setCycleStartDay,
    authenticate,
    logout,
    pushToCloud,
    pullFromCloud,
    syncBidirectional
  }
})
