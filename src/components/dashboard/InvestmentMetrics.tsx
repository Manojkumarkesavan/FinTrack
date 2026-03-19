'use client'

import { useMemo } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { Investment } from '@/types'
import { formatCompact } from '@/types'

interface InvestmentMetricsProps {
  investments: Investment[]
}

export default function InvestmentMetrics({ investments }: InvestmentMetricsProps) {
  const metrics = useMemo(() => {
    const invested = investments.reduce((sum, i) => sum + (i.invested_value ?? 0), 0)
    const current = investments.reduce((sum, i) => sum + (i.current_value ?? 0), 0)
    const pnl = current - invested
    const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0

    // Calculate average XIRR (simple average, not weighted)
    const xirrValues = investments.filter(i => i.xirr !== null).map(i => i.xirr as number)
    const avgXirr = xirrValues.length > 0 ? xirrValues.reduce((a, b) => a + b, 0) / xirrValues.length : 0

    return {
      invested,
      current,
      pnl,
      pnlPct,
      avgXirr,
      holdingsCount: investments.length,
    }
  }, [investments])

  const isPnlPositive = metrics.pnl >= 0

  if (metrics.invested === 0) {
    return (
      <div className="card p-6">
        <h3 className="font-semibold text-[hsl(var(--foreground))] mb-4">Investment Metrics</h3>
        <div className="text-center py-8">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">No investments yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-[hsl(var(--foreground))] mb-4">Investment Metrics</h3>
      <div className="space-y-4">
        {/* P&L */}
        <div className="flex items-start justify-between p-3 rounded-lg bg-[hsl(var(--accent))]">
          <div>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Unrealised P&L</p>
            <div className="flex items-center gap-2">
              {isPnlPositive ? (
                <TrendingUp className="w-4 h-4 text-gain" />
              ) : (
                <TrendingDown className="w-4 h-4 text-loss" />
              )}
              <p className={`text-lg font-semibold num ${isPnlPositive ? 'text-gain' : 'text-loss'}`}>
                {isPnlPositive ? '+' : ''}₹{formatCompact(metrics.pnl)}
              </p>
            </div>
          </div>
          <p className={`text-lg font-semibold num ${isPnlPositive ? 'text-gain' : 'text-loss'}`}>
            {isPnlPositive ? '+' : ''}
            {metrics.pnlPct.toFixed(2)}%
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Invested"
            value={`₹${formatCompact(metrics.invested)}`}
            subValue={`${metrics.holdingsCount} holdings`}
          />
          <MetricCard
            label="Current Value"
            value={`₹${formatCompact(metrics.current)}`}
            subValue="Market price"
          />
          <MetricCard
            label="Avg. XIRR"
            value={`${metrics.avgXirr.toFixed(2)}%`}
            subValue="Annualized return"
          />
          <MetricCard
            label="Return/Invested"
            value={`${((metrics.current / metrics.invested) * 100).toFixed(1)}%`}
            subValue="Absolute return"
          />
        </div>

        {/* Summary */}
        <div className="pt-3 border-t border-[hsl(var(--border))]">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Invested <strong className="num text-[hsl(var(--foreground))]">₹{formatCompact(metrics.invested)}</strong> →
            {' '}<strong className="num text-[hsl(var(--foreground))]">₹{formatCompact(metrics.current)}</strong>
          </p>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, subValue }: { label: string; value: string; subValue: string }) {
  return (
    <div className="p-3 rounded bg-[hsl(var(--accent))]">
      <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">{label}</p>
      <p className="text-sm font-semibold num text-[hsl(var(--foreground))]">{value}</p>
      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{subValue}</p>
    </div>
  )
}
