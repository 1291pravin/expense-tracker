<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCategoriesStore } from '../stores/categories'
import type { CategoryInput, Subcategory } from '../types'

const categoriesStore = useCategoriesStore()

// Form state
const showCategoryForm = ref(false)
const showSubcategoryForm = ref(false)
const editingCategoryId = ref<number | null>(null)
const selectedCategoryId = ref<number | null>(null)

const categoryForm = ref<CategoryInput>({
  name: '',
  icon: '📁',
  color: '#0ea5e9'
})

const subcategoryName = ref('')

// Expanded categories for showing subcategories
const expandedCategories = ref<Set<number>>(new Set())

// Subcategories map
const subcategoriesMap = ref<Map<number, Subcategory[]>>(new Map())

const isEditingCategory = computed(() => editingCategoryId.value !== null)

const availableIcons = ['📁', '🍔', '🚗', '🛍️', '🎬', '💡', '💊', '✈️', '📚', '💇', '📦', '🎁', '💳', '🏠', '🎮', '📱', '💼', '🎵', '🍕', '☕']

const availableColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#AEB6BF',
  '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'
]

async function toggleExpand(categoryId: number) {
  if (expandedCategories.value.has(categoryId)) {
    expandedCategories.value.delete(categoryId)
  } else {
    expandedCategories.value.add(categoryId)
    // Load subcategories if not already loaded
    if (!subcategoriesMap.value.has(categoryId)) {
      const subs = await window.api.subcategories.getByCategory(categoryId)
      subcategoriesMap.value.set(categoryId, subs)
    }
  }
}

function openAddCategoryForm() {
  editingCategoryId.value = null
  categoryForm.value = {
    name: '',
    icon: '📁',
    color: '#0ea5e9'
  }
  showCategoryForm.value = true
}

function openEditCategoryForm(category: (typeof categoriesStore.categories)[0]) {
  editingCategoryId.value = category.id
  categoryForm.value = {
    name: category.name,
    icon: category.icon || '📁',
    color: category.color || '#0ea5e9'
  }
  showCategoryForm.value = true
}

function closeCategoryForm() {
  showCategoryForm.value = false
  editingCategoryId.value = null
}

async function saveCategory() {
  try {
    if (isEditingCategory.value && editingCategoryId.value) {
      await categoriesStore.updateCategory(editingCategoryId.value, categoryForm.value)
    } else {
      await categoriesStore.createCategory(categoryForm.value)
    }
    closeCategoryForm()
  } catch (error) {
    console.error('Failed to save category:', error)
  }
}

async function deleteCategory(id: number) {
  const category = categoriesStore.getCategoryById(id)
  if (category?.is_default) {
    alert('Cannot delete default categories')
    return
  }
  if (confirm('Are you sure you want to delete this category? All expenses in this category will also be affected.')) {
    await categoriesStore.deleteCategory(id)
  }
}

function openSubcategoryForm(categoryId: number) {
  selectedCategoryId.value = categoryId
  subcategoryName.value = ''
  showSubcategoryForm.value = true
}

function closeSubcategoryForm() {
  showSubcategoryForm.value = false
  selectedCategoryId.value = null
}

async function saveSubcategory() {
  if (!selectedCategoryId.value || !subcategoryName.value.trim()) return

  try {
    const newSub = await window.api.subcategories.create({
      category_id: selectedCategoryId.value,
      name: subcategoryName.value.trim()
    })
    // Update local cache
    const existing = subcategoriesMap.value.get(selectedCategoryId.value) || []
    subcategoriesMap.value.set(selectedCategoryId.value, [...existing, newSub])
    closeSubcategoryForm()
  } catch (error) {
    console.error('Failed to create subcategory:', error)
  }
}

async function deleteSubcategory(subcategoryId: number, categoryId: number) {
  if (confirm('Are you sure you want to delete this subcategory?')) {
    try {
      await window.api.subcategories.delete(subcategoryId)
      // Update local cache
      const existing = subcategoriesMap.value.get(categoryId) || []
      subcategoriesMap.value.set(categoryId, existing.filter(s => s.id !== subcategoryId))
    } catch (error) {
      console.error('Failed to delete subcategory:', error)
    }
  }
}
</script>

<template>
  <div class="p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Categories</h1>
        <p class="text-gray-500 mt-1">Manage expense categories and subcategories</p>
      </div>
      <button @click="openAddCategoryForm" class="btn btn-primary">+ Add Category</button>
    </div>

    <!-- Categories List -->
    <div class="space-y-3">
      <div
        v-for="category in categoriesStore.categories"
        :key="category.id"
        class="card"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 cursor-pointer" @click="toggleExpand(category.id)">
            <span
              class="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
              :style="{ backgroundColor: (category.color || '#0ea5e9') + '20' }"
            >
              {{ category.icon }}
            </span>
            <div>
              <div class="font-medium text-gray-900">{{ category.name }}</div>
              <div class="text-xs text-gray-400">
                {{ category.is_default ? 'Default' : 'Custom' }} •
                Click to {{ expandedCategories.has(category.id) ? 'collapse' : 'expand' }}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="openSubcategoryForm(category.id)"
              class="text-sm text-gray-400 hover:text-primary-600"
            >
              + Subcategory
            </button>
            <button
              @click="openEditCategoryForm(category)"
              class="text-sm text-gray-400 hover:text-primary-600"
            >
              Edit
            </button>
            <button
              v-if="!category.is_default"
              @click="deleteCategory(category.id)"
              class="text-sm text-gray-400 hover:text-red-600"
            >
              Delete
            </button>
          </div>
        </div>

        <!-- Subcategories -->
        <div v-if="expandedCategories.has(category.id)" class="mt-4 pl-13 border-t border-gray-100 pt-4">
          <div class="space-y-2">
            <div
              v-for="sub in subcategoriesMap.get(category.id) || []"
              :key="sub.id"
              class="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
            >
              <span class="text-sm text-gray-700">{{ sub.name }}</span>
              <button
                @click="deleteSubcategory(sub.id, category.id)"
                class="text-xs text-gray-400 hover:text-red-600"
              >
                Remove
              </button>
            </div>
            <div v-if="!subcategoriesMap.get(category.id)?.length" class="text-sm text-gray-400 py-2">
              No subcategories. Click "+ Subcategory" to add one.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Category Form Modal -->
    <div
      v-if="showCategoryForm"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeCategoryForm"
    >
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-6">
          {{ isEditingCategory ? 'Edit Category' : 'Add Category' }}
        </h2>
        <form @submit.prevent="saveCategory" class="space-y-4">
          <div>
            <label class="input-label">Name *</label>
            <input
              v-model="categoryForm.name"
              type="text"
              required
              class="input"
              placeholder="Category name"
            />
          </div>

          <div>
            <label class="input-label">Icon</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="icon in availableIcons"
                :key="icon"
                type="button"
                @click="categoryForm.icon = icon"
                :class="[
                  'w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all',
                  categoryForm.icon === icon
                    ? 'bg-primary-100 ring-2 ring-primary-500'
                    : 'bg-gray-100 hover:bg-gray-200'
                ]"
              >
                {{ icon }}
              </button>
            </div>
          </div>

          <div>
            <label class="input-label">Color</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="color in availableColors"
                :key="color"
                type="button"
                @click="categoryForm.color = color"
                :class="[
                  'w-8 h-8 rounded-full transition-all',
                  categoryForm.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                ]"
                :style="{ backgroundColor: color }"
              ></button>
            </div>
          </div>

          <div class="flex gap-3 pt-4">
            <button type="button" @click="closeCategoryForm" class="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary flex-1">
              {{ isEditingCategory ? 'Update' : 'Add' }} Category
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Subcategory Form Modal -->
    <div
      v-if="showSubcategoryForm"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeSubcategoryForm"
    >
      <div class="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-6">Add Subcategory</h2>
        <form @submit.prevent="saveSubcategory" class="space-y-4">
          <div>
            <label class="input-label">Subcategory Name *</label>
            <input
              v-model="subcategoryName"
              type="text"
              required
              class="input"
              placeholder="e.g., Groceries"
            />
          </div>

          <div class="flex gap-3 pt-4">
            <button type="button" @click="closeSubcategoryForm" class="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary flex-1">Add</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
