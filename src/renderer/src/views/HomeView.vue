<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../stores/settings'
import type { MonthlySummary, Expense } from '../types'

const router = useRouter()
const settingsStore = useSettingsStore()

const currentDate = ref(new Date())
const monthlySummary = ref<MonthlySummary | null>(null)
const recentExpenses = ref<Expense[]>([])
const loading = ref(false)

const currentMonth = computed(() => currentDate.value.getMonth() + 1)
const currentYear = computed(() => currentDate.value.getFullYear())

const monthName = computed(() => {
  return currentDate.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

const formattedTotal = computed(() => {
  if (!monthlySummary.value) return `${settingsStore.currencySymbol}0.00`
  return `${settingsStore.currencySymbol}${monthlySummary.value.total.toFixed(2)}`
})

async function loadData() {
  loading.value = true
  try {
    // Load monthly summary
    monthlySummary.value = await window.api.reports.monthlySummary(
      currentYear.value,
      currentMonth.value
    )

    // Load recent expenses (last 10)
    const allExpenses = await window.api.expenses.getFiltered({})
    recentExpenses.value = allExpenses.slice(0, 10)
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  } finally {
    loading.value = false
  }
}

function formatCurrency(amount: number): string {
  return `${settingsStore.currencySymbol}${amount.toFixed(2)}`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function goToAddExpense() {
  router.push('/expenses?action=add')
}

function previousMonth() {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 2, 1)
}

function nextMonth() {
  currentDate.value = new Date(currentYear.value, currentMonth.value, 1)
}

watch([currentMonth, currentYear], () => {
  loadData()
})

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-gray-500 mt-1">Track your expenses at a glance</p>
      </div>
      <button @click="goToAddExpense" class="btn btn-primary">+ Add Expense</button>
    </div>

    <!-- Month Navigation -->
    <div class="flex items-center gap-4 mb-6">
      <button @click="previousMonth" class="p-2 hover:bg-gray-100 rounded-lg">
        <span class="text-xl">←</span>
      </button>
      <h2 class="text-lg font-semibold text-gray-700">{{ monthName }}</h2>
      <button @click="nextMonth" class="p-2 hover:bg-gray-100 rounded-lg">
        <span class="text-xl">→</span>
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <!-- Total Spent -->
      <div class="card">
        <div class="text-sm text-gray-500 mb-1">Total Spent</div>
        <div class="text-3xl font-bold text-gray-900">{{ formattedTotal }}</div>
        <div class="text-sm text-gray-400 mt-1">
          {{ monthlySummary?.count || 0 }} transactions
        </div>
      </div>

      <!-- Top Category -->
      <div class="card">
        <div class="text-sm text-gray-500 mb-1">Top Category</div>
        <div v-if="monthlySummary?.byCategory?.length" class="flex items-center gap-2">
          <span class="text-2xl">{{ monthlySummary.byCategory[0].category_icon }}</span>
          <div>
            <div class="text-lg font-semibold text-gray-900">
              {{ monthlySummary.byCategory[0].category_name }}
            </div>
            <div class="text-sm text-gray-500">
              {{ formatCurrency(monthlySummary.byCategory[0].total) }} ({{
                monthlySummary.byCategory[0].percentage.toFixed(0)
              }}%)
            </div>
          </div>
        </div>
        <div v-else class="text-gray-400">No expenses yet</div>
      </div>

      <!-- Average per Day -->
      <div class="card">
        <div class="text-sm text-gray-500 mb-1">Average per Day</div>
        <div class="text-3xl font-bold text-gray-900">
          {{
            monthlySummary?.total
              ? formatCurrency(monthlySummary.total / new Date(currentYear, currentMonth, 0).getDate())
              : formatCurrency(0)
          }}
        </div>
        <div class="text-sm text-gray-400 mt-1">based on {{ new Date(currentYear, currentMonth, 0).getDate() }} days</div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Category Breakdown -->
      <div class="card">
        <h3 class="card-header">Spending by Category</h3>
        <div v-if="loading" class="text-center py-8 text-gray-400">Loading...</div>
        <div v-else-if="!monthlySummary?.byCategory?.length" class="text-center py-8 text-gray-400">
          No expenses this month
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="category in monthlySummary.byCategory"
            :key="category.category_id"
            class="flex items-center gap-3"
          >
            <span class="text-xl w-8">{{ category.category_icon }}</span>
            <div class="flex-1">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-medium text-gray-700">{{
                  category.category_name
                }}</span>
                <span class="text-sm text-gray-500">{{ formatCurrency(category.total) }}</span>
              </div>
              <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full"
                  :style="{
                    width: `${category.percentage}%`,
                    backgroundColor: category.category_color || '#0ea5e9'
                  }"
                ></div>
              </div>
            </div>
            <span class="text-sm text-gray-400 w-12 text-right"
              >{{ category.percentage.toFixed(0) }}%</span
            >
          </div>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-800">Recent Transactions</h3>
          <router-link to="/expenses" class="text-sm text-primary-600 hover:text-primary-700">
            View all →
          </router-link>
        </div>
        <div v-if="loading" class="text-center py-8 text-gray-400">Loading...</div>
        <div v-else-if="!recentExpenses.length" class="text-center py-8 text-gray-400">
          No expenses yet
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="expense in recentExpenses"
            :key="expense.id"
            class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
          >
            <div class="flex items-center gap-3">
              <span class="text-xl">{{ expense.category_icon }}</span>
              <div>
                <div class="text-sm font-medium text-gray-800">
                  {{ expense.description || expense.category_name }}
                </div>
                <div class="text-xs text-gray-400">
                  {{ expense.subcategory_name || expense.category_name }} •
                  {{ formatDate(expense.date) }}
                </div>
              </div>
            </div>
            <div class="text-sm font-semibold text-gray-900">
              -{{ formatCurrency(expense.amount) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
