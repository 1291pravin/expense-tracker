import { getDatabase } from '../index'

export interface CategorySummary {
  category_id: number
  category_name: string
  category_icon: string | null
  category_color: string | null
  total: number
  count: number
  percentage: number
}

export interface MonthlySummary {
  total: number
  count: number
  byCategory: CategorySummary[]
}

export function getMonthlySummary(year: number, month: number): MonthlySummary {
  const db = getDatabase()

  // Format month for SQL comparison (YYYY-MM)
  const monthStr = `${year}-${month.toString().padStart(2, '0')}`

  // Get total and count
  const totals = db
    .prepare(
      `
    SELECT
      COALESCE(SUM(amount), 0) as total,
      COUNT(*) as count
    FROM expenses
    WHERE strftime('%Y-%m', date) = ?
  `
    )
    .get(monthStr) as { total: number; count: number }

  // Get breakdown by category
  const breakdown = db
    .prepare(
      `
    SELECT
      c.id as category_id,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color,
      COALESCE(SUM(e.amount), 0) as total,
      COUNT(e.id) as count
    FROM categories c
    LEFT JOIN expenses e ON e.category_id = c.id AND strftime('%Y-%m', e.date) = ?
    GROUP BY c.id
    HAVING total > 0
    ORDER BY total DESC
  `
    )
    .all(monthStr) as Omit<CategorySummary, 'percentage'>[]

  // Calculate percentages
  const byCategory: CategorySummary[] = breakdown.map((row) => ({
    ...row,
    percentage: totals.total > 0 ? (row.total / totals.total) * 100 : 0
  }))

  return {
    total: totals.total,
    count: totals.count,
    byCategory
  }
}

export function getCycleSummary(year: number, month: number, startDay: number): MonthlySummary {
  if (startDay === 1) {
    return getMonthlySummary(year, month)
  }

  // Cycle for "month/year" runs from startDay of previous month to (startDay - 1) of current month
  // e.g. startDay=25, month=1 (Jan), year=2026 → 25 Dec 2025 to 24 Jan 2026
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year

  const dateFrom = `${prevYear}-${prevMonth.toString().padStart(2, '0')}-${startDay.toString().padStart(2, '0')}`
  const dateTo = `${year}-${month.toString().padStart(2, '0')}-${(startDay - 1).toString().padStart(2, '0')}`

  const db = getDatabase()

  const totals = db
    .prepare(
      `
    SELECT
      COALESCE(SUM(amount), 0) as total,
      COUNT(*) as count
    FROM expenses
    WHERE date >= ? AND date <= ?
  `
    )
    .get(dateFrom, dateTo) as { total: number; count: number }

  const byCategory = getCategoryBreakdown(dateFrom, dateTo)

  return {
    total: totals.total,
    count: totals.count,
    byCategory
  }
}

export function getCategoryBreakdown(dateFrom: string, dateTo: string): CategorySummary[] {
  const db = getDatabase()

  // Get total for percentage calculation
  const totalResult = db
    .prepare(
      `
    SELECT COALESCE(SUM(amount), 0) as total
    FROM expenses
    WHERE date >= ? AND date <= ?
  `
    )
    .get(dateFrom, dateTo) as { total: number }

  const totalAmount = totalResult.total

  // Get breakdown by category
  const breakdown = db
    .prepare(
      `
    SELECT
      c.id as category_id,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color,
      COALESCE(SUM(e.amount), 0) as total,
      COUNT(e.id) as count
    FROM categories c
    LEFT JOIN expenses e ON e.category_id = c.id AND e.date >= ? AND e.date <= ?
    GROUP BY c.id
    HAVING total > 0
    ORDER BY total DESC
  `
    )
    .all(dateFrom, dateTo) as Omit<CategorySummary, 'percentage'>[]

  return breakdown.map((row) => ({
    ...row,
    percentage: totalAmount > 0 ? (row.total / totalAmount) * 100 : 0
  }))
}
