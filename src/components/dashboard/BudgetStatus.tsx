'use client'

import { useMemo } from 'react'
import { AlertCircle, TrendingDown } from 'lucide-react'
import type { Transaction } from '@/types'
import { EXPENSE_CATEGORIES, formatCompact } from '@/types'

interface BudgetStatusProps {
  transactions: Transaction[]
}

// Default monthly budget limits per category (in INR)
const DEFAULT_BUDGETS: Record<string, number> = {
  'Housing': 50000,
  'EMI': 30000,
  'Groceries': 10000,
  'Dining': 8000,
  'Transport': 5000,
  'Fuel': 4000,
  'Utilities': 5000,
  'Healthcare': 3000,
  'Insurance': 5000,
  'Shopping': 10000,
  'Entertainment': 5000,
  'Travel': 8000,
  'Education': 10000,
  'Personal care': 2000,
  'Subscriptions': 1000,
  'SIP/Investments': 0, // No limit
  'Charity': 5000,
  'Miscellaneous': 5000,
}

export default function BudgetStatus({ transactions }: BudgetStatusProps) {
  // Get current month transactions
  const currentMonth = new Date()
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

  const currentMonthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date)
      return t.type === 'expense' && tDate >= monthStart && tDate <= monthEnd
    })
  }, [transactions])

  const spendingByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    currentMonthTransactions.forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount
    })
    return map
  }, [currentMonthTransactions])

  const budgetStatus = useMemo(() => {
    return Object.entries(spendingByCategory)
      .map(([category, spent]) => {
        const budget = DEFAULT_BUDGETS[category] || 20000 // Default fallback
        const percentage = budget > 0 ? (spent / budget) * 100 : 100
        const remaining = Math.max(0, budget - spent)
        const isOverBudget = spent > budget

        return {
          category,
          spent,
          budget,
          percentage,
          remaining,
          isOverBudget,
        }
      })
      .sort((a, b) => {
        // Show over-budget first
        if (a.isOverBudget && !b.isOverBudget) return -1
        if (!a.isOverBudget && b.isOverBudget) return 1
        // Then sort by percentage (highest first)
        return b.percentage - a.percentage
      })
  }, [spendingByCategory])

  const totalBudget = useMemo(
    () => Object.values(DEFAULT_BUDGETS).reduce((sum, b) => sum + b, 0),
    []
  )

  const totalSpent = useMemo(() => Object.values(spendingByCategory).reduce((sum, s) => sum + s, 0), [spendingByCategory])

  const overBudgetCategories = budgetStatus.filter(b => b.isOverBudget)
  const monthProgress = (totalSpent / totalBudget) * 100

  if (budgetStatus.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="font-semibold text-[hsl(var(--foreground))] mb-4">Monthly Budget</h3>
        <div className="text-center py-8">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">No expenses this month</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-[hsl(var(--foreground))] mb-4">Monthly Budget Status</h3>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="p-3 rounded bg-[hsl(var(--accent))]">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Spent</p>
          <p className="text-sm font-semibold num text-[hsl(var(--foreground))]">₹{formatCompact(totalSpent)}</p>
        </div>
        <div className="p-3 rounded bg-[hsl(var(--accent))]">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Budget</p>
          <p className="text-sm font-semibold num text-[hsl(var(--foreground))]">₹{formatCompact(totalBudget)}</p>
        </div>
        <div className="p-3 rounded bg-[hsl(var(--accent))]">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Progress</p>
          <p className={`text-sm font-semibold num ${monthProgress > 100 ? 'text-loss' : 'text-[hsl(var(--foreground))]'}`}>
            {monthProgress.toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-[hsl(var(--muted-foreground))]">This Month</span>
          <span className="font-semibold num text-[hsl(var(--foreground))]">
            ₹{formatCompact(totalSpent)} / ₹{formatCompact(totalBudget)}
          </span>
        </div>
        <div className="h-2.5 bg-[hsl(var(--accent))] rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${monthProgress > 100 ? 'bg-loss' : 'bg-gain'}`}
            style={{ width: `${Math.min(monthProgress, 100)}%` }}
          />
        </div>
      </div>

      {/* Over-budget alert */}
      {overBudgetCategories.length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-600">
            <strong>{overBudgetCategories.length}</strong> categ{overBudgetCategories.length > 1 ? 'ories are' : 'ory is'} over budget
          </p>
        </div>
      )}

      {/* Top categories */}
      <div className="space-y-2.5">
        {budgetStatus.slice(0, 5).map(item => (
          <div key={item.category}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-medium ${item.isOverBudget ? 'text-loss' : 'text-[hsl(var(--foreground))]'}`}>
                {item.category}
              </span>
              <span className="text-xs num text-[hsl(var(--muted-foreground))]">
                ₹{formatCompact(item.spent)} / {formatCompact(item.budget)}
              </span>
            </div>
            <div className="h-1.5 bg-[hsl(var(--accent))] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${item.isOverBudget ? 'bg-loss' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(item.percentage, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {budgetStatus.length > 5 && (
        <p className="mt-3 pt-3 border-t border-[hsl(var(--border))] text-xs text-[hsl(var(--muted-foreground))]">
          +{budgetStatus.length - 5} more categories
        </p>
      )}
    </div>
  )
}
