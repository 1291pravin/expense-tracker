// Category types
export interface Category {
  id: number
  name: string
  icon: string | null
  color: string | null
  is_default: number
  created_at: string
  updated_at: string
}

export interface CategoryInput {
  name: string
  icon?: string
  color?: string
}

// Subcategory types
export interface Subcategory {
  id: number
  category_id: number
  name: string
  created_at: string
  updated_at: string
}

export interface SubcategoryInput {
  category_id: number
  name: string
}

// Expense types
export interface Expense {
  id: number
  amount: number
  date: string
  category_id: number
  subcategory_id: number | null
  description: string | null
  created_at: string
  updated_at: string
  // Joined fields
  category_name?: string
  category_icon?: string
  category_color?: string
  subcategory_name?: string
}

export interface ExpenseInput {
  amount: number
  date: string
  category_id: number
  subcategory_id?: number | null
  description?: string
}

export interface ExpenseFilters {
  dateFrom?: string
  dateTo?: string
  categoryId?: number
  subcategoryId?: number
  search?: string
}

// Report types
export interface MonthlySummary {
  total: number
  count: number
  byCategory: CategorySummary[]
}

export interface CategorySummary {
  category_id: number
  category_name: string
  category_icon: string | null
  category_color: string | null
  total: number
  count: number
  percentage: number
}

// Settings types
export interface Settings {
  currency_symbol: string
  google_client_id?: string
  google_client_secret?: string
}

// Sync types
export interface SyncStatus {
  isConnected: boolean
  lastSync: number | null
}

export interface SyncResult {
  success: boolean
  type: 'push' | 'pull' | 'bidirectional'
  timestamp: number
  error?: string
}
