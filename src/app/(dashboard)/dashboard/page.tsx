import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NetworthHero from '@/components/dashboard/NetworthHero'
import AllocationChart from '@/components/dashboard/AllocationChart'
import CashflowChart from '@/components/dashboard/CashflowChart'
import NetworthTrend from '@/components/dashboard/NetworthTrend'
import RecentTransactions from '@/components/dashboard/RecentTransactions'
import HealthChecks from '@/components/dashboard/HealthChecks'
import ExpenseCategoryChart from '@/components/dashboard/ExpenseCategoryChart'
import InvestmentMetrics from '@/components/dashboard/InvestmentMetrics'
import PortfolioRisk from '@/components/dashboard/PortfolioRisk'
import BudgetStatus from '@/components/dashboard/BudgetStatus'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // Parallel data fetching
  const [
    { data: summary },
    { data: cashflow },
    { data: snapshots },
    { data: transactions },
    { data: assets },
    { data: liabilities },
    { data: investments },
    { data: profile },
  ] = await Promise.all([
    supabase.rpc('get_networth_summary', { p_user_id: user.id }),
    supabase.rpc('get_monthly_cashflow', { p_user_id: user.id, p_months: 6 }),
    supabase.from('networth_snapshots').select('*').eq('user_id', user.id).order('snapshot_date', { ascending: true }).limit(13),
    supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(100),
    supabase.from('assets').select('*').eq('user_id', user.id),
    supabase.from('liabilities').select('*').eq('user_id', user.id),
    supabase.from('investments').select('*').eq('user_id', user.id),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ])

  const networthData = summary?.[0] ?? {
    total_assets: 0, total_liabilities: 0, net_worth: 0,
    equity_value: 0, debt_value: 0, real_estate_value: 0, others_value: 0,
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))] tracking-tight">
          Good {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'there'}.
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          Here's your financial snapshot.
        </p>
      </div>

      {/* Net worth hero */}
      <div className="animate-fade-in-1">
        <NetworthHero summary={networthData} snapshots={snapshots ?? []} />
      </div>

      {/* Row: Allocation + Cashflow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 animate-fade-in-2">
        <AllocationChart summary={networthData} assets={assets ?? []} />
        <CashflowChart cashflow={cashflow ?? []} />
      </div>

      {/* Row: NW trend + Recent tx */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 animate-fade-in-3">
        <div className="lg:col-span-3">
          <NetworthTrend snapshots={snapshots ?? []} currentNW={networthData.net_worth} />
        </div>
        <div className="lg:col-span-2">
          <RecentTransactions transactions={transactions ?? []} />
        </div>
      </div>

      {/* Health checks */}
      <div className="animate-fade-in-4">
        <HealthChecks
          summary={networthData}
          profile={profile}
          transactions={transactions ?? []}
          liabilities={liabilities ?? []}
        />
      </div>

      {/* Phase 3 enhancements */}
      {/* Row: Expense Breakdown + Investment Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-5">
        <ExpenseCategoryChart transactions={transactions ?? []} />
        {(investments ?? []).length > 0 && <InvestmentMetrics investments={investments ?? []} />}
      </div>

      {/* Row: Portfolio Risk + Budget Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-6">
        {(assets ?? []).length > 0 && <PortfolioRisk assets={assets as any} />}
        <BudgetStatus transactions={transactions ?? []} />
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
