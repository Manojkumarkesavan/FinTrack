'use client'
import { useState } from 'react'
import { Lightbulb, RefreshCw, CheckCircle2, AlertCircle, TrendingUp, Wallet, Shield, Target } from 'lucide-react'
import { toast } from 'sonner'
import type { InsightCache, Profile, NetworthSummary } from '@/types'
import { formatCompact } from '@/types'
import { formatDistanceToNow } from 'date-fns'

const INSIGHT_CONFIG = [
  { type: 'emergency_fund', icon: Shield,    label: 'Emergency Fund',       color: 'text-blue-400',    bg: 'bg-blue-500/10',  border: 'border-blue-500/20' },
  { type: 'savings_rate',   icon: TrendingUp, label: 'Savings Rate',        color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { type: 'allocation',     icon: Wallet,     label: 'Asset Allocation',    color: 'text-amber-400',   bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { type: 'debt',           icon: AlertCircle, label: 'Debt Optimisation',  color: 'text-red-400',     bg: 'bg-red-500/10',   border: 'border-red-500/20' },
  { type: 'projection',     icon: Target,     label: 'Wealth Projection',   color: 'text-purple-400',  bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
]

export default function InsightsClient({
  initialInsights,
  profile,
  summary,
}: {
  initialInsights: InsightCache[]
  profile: Profile | null
  summary: NetworthSummary | null
}) {
  const [insights, setInsights] = useState<InsightCache[]>(initialInsights)
  const [loading, setLoading] = useState<string | null>(null)

  const getInsight = (type: string) => insights.find(i => i.insight_type === type)

  const generate = async (type: string) => {
    setLoading(type)
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insight_type: type, summary, profile }),
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      setInsights(prev => {
        const without = prev.filter(i => i.insight_type !== type)
        return [...without, data]
      })
      toast.success('Insight generated')
    } catch {
      toast.error('Failed to generate insight')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-semibold tracking-tight">AI Insights</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          Personalised analysis powered by Claude · Refreshed weekly
        </p>
      </div>

      {/* Net worth context */}
      {summary && (
        <div className="card p-4 flex flex-wrap gap-6 animate-fade-in-1">
          <Stat label="Net Worth" value={`₹${formatCompact(summary.net_worth)}`} />
          <Stat label="Total Assets" value={`₹${formatCompact(summary.total_assets)}`} />
          <Stat label="Total Liabilities" value={`₹${formatCompact(summary.total_liabilities)}`} />
          <Stat label="Equity" value={`₹${formatCompact(summary.equity_value)}`} color="text-emerald-400" />
          <Stat label="Debt" value={`₹${formatCompact(summary.debt_value)}`} color="text-blue-400" />
        </div>
      )}

      {/* Insight cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-2">
        {INSIGHT_CONFIG.map(({ type, icon: Icon, label, color, bg, border }) => {
          const cached = getInsight(type)
          const isLoading = loading === type
          return (
            <div key={type} className={`card p-5 border ${cached ? border : 'border-[hsl(var(--border))]'} transition-colors`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    {cached && (
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                        {formatDistanceToNow(new Date(cached.generated_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => generate(type)}
                  disabled={isLoading || loading !== null}
                  className={`p-1.5 rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors disabled:opacity-50 ${isLoading ? 'animate-spin' : ''}`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {isLoading ? (
                <div className="space-y-2">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-full" />
                  <div className="skeleton h-3 w-5/6" />
                </div>
              ) : cached ? (
                <div className="space-y-2">
                  <p className={`text-sm font-semibold ${color}`}>{cached.content.verdict}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">{cached.content.action}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center py-4 text-center">
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">No analysis yet</p>
                  <button
                    onClick={() => generate(type)}
                    disabled={loading !== null}
                    className={`mt-2 text-xs ${color} hover:opacity-70 transition-opacity disabled:opacity-40`}
                  >
                    Generate insight →
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="text-xs text-[hsl(var(--muted-foreground))] text-center animate-fade-in-3">
        Insights are generated using Claude Haiku and cached for 7 days. Always consult a qualified financial advisor before making investment decisions.
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-xs text-[hsl(var(--muted-foreground))] mb-0.5">{label}</p>
      <p className={`text-sm font-semibold num ${color || 'text-[hsl(var(--foreground))]'}`}>{value}</p>
    </div>
  )
}
