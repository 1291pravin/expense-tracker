import { getDatabase } from '../index'

export interface CategoryRow {
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

export function getAllCategories(): CategoryRow[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM categories ORDER BY is_default DESC, name ASC').all() as CategoryRow[]
}

export function getCategoryById(id: number): CategoryRow | undefined {
  const db = getDatabase()
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as CategoryRow | undefined
}

export function createCategory(input: CategoryInput): CategoryRow {
  const db = getDatabase()
  const result = db
    .prepare(
      `
    INSERT INTO categories (name, icon, color, is_default)
    VALUES (?, ?, ?, 0)
  `
    )
    .run(input.name, input.icon ?? null, input.color ?? null)

  return db.prepare('SELECT * FROM categories WHERE id = ?').get(Number(result.lastInsertRowid)) as CategoryRow
}

export function updateCategory(id: number, input: CategoryInput): CategoryRow {
  const db = getDatabase()
  db.prepare(
    `
    UPDATE categories
    SET name = ?, icon = ?, color = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `
  ).run(input.name, input.icon ?? null, input.color ?? null, id)

  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as CategoryRow
}

export function deleteCategory(id: number): boolean {
  const db = getDatabase()
  // Check if category is default
  const category = db.prepare('SELECT is_default FROM categories WHERE id = ?').get(id) as { is_default: number } | undefined
  if (category?.is_default === 1) {
    throw new Error('Cannot delete default category')
  }

  const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id)
  return result.changes > 0
}
