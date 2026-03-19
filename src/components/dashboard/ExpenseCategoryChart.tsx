'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import type { Transaction } from '@/types'
import { formatCompact } from '@/types'

interface ExpenseCategoryChartProps {
  transactions: Transaction[]
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export default function ExpenseCategoryChart({ transactions }: ExpenseCategoryChartProps) {
  const chartData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense')
    const byCategory = expenses.reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {})

    return Object.entries(byCategory)
      .map(([category, amount]) => ({ name: category, value: amount }))
      .sort((a, b) => b.value - a.value)
  }, [transactions])

  const totalExpenses = useMemo(
    () => chartData.reduce((sum, item) => sum + item.value, 0),
    [chartData]
  )

  if (!chartData.length || totalExpenses === 0) {
    return (
      <div className="card p-6 h-full flex flex-col">
        <h3 className="font-semibold text-[hsl(var(--foreground))] mb-4">Expense Breakdown</h3>
        <div className="flex-1 flex items-center justify-center text-[hsl(var(--muted-foreground))]">
          <p className="text-sm">No expense data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6 h-full flex flex-col">
      <h3 className="font-semibold text-[hsl(var(--foreground))] mb-4">Expense Breakdown</h3>
      <div className="flex-1 min-h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any) => `₹${formatCompact(value)}`}
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
                color: 'hsl(var(--foreground))',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 pt-4 border-t border-[hsl(var(--border))]">
        <div className="grid grid-cols-2 gap-2 text-xs">
          {chartData.slice(0, 4).map((item, idx) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: COLORS[idx % COLORS.length] }}
              />
              <span className="text-[hsl(var(--muted-foreground))]">
                {item.name}: <strong className="num text-[hsl(var(--foreground))]">₹{formatCompact(item.value)}</strong>
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-3">
          Total: <strong className="num text-emerald-400">₹{formatCompact(totalExpenses)}</strong>
        </p>
      </div>
    </div>
  )
}
