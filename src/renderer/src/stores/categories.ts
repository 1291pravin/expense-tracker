import { defineStore } from 'pinia'
import { ref, computed, toRaw } from 'vue'
import type { Category, CategoryInput, Subcategory, SubcategoryInput } from '../types'

export const useCategoriesStore = defineStore('categories', () => {
  const categories = ref<Category[]>([])
  const subcategories = ref<Map<number, Subcategory[]>>(new Map())
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const sortedCategories = computed(() =>
    [...categories.value].sort((a, b) => a.name.localeCompare(b.name))
  )

  const defaultCategories = computed(() => categories.value.filter((c) => c.is_default === 1))

  const customCategories = computed(() => categories.value.filter((c) => c.is_default === 0))

  // Actions
  async function fetchCategories() {
    loading.value = true
    error.value = null
    try {
      const result = await window.api.categories.getAll()
      categories.value = result
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch categories'
    } finally {
      loading.value = false
    }
  }

  async function createCategory(input: CategoryInput) {
    loading.value = true
    error.value = null
    try {
      const category = await window.api.categories.create(JSON.parse(JSON.stringify(toRaw(input))))
      categories.value.push(category)
      return category
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to create category'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateCategory(id: number, input: CategoryInput) {
    loading.value = true
    error.value = null
    try {
      const category = await window.api.categories.update(id, JSON.parse(JSON.stringify(toRaw(input))))
      const index = categories.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        categories.value[index] = category
      }
      return category
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update category'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteCategory(id: number) {
    loading.value = true
    error.value = null
    try {
      await window.api.categories.delete(id)
      categories.value = categories.value.filter((c) => c.id !== id)
      subcategories.value.delete(id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to delete category'
      throw e
    } finally {
      loading.value = false
    }
  }

  // Subcategory actions
  async function fetchSubcategories(categoryId: number) {
    loading.value = true
    error.value = null
    try {
      const result = await window.api.subcategories.getByCategory(categoryId)
      subcategories.value.set(categoryId, result)
      return result
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch subcategories'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createSubcategory(input: SubcategoryInput) {
    loading.value = true
    error.value = null
    try {
      const subcategory = await window.api.subcategories.create(JSON.parse(JSON.stringify(toRaw(input))))
      const existing = subcategories.value.get(input.category_id) || []
      subcategories.value.set(input.category_id, [...existing, subcategory])
      return subcategory
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to create subcategory'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteSubcategory(id: number, categoryId: number) {
    loading.value = true
    error.value = null
    try {
      await window.api.subcategories.delete(id)
      const existing = subcategories.value.get(categoryId) || []
      subcategories.value.set(
        categoryId,
        existing.filter((s) => s.id !== id)
      )
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to delete subcategory'
      throw e
    } finally {
      loading.value = false
    }
  }

  function getSubcategoriesByCategory(categoryId: number): Subcategory[] {
    return subcategories.value.get(categoryId) || []
  }

  function getCategoryById(id: number): Category | undefined {
    return categories.value.find((c) => c.id === id)
  }

  return {
    categories,
    subcategories,
    loading,
    error,
    sortedCategories,
    defaultCategories,
    customCategories,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    fetchSubcategories,
    createSubcategory,
    deleteSubcategory,
    getSubcategoriesByCategory,
    getCategoryById
  }
})
