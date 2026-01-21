import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import { createSchema } from './schema'
import { seedDefaultCategories, seedDefaultSettings } from './seed'

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

export function getDatabasePath(): string {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'expenses.db')
}

export function initDatabase(): Database.Database {
  if (db) {
    return db
  }

  const dbPath = getDatabasePath()
  console.log('Initializing database at:', dbPath)

  db = new Database(dbPath)

  // Enable foreign keys
  db.pragma('foreign_keys = ON')

  // Create schema
  createSchema(db)

  // Seed default data
  seedDefaultCategories(db)
  seedDefaultSettings(db)

  console.log('Database initialized successfully')
  return db
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
    console.log('Database closed')
  }
}
