import Database from 'better-sqlite3'

interface CategorySeed {
  name: string
  icon: string
  color: string
  subcategories: string[]
}

const defaultCategories: CategorySeed[] = [
  {
    name: 'Food & Dining',
    icon: '🍔',
    color: '#FF6B6B',
    subcategories: ['Groceries', 'Restaurants', 'Coffee', 'Fast Food']
  },
  {
    name: 'Transportation',
    icon: '🚗',
    color: '#4ECDC4',
    subcategories: ['Fuel', 'Public Transit', 'Parking', 'Maintenance']
  },
  {
    name: 'Shopping',
    icon: '🛍️',
    color: '#45B7D1',
    subcategories: ['Clothing', 'Electronics', 'Home', 'Gifts']
  },
  {
    name: 'Entertainment',
    icon: '🎬',
    color: '#96CEB4',
    subcategories: ['Movies', 'Games', 'Subscriptions', 'Events']
  },
  {
    name: 'Bills & Utilities',
    icon: '💡',
    color: '#FFEAA7',
    subcategories: ['Electricity', 'Internet', 'Phone', 'Water']
  },
  {
    name: 'Health & Medical',
    icon: '💊',
    color: '#DDA0DD',
    subcategories: ['Doctor', 'Pharmacy', 'Insurance', 'Gym']
  },
  {
    name: 'Travel',
    icon: '✈️',
    color: '#98D8C8',
    subcategories: ['Flights', 'Hotels', 'Activities']
  },
  {
    name: 'Education',
    icon: '📚',
    color: '#F7DC6F',
    subcategories: ['Books', 'Courses', 'Supplies']
  },
  {
    name: 'Personal Care',
    icon: '💇',
    color: '#BB8FCE',
    subcategories: ['Haircut', 'Cosmetics', 'Spa']
  },
  {
    name: 'Other',
    icon: '📦',
    color: '#AEB6BF',
    subcategories: ['Miscellaneous']
  }
]

export function seedDefaultCategories(db: Database.Database): void {
  // Check if categories already exist
  const count = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number }
  if (count.count > 0) {
    return // Already seeded
  }

  const insertCategory = db.prepare(`
    INSERT INTO categories (name, icon, color, is_default) VALUES (?, ?, ?, 1)
  `)

  const insertSubcategory = db.prepare(`
    INSERT INTO subcategories (category_id, name) VALUES (?, ?)
  `)

  const seedTransaction = db.transaction(() => {
    for (const category of defaultCategories) {
      const result = insertCategory.run(category.name, category.icon, category.color)
      const categoryId = result.lastInsertRowid

      for (const subcategory of category.subcategories) {
        insertSubcategory.run(categoryId, subcategory)
      }
    }
  })

  seedTransaction()
}

export function seedDefaultSettings(db: Database.Database): void {
  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)
  `)

  insertSetting.run('currency_symbol', '$')
}
