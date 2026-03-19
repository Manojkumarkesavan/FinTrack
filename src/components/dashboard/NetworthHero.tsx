'use client'
import { formatCurrency, formatCompact, type NetworthSummary, type NetworthSnapshot } from '@/types'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import AddSnapshotButton from './AddSnapshotButton'

interface Props {
  summary: NetworthSummary
  snapshots: NetworthSnapshot[]
}

export default function NetworthHero({ summary, snapshots }: Props) {
  // MoM change
  const prevSnapshot = snapshots.length >= 2 ? snapshots[snapshots.length - 2] : null
  const change = prevSnapshot ? summary.net_worth - prevSnapshot.net_worth : 0
  const changePct = prevSnapshot && prevSnapshot.net_worth !== 0
    ? (change / Math.abs(prevSnapshot.net_worth)) * 100 : 0

  const isPositive = change > 0
  const isNegative = change < 0

  return (
    <div className="card p-4 sm:p-6 relative overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.02]"
        style={{ backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />

      <div className="relative flex flex-col gap-4 sm:gap-6 md:gap-8">
        {/* Net worth */}
        <div className="flex-1">
          <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1 sm:mb-2">
            Net Worth
          </p>
          <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
            <span className="font-display text-3xl sm:text-4xl md:text-5xl text-[hsl(var(--foreground))] tracking-tight num">
              ₹{formatCompact(summary.net_worth)}
            </span>
            {change !== 0 && (
              <div className={`flex items-center gap-1 text-xs sm:text-sm font-medium ${isPositive ? 'text-gain' : isNegative ? 'text-loss' : 'text-neutral'}`}>
                {isPositive ? <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" /> : isNegative ? <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" /> : <Minus className="w-3 h-3 sm:w-4 sm:h-4" />}
                <span>{isPositive ? '+' : ''}{formatCompact(change)}</span>
                <span className="text-[10px] sm:text-xs opacity-75">({changePct > 0 ? '+' : ''}{changePct.toFixed(1)}%)</span>
              </div>
            )}
          </div>
          {prevSnapshot && (
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 sm:mt-1.5">vs last month</p>
          )}
        </div>

        {/* Assets vs Liabilities + Button */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-8">
          <div className="flex gap-3 sm:gap-4 flex-1">
            <StatPill label="Total Assets" value={summary.total_assets} color="text-gain" />
            <StatPill label="Total Liabilities" value={summary.total_liabilities} color="text-loss" />
          </div>
          <div className="flex-shrink-0">
            <AddSnapshotButton summary={summary} />
          </div>
        </div>

        {/* Breakdown bar */}
        <div className="relative mt-6 pt-5 border-t border-[hsl(var(--border))]">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Asset breakdown</p>
          </div>
          <BreakdownBar summary={summary} />
          <div className="flex flex-wrap gap-4 mt-3">
            {[
              { label: 'Equity', value: summary.equity_value, color: 'bg-emerald-500' },
              { label: 'Debt', value: summary.debt_value, color: 'bg-blue-500' },
              { label: 'Real Estate', value: summary.real_estate_value, color: 'bg-amber-500' },
              { label: 'Others', value: summary.others_value, color: 'bg-gray-500' },
            ].filter(i => i.value > 0).map(({ label, value, color }) => (
              <div key={label} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${color} flex-shrink-0`} />
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  {label} <span className="text-[hsl(var(--foreground))] font-medium">₹{formatCompact(value)}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-right md:text-left">
      <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">{label}</p>
      <p className={`text-xl font-semibold num ${color}`}>₹{formatCompact(value)}</p>
    </div>
  )
}

function BreakdownBar({ summary }: { summary: NetworthSummary }) {
  const total = summary.total_assets || 1
  const segments = [
    { pct: (summary.equity_value / total) * 100, color: 'bg-emerald-500' },
    { pct: (summary.debt_value / total) * 100, color: 'bg-blue-500' },
    { pct: (summary.real_estate_value / total) * 100, color: 'bg-amber-500' },
    { pct: (summary.others_value / total) * 100, color: 'bg-gray-500' },
  ].filter(s => s.pct > 0)

  return (
    <div className="flex h-2 rounded-full overflow-hidden gap-0.5 bg-[hsl(var(--muted))]">
      {segments.map((s, i) => (
        <div key={i} className={`${s.color} h-full transition-all duration-500`} style={{ width: `${s.pct}%` }} />
      ))}
    </div>
  )
}
