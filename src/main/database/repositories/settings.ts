import { getDatabase } from '../index'

export function getSetting(key: string): string | null {
  const db = getDatabase()
  const result = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
  return result?.value ?? null
}

export function setSetting(key: string, value: string): boolean {
  const db = getDatabase()
  const result = db
    .prepare(
      `
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `
    )
    .run(key, value)
  return result.changes > 0
}

export function deleteSetting(key: string): boolean {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM settings WHERE key = ?').run(key)
  return result.changes > 0
}

export function getAllSettings(): Record<string, string> {
  const db = getDatabase()
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[]
  return rows.reduce(
    (acc, row) => {
      acc[row.key] = row.value
      return acc
    },
    {} as Record<string, string>
  )
}
