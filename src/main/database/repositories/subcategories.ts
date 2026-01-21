import { getDatabase } from '../index'

export interface SubcategoryRow {
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

export function getSubcategoriesByCategory(categoryId: number): SubcategoryRow[] {
  const db = getDatabase()
  return db
    .prepare('SELECT * FROM subcategories WHERE category_id = ? ORDER BY name ASC')
    .all(categoryId) as SubcategoryRow[]
}

export function getSubcategoryById(id: number): SubcategoryRow | undefined {
  const db = getDatabase()
  return db.prepare('SELECT * FROM subcategories WHERE id = ?').get(id) as SubcategoryRow | undefined
}

export function createSubcategory(input: SubcategoryInput): SubcategoryRow {
  const db = getDatabase()
  const result = db
    .prepare(
      `
    INSERT INTO subcategories (category_id, name)
    VALUES (?, ?)
  `
    )
    .run(input.category_id, input.name)

  return db.prepare('SELECT * FROM subcategories WHERE id = ?').get(Number(result.lastInsertRowid)) as SubcategoryRow
}

export function deleteSubcategory(id: number): boolean {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM subcategories WHERE id = ?').run(id)
  return result.changes > 0
}
