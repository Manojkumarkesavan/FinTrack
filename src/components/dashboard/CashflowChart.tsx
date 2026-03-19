'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatCompact, type MonthlyCashflow } from '@/types'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card px-3 py-2.5 text-xs space-y-1.5 shadow-xl">
      <p className="font-medium text-[hsl(var(--foreground))] mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span style={{ color: p.fill }}>{p.name}</span>
          <span className="font-medium num">₹{formatCompact(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function CashflowChart({ cashflow }: { cashflow: MonthlyCashflow[] }) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Monthly Cashflow</h3>
        <span className="text-xs text-[hsl(var(--muted-foreground))]">Last 6 months</span>
      </div>

      {cashflow.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-[hsl(var(--muted-foreground))]">
          <p className="text-xs sm:text-sm">No transactions yet</p>
          <p className="text-xs mt-1">Add income & expenses to see cashflow</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={cashflow} barSize={10} barGap={4}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(220 13% 16%)" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: 'hsl(210 15% 55%)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(210 15% 55%)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `₹${formatCompact(v)}`}
              width={52}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(220 13% 14%)', radius: 4 }} />
            <Bar dataKey="income" name="Income" fill="#10b981" radius={[3, 3, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#f87171" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
