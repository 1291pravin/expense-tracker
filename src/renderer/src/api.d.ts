import type {
  Expense,
  ExpenseInput,
  ExpenseFilters,
  Category,
  CategoryInput,
  Subcategory,
  SubcategoryInput,
  MonthlySummary,
  CategorySummary,
  SyncStatus,
  SyncResult
} from './types'

declare global {
  interface Window {
    api: {
      expenses: {
        getAll: () => Promise<Expense[]>
        getFiltered: (filters: ExpenseFilters) => Promise<Expense[]>
        create: (input: ExpenseInput) => Promise<Expense>
        update: (id: number, input: ExpenseInput) => Promise<Expense>
        delete: (id: number) => Promise<boolean>
      }
      categories: {
        getAll: () => Promise<Category[]>
        create: (input: CategoryInput) => Promise<Category>
        update: (id: number, input: CategoryInput) => Promise<Category>
        delete: (id: number) => Promise<boolean>
      }
      subcategories: {
        getByCategory: (categoryId: number) => Promise<Subcategory[]>
        create: (input: SubcategoryInput) => Promise<Subcategory>
        delete: (id: number) => Promise<boolean>
      }
      reports: {
        monthlySummary: (year: number, month: number) => Promise<MonthlySummary>
        cycleSummary: (year: number, month: number, startDay: number) => Promise<MonthlySummary>
        categoryBreakdown: (dateFrom: string, dateTo: string) => Promise<CategorySummary[]>
      }
      settings: {
        get: (key: string) => Promise<string | null>
        set: (key: string, value: string) => Promise<boolean>
      }
      sync: {
        status: () => Promise<SyncStatus>
        authenticate: () => Promise<boolean>
        push: () => Promise<SyncResult>
        pull: () => Promise<SyncResult>
        bidirectional: () => Promise<SyncResult>
        logout: () => Promise<boolean>
      }
    }
  }
}

export {}
