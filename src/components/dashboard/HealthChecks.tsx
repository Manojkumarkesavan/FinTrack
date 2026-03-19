'use client'
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react'
import type { NetworthSummary, Profile, Transaction, Liability } from '@/types'

type Status = 'good' | 'warn' | 'bad'

interface Check {
  title: string
  verdict: string
  status: Status
  detail: string
}

function computeChecks(
  summary: NetworthSummary,
  profile: Profile | null,
  transactions: Transaction[],
  liabilities: Liability[]
): Check[] {
  const checks: Check[] = []

  // 1. Emergency fund
  const monthlyExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  const estimatedMonthly = monthlyExpense > 0 ? monthlyExpense : (profile?.monthly_income ?? 50000) * 0.6
  const bankAssets = summary.total_assets * 0.1 // rough proxy
  const efMonths = estimatedMonthly > 0 ? bankAssets / estimatedMonthly : 0
  checks.push({
    title: 'Emergency Fund',
    verdict: efMonths >= 6 ? 'Well-funded' : efMonths >= 3 ? 'Adequate' : 'Under-funded',
    status: efMonths >= 6 ? 'good' : efMonths >= 3 ? 'warn' : 'bad',
    detail: `~${efMonths.toFixed(1)} months covered. Target: 6 months of expenses.`,
  })

  // 2. Debt-to-income ratio
  const totalEMI = liabilities.reduce((sum, l) => sum + (l.emi_amount ?? 0), 0)
  const monthlyIncome = profile?.monthly_income ?? 50000
  const dtiPct = monthlyIncome > 0 ? (totalEMI / monthlyIncome) * 100 : 0
  checks.push({
    title: 'Debt-to-Income',
    verdict: dtiPct <= 30 ? 'Healthy' : dtiPct <= 50 ? 'Moderate' : 'High',
    status: dtiPct <= 30 ? 'good' : dtiPct <= 50 ? 'warn' : 'bad',
    detail: `EMIs are ${dtiPct.toFixed(0)}% of income. Keep below 40%.`,
  })

  // 3. Investment ratio
  const investPct = summary.total_assets > 0 ? (summary.equity_value / summary.total_assets) * 100 : 0
  checks.push({
    title: 'Equity Allocation',
    verdict: investPct >= 30 ? 'Well invested' : investPct >= 10 ? 'Building' : 'Low',
    status: investPct >= 30 ? 'good' : investPct >= 10 ? 'warn' : 'bad',
    detail: `${investPct.toFixed(0)}% in equity. Rule of thumb: 100 - your age.`,
  })

  // 4. Net worth positive
  checks.push({
    title: 'Net Worth',
    verdict: summary.net_worth > 0 ? 'Positive' : summary.net_worth === 0 ? 'Break-even' : 'Negative',
    status: summary.net_worth > 0 ? 'good' : summary.net_worth === 0 ? 'warn' : 'bad',
    detail: summary.net_worth > 0
      ? 'Assets exceed liabilities — great foundation.'
      : 'Liabilities exceed assets. Focus on debt reduction.',
  })

  return checks
}

const STATUS_CONFIG: Record<Status, { icon: typeof CheckCircle2; color: string; bg: string }> = {
  good:  { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  warn:  { icon: AlertCircle,  color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  bad:   { icon: XCircle,      color: 'text-red-400',     bg: 'bg-red-500/10' },
}

export default function HealthChecks({ summary, profile, transactions, liabilities }: {
  summary: NetworthSummary
  profile: Profile | null
  transactions: Transaction[]
  liabilities: Liability[]
}) {
  const checks = computeChecks(summary, profile, transactions, liabilities)

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Financial Health</h3>
        <span className="text-xs text-[hsl(var(--muted-foreground))]">
          {checks.filter(c => c.status === 'good').length}/{checks.length} checks passing
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {checks.map((check) => {
          const { icon: Icon, color, bg } = STATUS_CONFIG[check.status]
          return (
            <div key={check.title} className={`rounded-xl p-4 ${bg} border border-transparent hover:border-[hsl(var(--border))] transition-colors`}>
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{check.title}</span>
                <Icon className={`w-4 h-4 ${color} flex-shrink-0 mt-0.5`} />
              </div>
              <p className={`text-sm font-semibold ${color} mb-1`}>{check.verdict}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">{check.detail}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
