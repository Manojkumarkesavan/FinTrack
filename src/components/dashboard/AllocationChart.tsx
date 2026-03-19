'use client'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCompact, type NetworthSummary, type Asset } from '@/types'

const COLORS = { equity: '#10b981', debt: '#3b82f6', real_estate: '#f59e0b', bank: '#8b5cf6', others: '#6b7280' }

export default function AllocationChart({ summary, assets }: { summary: NetworthSummary; assets: Asset[] }) {
  const data = [
    { name: 'Equity', value: summary.equity_value, color: COLORS.equity },
    { name: 'Debt', value: summary.debt_value, color: COLORS.debt },
    { name: 'Real Estate', value: summary.real_estate_value, color: COLORS.real_estate },
    { name: 'Others', value: summary.others_value, color: COLORS.others },
  ].filter(d => d.value > 0)

  const total = summary.total_assets || 1

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Asset Allocation</h3>
        <span className="text-xs text-[hsl(var(--muted-foreground))]">{assets.length} assets</span>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 sm:h-40 text-[hsl(var(--muted-foreground))]">
          <p className="text-xs sm:text-sm">No assets added yet</p>
          <p className="text-xs mt-1">Add your first asset to see allocation</p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
          <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={32}
                  outerRadius={56}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`₹${formatCompact(value)}`, '']}
                  contentStyle={{ background: 'hsl(220 13% 10%)', border: '1px solid hsl(220 13% 16%)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'hsl(210 20% 92%)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-1.5 sm:space-y-2.5 w-full sm:w-auto text-xs sm:text-sm">
            {data.map(({ name, value, color }) => (
              <div key={name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">{name}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-[hsl(var(--foreground))] num">₹{formatCompact(value)}</span>
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))] ml-1.5">
                    {((value / total) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
