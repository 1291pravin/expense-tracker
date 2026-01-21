<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useExpensesStore } from '../stores/expenses'
import { useCategoriesStore } from '../stores/categories'
import { useSettingsStore } from '../stores/settings'
import type { ExpenseInput, Subcategory } from '../types'

const route = useRoute()
const expensesStore = useExpensesStore()
const categoriesStore = useCategoriesStore()
const settingsStore = useSettingsStore()

// Form state
const showForm = ref(false)
const editingId = ref<number | null>(null)
const formData = ref<ExpenseInput>({
  amount: 0,
  date: new Date().toISOString().split('T')[0],
  category_id: 0,
  subcategory_id: null,
  description: ''
})

// Filter state
const filterDateFrom = ref('')
const filterDateTo = ref('')
const filterCategoryId = ref<number | undefined>(undefined)
const searchQuery = ref('')

// Subcategories for selected category
const subcategories = ref<Subcategory[]>([])

const isEditing = computed(() => editingId.value !== null)
const formTitle = computed(() => (isEditing.value ? 'Edit Expense' : 'Add Expense'))

function formatCurrency(amount: number): string {
  return `${settingsStore.currencySymbol}${amount.toFixed(2)}`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

async function loadExpenses() {
  await expensesStore.fetchExpenses({
    dateFrom: filterDateFrom.value || undefined,
    dateTo: filterDateTo.value || undefined,
    categoryId: filterCategoryId.value,
    search: searchQuery.value || undefined
  })
}

async function loadSubcategories(categoryId: number) {
  if (categoryId) {
    subcategories.value = await window.api.subcategories.getByCategory(categoryId)
  } else {
    subcategories.value = []
  }
}

function openAddForm() {
  editingId.value = null
  formData.value = {
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    category_id: categoriesStore.categories[0]?.id || 0,
    subcategory_id: null,
    description: ''
  }
  showForm.value = true
  if (formData.value.category_id) {
    loadSubcategories(formData.value.category_id)
  }
}

function openEditForm(expense: (typeof expensesStore.expenses)[0]) {
  editingId.value = expense.id
  formData.value = {
    amount: expense.amount,
    date: expense.date,
    category_id: expense.category_id,
    subcategory_id: expense.subcategory_id,
    description: expense.description || ''
  }
  showForm.value = true
  loadSubcategories(expense.category_id)
}

function closeForm() {
  showForm.value = false
  editingId.value = null
}

async function saveExpense() {
  try {
    if (isEditing.value && editingId.value) {
      await expensesStore.updateExpense(editingId.value, formData.value)
    } else {
      await expensesStore.createExpense(formData.value)
    }
    closeForm()
    await loadExpenses()
  } catch (error) {
    console.error('Failed to save expense:', error)
  }
}

async function deleteExpense(id: number) {
  if (confirm('Are you sure you want to delete this expense?')) {
    await expensesStore.deleteExpense(id)
  }
}

function clearFilters() {
  filterDateFrom.value = ''
  filterDateTo.value = ''
  filterCategoryId.value = undefined
  searchQuery.value = ''
  loadExpenses()
}

watch(() => formData.value.category_id, (newCategoryId) => {
  formData.value.subcategory_id = null
  if (newCategoryId) {
    loadSubcategories(newCategoryId)
  }
})

watch([filterDateFrom, filterDateTo, filterCategoryId], () => {
  loadExpenses()
})

// Debounce search
let searchTimeout: ReturnType<typeof setTimeout>
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadExpenses()
  }, 300)
})

onMounted(async () => {
  await loadExpenses()

  // Check if we should open add form from query
  if (route.query.action === 'add') {
    openAddForm()
  }
})
</script>

<template>
  <div class="p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Expenses</h1>
        <p class="text-gray-500 mt-1">
          {{ expensesStore.expenseCount }} expenses • Total:
          {{ formatCurrency(expensesStore.totalExpenses) }}
        </p>
      </div>
      <button @click="openAddForm" class="btn btn-primary">+ Add Expense</button>
    </div>

    <!-- Filters -->
    <div class="card mb-6">
      <div class="flex flex-wrap gap-4 items-end">
        <div class="flex-1 min-w-[200px]">
          <label class="input-label">Search</label>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by description..."
            class="input"
          />
        </div>
        <div>
          <label class="input-label">From Date</label>
          <input v-model="filterDateFrom" type="date" class="input" />
        </div>
        <div>
          <label class="input-label">To Date</label>
          <input v-model="filterDateTo" type="date" class="input" />
        </div>
        <div class="min-w-[180px]">
          <label class="input-label">Category</label>
          <select v-model="filterCategoryId" class="input">
            <option :value="undefined">All Categories</option>
            <option
              v-for="category in categoriesStore.categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.icon }} {{ category.name }}
            </option>
          </select>
        </div>
        <button @click="clearFilters" class="btn btn-secondary">Clear</button>
      </div>
    </div>

    <!-- Expenses List -->
    <div class="card">
      <div v-if="expensesStore.loading" class="text-center py-12 text-gray-400">Loading...</div>
      <div v-else-if="!expensesStore.expenses.length" class="text-center py-12 text-gray-400">
        No expenses found. Click "Add Expense" to get started.
      </div>
      <div v-else>
        <table class="w-full">
          <thead>
            <tr class="text-left text-sm text-gray-500 border-b border-gray-200">
              <th class="pb-3 font-medium">Date</th>
              <th class="pb-3 font-medium">Category</th>
              <th class="pb-3 font-medium">Description</th>
              <th class="pb-3 font-medium text-right">Amount</th>
              <th class="pb-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="expense in expensesStore.expenses"
              :key="expense.id"
              class="border-b border-gray-100 hover:bg-gray-50"
            >
              <td class="py-3 text-sm text-gray-600">{{ formatDate(expense.date) }}</td>
              <td class="py-3">
                <div class="flex items-center gap-2">
                  <span
                    class="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                    :style="{ backgroundColor: expense.category_color + '20' }"
                  >
                    {{ expense.category_icon }}
                  </span>
                  <div>
                    <div class="text-sm font-medium text-gray-800">{{ expense.category_name }}</div>
                    <div v-if="expense.subcategory_name" class="text-xs text-gray-400">
                      {{ expense.subcategory_name }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="py-3 text-sm text-gray-600">
                {{ expense.description || '-' }}
              </td>
              <td class="py-3 text-sm font-semibold text-gray-900 text-right">
                {{ formatCurrency(expense.amount) }}
              </td>
              <td class="py-3 text-right">
                <button
                  @click="openEditForm(expense)"
                  class="text-gray-400 hover:text-primary-600 mr-2"
                >
                  Edit
                </button>
                <button
                  @click="deleteExpense(expense.id)"
                  class="text-gray-400 hover:text-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div
      v-if="showForm"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeForm"
    >
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-6">{{ formTitle }}</h2>
        <form @submit.prevent="saveExpense" class="space-y-4">
          <div>
            <label class="input-label">Amount *</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                {{ settingsStore.currencySymbol }}
              </span>
              <input
                v-model.number="formData.amount"
                type="number"
                step="0.01"
                min="0"
                required
                class="input pl-8"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label class="input-label">Date *</label>
            <input v-model="formData.date" type="date" required class="input" />
          </div>

          <div>
            <label class="input-label">Category *</label>
            <select v-model="formData.category_id" required class="input">
              <option value="" disabled>Select a category</option>
              <option
                v-for="category in categoriesStore.categories"
                :key="category.id"
                :value="category.id"
              >
                {{ category.icon }} {{ category.name }}
              </option>
            </select>
          </div>

          <div v-if="subcategories.length">
            <label class="input-label">Subcategory</label>
            <select v-model="formData.subcategory_id" class="input">
              <option :value="null">None</option>
              <option v-for="sub in subcategories" :key="sub.id" :value="sub.id">
                {{ sub.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="input-label">Description</label>
            <textarea
              v-model="formData.description"
              class="input"
              rows="2"
              placeholder="Add a note..."
            ></textarea>
          </div>

          <div class="flex gap-3 pt-4">
            <button type="button" @click="closeForm" class="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" class="btn btn-primary flex-1">
              {{ isEditing ? 'Update' : 'Add' }} Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
