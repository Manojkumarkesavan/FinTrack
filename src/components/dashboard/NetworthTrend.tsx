'use client'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatCompact, type NetworthSnapshot } from '@/types'
import { format, parseISO } from 'date-fns'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card px-3 py-2.5 text-xs shadow-xl">
      <p className="text-[hsl(var(--muted-foreground))] mb-1">{label}</p>
      <p className="font-semibold text-emerald-400 num">₹{formatCompact(payload[0].value)}</p>
    </div>
  )
}

export default function NetworthTrend({
  snapshots,
  currentNW,
}: {
  snapshots: NetworthSnapshot[]
  currentNW: number
}) {
  const data = [
    ...snapshots.map(s => ({
      date: format(parseISO(s.snapshot_date), 'MMM yy'),
      value: s.net_worth,
    })),
    { date: 'Now', value: currentNW },
  ]

  // Deduplicate last point if snapshot taken today
  const unique = data.filter((d, i, arr) => i === 0 || d.date !== arr[i - 1].date)

  const isGrowing = unique.length >= 2 && unique[unique.length - 1].value >= unique[0].value

  return (
    <div className="card p-4 sm:p-5 h-full">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Net Worth Trend</h3>
        <span className="text-xs text-[hsl(var(--muted-foreground))]">All snapshots</span>
      </div>

      {unique.length < 2 ? (
        <div className="flex flex-col items-center justify-center h-40 text-[hsl(var(--muted-foreground))]">
          <p className="text-xs sm:text-sm">Save 2+ snapshots to see trend</p>
          <p className="text-xs mt-1">Click "Save snapshot" on the dashboard</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={unique} margin={{ left: 0, right: 8 }}>
            <defs>
              <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isGrowing ? '#10b981' : '#f87171'} stopOpacity={0.15} />
                <stop offset="95%" stopColor={isGrowing ? '#10b981' : '#f87171'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(220 13% 16%)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: 'hsl(210 15% 55%)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(210 15% 55%)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `₹${formatCompact(v)}`}
              width={56}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={isGrowing ? '#10b981' : '#f87171'}
              strokeWidth={2}
              fill="url(#nwGrad)"
              dot={{ fill: isGrowing ? '#10b981' : '#f87171', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
