import { getDatabase } from '../index'

export interface ExpenseRow {
  id: number
  amount: number
  date: string
  category_id: number
  subcategory_id: number | null
  description: string | null
  created_at: string
  updated_at: string
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

export function getAllExpenses(): ExpenseRow[] {
  const db = getDatabase()
  return db
    .prepare(
      `
    SELECT
      e.*,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color,
      s.name as subcategory_name
    FROM expenses e
    LEFT JOIN categories c ON e.category_id = c.id
    LEFT JOIN subcategories s ON e.subcategory_id = s.id
    ORDER BY e.date DESC, e.created_at DESC
  `
    )
    .all() as ExpenseRow[]
}

export function getFilteredExpenses(filters: ExpenseFilters): ExpenseRow[] {
  const db = getDatabase()
  const conditions: string[] = []
  const params: (string | number)[] = []

  if (filters.dateFrom) {
    conditions.push('e.date >= ?')
    params.push(filters.dateFrom)
  }

  if (filters.dateTo) {
    conditions.push('e.date <= ?')
    params.push(filters.dateTo)
  }

  if (filters.categoryId) {
    conditions.push('e.category_id = ?')
    params.push(filters.categoryId)
  }

  if (filters.subcategoryId) {
    conditions.push('e.subcategory_id = ?')
    params.push(filters.subcategoryId)
  }

  if (filters.search) {
    conditions.push('e.description LIKE ?')
    params.push(`%${filters.search}%`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  return db
    .prepare(
      `
    SELECT
      e.*,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color,
      s.name as subcategory_name
    FROM expenses e
    LEFT JOIN categories c ON e.category_id = c.id
    LEFT JOIN subcategories s ON e.subcategory_id = s.id
    ${whereClause}
    ORDER BY e.date DESC, e.created_at DESC
  `
    )
    .all(...params) as ExpenseRow[]
}

export function createExpense(input: ExpenseInput): ExpenseRow {
  const db = getDatabase()
  const result = db
    .prepare(
      `
    INSERT INTO expenses (amount, date, category_id, subcategory_id, description)
    VALUES (?, ?, ?, ?, ?)
  `
    )
    .run(
      input.amount,
      input.date,
      input.category_id,
      input.subcategory_id ?? null,
      input.description ?? null
    )

  return db
    .prepare(
      `
    SELECT
      e.*,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color,
      s.name as subcategory_name
    FROM expenses e
    LEFT JOIN categories c ON e.category_id = c.id
    LEFT JOIN subcategories s ON e.subcategory_id = s.id
    WHERE e.id = ?
  `
    )
    .get(Number(result.lastInsertRowid)) as ExpenseRow
}

export function updateExpense(id: number, input: ExpenseInput): ExpenseRow {
  const db = getDatabase()
  db.prepare(
    `
    UPDATE expenses
    SET amount = ?, date = ?, category_id = ?, subcategory_id = ?, description = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `
  ).run(
    input.amount,
    input.date,
    input.category_id,
    input.subcategory_id ?? null,
    input.description ?? null,
    id
  )

  return db
    .prepare(
      `
    SELECT
      e.*,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color,
      s.name as subcategory_name
    FROM expenses e
    LEFT JOIN categories c ON e.category_id = c.id
    LEFT JOIN subcategories s ON e.subcategory_id = s.id
    WHERE e.id = ?
  `
    )
    .get(id) as ExpenseRow
}

export function deleteExpense(id: number): boolean {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM expenses WHERE id = ?').run(id)
  return result.changes > 0
}
