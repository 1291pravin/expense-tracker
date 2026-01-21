<script setup lang="ts">
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { computed, onMounted } from 'vue'
import { useCategoriesStore } from './stores/categories'
import { useSettingsStore } from './stores/settings'

const route = useRoute()
const categoriesStore = useCategoriesStore()
const settingsStore = useSettingsStore()

const navItems = [
  { path: '/', name: 'Dashboard', icon: '📊' },
  { path: '/expenses', name: 'Expenses', icon: '💰' },
  { path: '/categories', name: 'Categories', icon: '📁' },
  { path: '/settings', name: 'Settings', icon: '⚙️' }
]

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const syncStatusText = computed(() => {
  if (settingsStore.syncing) return 'Syncing...'
  if (!settingsStore.isAuthenticated) return 'Not connected'
  if (settingsStore.lastSyncDate) {
    return `Synced ${formatRelativeTime(settingsStore.lastSyncDate)}`
  }
  return 'Connected'
})

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

onMounted(async () => {
  await Promise.all([categoriesStore.fetchCategories(), settingsStore.loadSettings()])
})
</script>

<template>
  <div class="flex h-screen bg-gray-50">
    <!-- Sidebar -->
    <aside class="w-64 bg-white border-r border-gray-200 flex flex-col">
      <!-- Logo -->
      <div class="p-6 border-b border-gray-200">
        <h1 class="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span>💵</span>
          <span>Expense Tracker</span>
        </h1>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 p-4 space-y-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          :class="[
            'nav-item',
            isActive(item.path) ? 'nav-item-active' : 'nav-item-inactive'
          ]"
        >
          <span class="mr-3">{{ item.icon }}</span>
          <span>{{ item.name }}</span>
        </RouterLink>
      </nav>

      <!-- Sync Status -->
      <div class="p-4 border-t border-gray-200">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-500">Sync Status</span>
          <span
            :class="[
              'flex items-center gap-1',
              settingsStore.isAuthenticated ? 'text-green-600' : 'text-gray-400'
            ]"
          >
            <span
              :class="[
                'w-2 h-2 rounded-full',
                settingsStore.syncing
                  ? 'bg-yellow-400 animate-pulse'
                  : settingsStore.isAuthenticated
                    ? 'bg-green-500'
                    : 'bg-gray-300'
              ]"
            ></span>
            {{ syncStatusText }}
          </span>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 overflow-auto">
      <RouterView />
    </main>
  </div>
</template>
