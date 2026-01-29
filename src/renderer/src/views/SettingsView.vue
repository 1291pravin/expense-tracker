<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '../stores/settings'

const settingsStore = useSettingsStore()

// Budget settings
const budgetAmount = ref(0)
const savingBudget = ref(false)

// Billing cycle settings
const cycleStartDay = ref(1)
const savingCycle = ref(false)

// Currency settings
const currencySymbol = ref('$')
const savingCurrency = ref(false)

// Google OAuth settings
const googleClientId = ref('')
const googleClientSecret = ref('')
const savingOAuth = ref(false)
const showSecret = ref(false)

const currencyOptions = [
  { symbol: '$', name: 'USD - US Dollar' },
  { symbol: '€', name: 'EUR - Euro' },
  { symbol: '£', name: 'GBP - British Pound' },
  { symbol: '¥', name: 'JPY - Japanese Yen' },
  { symbol: '₹', name: 'INR - Indian Rupee' },
  { symbol: 'A$', name: 'AUD - Australian Dollar' },
  { symbol: 'C$', name: 'CAD - Canadian Dollar' },
  { symbol: '₩', name: 'KRW - Korean Won' },
  { symbol: '₽', name: 'RUB - Russian Ruble' },
  { symbol: 'R$', name: 'BRL - Brazilian Real' }
]

async function saveBudget() {
  savingBudget.value = true
  try {
    await settingsStore.setBudgetAmount(budgetAmount.value)
  } finally {
    savingBudget.value = false
  }
}

async function saveCycleStartDay() {
  savingCycle.value = true
  try {
    await settingsStore.setCycleStartDay(cycleStartDay.value)
  } finally {
    savingCycle.value = false
  }
}

async function saveCurrency() {
  savingCurrency.value = true
  try {
    await settingsStore.setCurrencySymbol(currencySymbol.value)
  } finally {
    savingCurrency.value = false
  }
}

async function saveOAuthCredentials() {
  savingOAuth.value = true
  try {
    if (googleClientId.value) {
      await window.api.settings.set('google_client_id', googleClientId.value)
    }
    if (googleClientSecret.value) {
      await window.api.settings.set('google_client_secret', googleClientSecret.value)
    }
    alert('OAuth credentials saved!')
  } catch (error) {
    console.error('Failed to save OAuth credentials:', error)
    alert('Failed to save credentials')
  } finally {
    savingOAuth.value = false
  }
}

async function connectGoogleDrive() {
  try {
    await settingsStore.authenticate()
    alert('Successfully connected to Google Drive!')
  } catch (error) {
    console.error('Authentication failed:', error)
    alert('Failed to connect. Make sure you have set up OAuth credentials first.')
  }
}

async function disconnectGoogleDrive() {
  if (confirm('Are you sure you want to disconnect from Google Drive?')) {
    await settingsStore.logout()
  }
}

async function syncNow() {
  try {
    const result = await settingsStore.syncBidirectional()
    if (result.success) {
      alert('Sync completed successfully!')
    } else {
      alert('Sync failed: ' + (result.error || 'Unknown error'))
    }
  } catch (error) {
    console.error('Sync failed:', error)
    alert('Sync failed. Please try again.')
  }
}

async function pushToCloud() {
  try {
    const result = await settingsStore.pushToCloud()
    if (result.success) {
      alert('Pushed to cloud successfully!')
    } else {
      alert('Push failed: ' + (result.error || 'Unknown error'))
    }
  } catch (error) {
    console.error('Push failed:', error)
    alert('Push failed. Please try again.')
  }
}

async function pullFromCloud() {
  if (confirm('This will replace your local data with the cloud version. Continue?')) {
    try {
      const result = await settingsStore.pullFromCloud()
      if (result.success) {
        alert('Pulled from cloud successfully! Refreshing data...')
        window.location.reload()
      } else {
        alert('Pull failed: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Pull failed:', error)
      alert('Pull failed. Please try again.')
    }
  }
}

function formatLastSync(date: Date | null): string {
  if (!date) return 'Never'
  return date.toLocaleString()
}

onMounted(async () => {
  budgetAmount.value = settingsStore.budgetAmount
  cycleStartDay.value = settingsStore.cycleStartDay
  currencySymbol.value = settingsStore.currencySymbol

  // Load OAuth credentials
  const clientId = await window.api.settings.get('google_client_id')
  const clientSecret = await window.api.settings.get('google_client_secret')
  if (clientId) googleClientId.value = clientId
  if (clientSecret) googleClientSecret.value = clientSecret
})
</script>

<template>
  <div class="p-8 max-w-3xl">
    <h1 class="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

    <!-- Monthly Budget -->
    <div class="card mb-6">
      <h2 class="card-header">Monthly Budget</h2>
      <p class="text-sm text-gray-500 mb-4">Set a monthly spending budget to track on the dashboard.</p>
      <div class="flex items-end gap-4">
        <div class="flex-1">
          <label class="input-label">Budget Amount</label>
          <input
            v-model.number="budgetAmount"
            type="number"
            min="0"
            step="100"
            class="input"
            placeholder="e.g. 5000"
          />
        </div>
        <button @click="saveBudget" :disabled="savingBudget" class="btn btn-primary">
          {{ savingBudget ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </div>

    <!-- Billing Cycle -->
    <div class="card mb-6">
      <h2 class="card-header">Billing Cycle</h2>
      <p class="text-sm text-gray-500 mb-4">Choose which day of the month your tracking period starts (e.g., salary day).</p>
      <div class="flex items-end gap-4">
        <div class="flex-1">
          <label class="input-label">Cycle Start Day</label>
          <select v-model.number="cycleStartDay" class="input">
            <option v-for="d in 28" :key="d" :value="d">{{ d }}</option>
          </select>
        </div>
        <button @click="saveCycleStartDay" :disabled="savingCycle" class="btn btn-primary">
          {{ savingCycle ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </div>

    <!-- Currency Settings -->
    <div class="card mb-6">
      <h2 class="card-header">Currency</h2>
      <div class="flex items-end gap-4">
        <div class="flex-1">
          <label class="input-label">Currency Symbol</label>
          <select v-model="currencySymbol" class="input">
            <option v-for="option in currencyOptions" :key="option.symbol" :value="option.symbol">
              {{ option.symbol }} - {{ option.name }}
            </option>
          </select>
        </div>
        <button @click="saveCurrency" :disabled="savingCurrency" class="btn btn-primary">
          {{ savingCurrency ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </div>

    <!-- Google Drive Sync -->
    <div class="card mb-6">
      <h2 class="card-header">Google Drive Sync</h2>

      <!-- Connection Status -->
      <div class="mb-6 p-4 rounded-lg" :class="settingsStore.isAuthenticated ? 'bg-green-50' : 'bg-gray-50'">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span
              class="w-3 h-3 rounded-full"
              :class="settingsStore.isAuthenticated ? 'bg-green-500' : 'bg-gray-300'"
            ></span>
            <div>
              <div class="font-medium" :class="settingsStore.isAuthenticated ? 'text-green-800' : 'text-gray-700'">
                {{ settingsStore.isAuthenticated ? 'Connected' : 'Not Connected' }}
              </div>
              <div class="text-sm text-gray-500">
                Last sync: {{ formatLastSync(settingsStore.lastSyncDate) }}
              </div>
            </div>
          </div>
          <button
            v-if="settingsStore.isAuthenticated"
            @click="disconnectGoogleDrive"
            class="btn btn-secondary text-sm"
          >
            Disconnect
          </button>
        </div>
      </div>

      <!-- Sync Actions -->
      <div v-if="settingsStore.isAuthenticated" class="mb-6">
        <h3 class="text-sm font-medium text-gray-700 mb-3">Sync Actions</h3>
        <div class="flex gap-3">
          <button
            @click="syncNow"
            :disabled="settingsStore.syncing"
            class="btn btn-primary flex-1"
          >
            {{ settingsStore.syncing ? 'Syncing...' : 'Sync Now' }}
          </button>
          <button
            @click="pushToCloud"
            :disabled="settingsStore.syncing"
            class="btn btn-secondary"
          >
            Push to Cloud
          </button>
          <button
            @click="pullFromCloud"
            :disabled="settingsStore.syncing"
            class="btn btn-secondary"
          >
            Pull from Cloud
          </button>
        </div>
      </div>

      <!-- OAuth Setup -->
      <div class="border-t border-gray-200 pt-6">
        <h3 class="text-sm font-medium text-gray-700 mb-4">Google OAuth Credentials</h3>
        <p class="text-sm text-gray-500 mb-4">
          To enable Google Drive sync, you need to set up OAuth credentials in the
          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            class="text-primary-600 hover:underline"
          >
            Google Cloud Console
          </a>.
        </p>

        <div class="space-y-4">
          <div>
            <label class="input-label">Client ID</label>
            <input
              v-model="googleClientId"
              type="text"
              class="input"
              placeholder="your-client-id.apps.googleusercontent.com"
            />
          </div>

          <div>
            <label class="input-label">Client Secret</label>
            <div class="relative">
              <input
                v-model="googleClientSecret"
                :type="showSecret ? 'text' : 'password'"
                class="input pr-20"
                placeholder="Your client secret"
              />
              <button
                type="button"
                @click="showSecret = !showSecret"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-gray-600"
              >
                {{ showSecret ? 'Hide' : 'Show' }}
              </button>
            </div>
          </div>

          <div class="flex gap-3">
            <button
              @click="saveOAuthCredentials"
              :disabled="savingOAuth"
              class="btn btn-secondary"
            >
              {{ savingOAuth ? 'Saving...' : 'Save Credentials' }}
            </button>
            <button
              v-if="!settingsStore.isAuthenticated && googleClientId && googleClientSecret"
              @click="connectGoogleDrive"
              class="btn btn-primary"
            >
              Connect to Google Drive
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- About -->
    <div class="card">
      <h2 class="card-header">About</h2>
      <div class="text-sm text-gray-600">
        <p class="mb-2"><strong>Expense Tracker</strong> v0.1.0</p>
        <p class="mb-2">A local-first expense tracking app with Google Drive sync.</p>
        <p>Data is stored locally using SQLite and can be synced to Google Drive for backup.</p>
      </div>
    </div>
  </div>
</template>
