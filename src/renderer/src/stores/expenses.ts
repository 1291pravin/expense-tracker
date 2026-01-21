import { defineStore } from 'pinia'
import { ref, computed, toRaw } from 'vue'
import type { Expense, ExpenseInput, ExpenseFilters } from '../types'

export const useExpensesStore = defineStore('expenses', () => {
  const expenses = ref<Expense[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<ExpenseFilters>({})

  // Getters
  const totalExpenses = computed(() => expenses.value.reduce((sum, e) => sum + e.amount, 0))
  const expenseCount = computed(() => expenses.value.length)

  // Actions
  async function fetchExpenses(newFilters?: ExpenseFilters) {
    loading.value = true
    error.value = null
    try {
      if (newFilters) {
        filters.value = newFilters
      }
      const result = await window.api.expenses.getFiltered(JSON.parse(JSON.stringify(toRaw(filters.value))))
      expenses.value = result
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch expenses'
    } finally {
      loading.value = false
    }
  }

  async function createExpense(input: ExpenseInput) {
    loading.value = true
    error.value = null
    try {
      const expense = await window.api.expenses.create(JSON.parse(JSON.stringify(toRaw(input))))
      expenses.value.unshift(expense)
      return expense
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to create expense'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateExpense(id: number, input: ExpenseInput) {
    loading.value = true
    error.value = null
    try {
      const expense = await window.api.expenses.update(id, JSON.parse(JSON.stringify(toRaw(input))))
      const index = expenses.value.findIndex((e) => e.id === id)
      if (index !== -1) {
        expenses.value[index] = expense
      }
      return expense
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update expense'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteExpense(id: number) {
    loading.value = true
    error.value = null
    try {
      await window.api.expenses.delete(id)
      expenses.value = expenses.value.filter((e) => e.id !== id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to delete expense'
      throw e
    } finally {
      loading.value = false
    }
  }

  function setFilters(newFilters: ExpenseFilters) {
    filters.value = newFilters
  }

  function clearFilters() {
    filters.value = {}
  }

  return {
    expenses,
    loading,
    error,
    filters,
    totalExpenses,
    expenseCount,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    setFilters,
    clearFilters
  }
})
