'use client'
import { useState, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Upload, TrendingUp, TrendingDown, RefreshCw, Trash2, HelpCircle } from 'lucide-react'
import Papa from 'papaparse'
import type { Investment } from '@/types'
import { formatCompact } from '@/types'

// ── Zerodha CSV parser ─────────────────────────────────────────────────
function parseZerodhaCSV(rows: any[]): Partial<Investment>[] {
  return rows
    .filter(r => r['Instrument'] || r['Symbol'])
    .map(r => ({
      symbol: r['Instrument'] || r['Symbol'] || '',
      name: r['Instrument'] || r['Symbol'] || '',
      investment_type: (r['Instrument'] || '').endsWith('MF') ? 'mf' : 'stock' as any,
      broker: 'zerodha' as any,
      quantity: parseFloat(r['Qty.'] || r['Quantity'] || '0'),
      avg_cost: parseFloat(r['Avg. cost'] || r['Avg Cost'] || '0'),
      ltp: parseFloat(r['LTP'] || '0'),
      current_value: parseFloat(r['Cur. val'] || r['Current Value'] || '0'),
      invested_value: parseFloat(r['Avg. cost'] || '0') * parseFloat(r['Qty.'] || '0'),
      unrealised_pnl: parseFloat(r['P&L'] || r['Unrealised P&L'] || '0'),
      currency: 'INR' as any,
    })).filter(i => i.quantity && i.quantity > 0)
}

// ── Groww CSV parser ───────────────────────────────────────────────────
function parseGrowwCSV(rows: any[]): Partial<Investment>[] {
  return rows
    .filter(r => r['Scheme Name'] || r['Stock'])
    .map(r => ({
      symbol: r['Stock'] || r['Scheme Name'] || '',
      name: r['Scheme Name'] || r['Stock'] || '',
      investment_type: r['Scheme Name'] ? 'mf' : 'stock' as any,
      broker: 'groww' as any,
      quantity: parseFloat(r['Units'] || r['Quantity'] || '0'),
      avg_cost: parseFloat(r['Avg NAV'] || r['Avg Cost'] || '0'),
      ltp: parseFloat(r['Current NAV'] || r['LTP'] || '0'),
      current_value: parseFloat(r['Current Value'] || '0'),
      invested_value: parseFloat(r['Invested Value'] || '0'),
      unrealised_pnl: parseFloat(r['P&L'] || '0'),
      currency: 'INR' as any,
    })).filter(i => i.quantity && i.quantity > 0)
}

export default function InvestmentsClient({ initialInvestments }: { initialInvestments: Investment[] }) {
  const [investments, setInvestments] = useState(initialInvestments)
  const [importing, setImporting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const summary = useMemo(() => {
    const invested = investments.reduce((s, i) => s + (i.invested_value ?? 0), 0)
    const current = investments.reduce((s, i) => s + (i.current_value ?? 0), 0)
    const pnl = current - invested
    const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0
    return { invested, current, pnl, pnlPct }
  }, [investments])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async ({ data }) => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return

          const rows = data as any[]
          const isZerodha = Object.keys(rows[0] || {}).some(k => k.includes('Avg. cost') || k.includes('LTP'))
          const parsed = isZerodha ? parseZerodhaCSV(rows) : parseGrowwCSV(rows)

          if (parsed.length === 0) { toast.error('No valid rows found in CSV'); setImporting(false); return }

          const batchId = crypto.randomUUID()
          const toInsert = parsed.map(p => ({ ...p, user_id: user.id, import_batch_id: batchId }))

          const { data: inserted, error } = await supabase
            .from('investments')
            .upsert(toInsert, { onConflict: 'user_id,symbol,broker' })
            .select()

          if (error) throw error
          setInvestments(prev => {
            const ids = new Set((inserted ?? []).map(i => i.id))
            return [...prev.filter(i => !ids.has(i.id)), ...(inserted ?? [])]
          })
          toast.success(`Imported ${parsed.length} holdings`)
        } catch (err) {
          toast.error('Import failed — check CSV format')
        } finally {
          setImporting(false)
          if (fileRef.current) fileRef.current.value = ''
        }
      },
    })
  }

  const handleDeleteAll = async () => {
    if (!confirm('Delete all investments? This cannot be undone.')) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('investments').delete().eq('user_id', user.id)
    setInvestments([])
    toast.success('All investments removed')
  }

  // Group by type
  const grouped = useMemo(() => {
    const map: Record<string, Investment[]> = {}
    investments.forEach(i => {
      if (!map[i.investment_type]) map[i.investment_type] = []
      map[i.investment_type].push(i)
    })
    return map
  }, [investments])

  const typeLabels: Record<string, string> = { stock: 'Stocks', mf: 'Mutual Funds', etf: 'ETFs', us_stock: 'US Stocks' }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Investments</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{investments.length} holdings</p>
        </div>
        <div className="flex items-center gap-2">
          {investments.length > 0 && (
            <button onClick={handleDeleteAll} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[hsl(var(--border))] text-xs text-[hsl(var(--muted-foreground))] hover:text-red-400 hover:border-red-500/30 transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Clear all
            </button>
          )}
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium transition-colors disabled:opacity-60"
          >
            <Upload className="w-4 h-4" />
            {importing ? 'Importing…' : 'Import CSV'}
          </button>
        </div>
      </div>

      {/* Import help */}
      <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 animate-fade-in-1">
        <HelpCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
          Export your holdings from <span className="text-emerald-400">Zerodha Console → Portfolio → Holdings → Download CSV</span>, or from <span className="text-emerald-400">Groww → Portfolio → Download</span>. Then upload here. Your data is parsed locally and never stored raw.
        </p>
      </div>

      {/* Summary cards */}
      {investments.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in-2">
          <SummaryCard label="Invested" value={`₹${formatCompact(summary.invested)}`} />
          <SummaryCard label="Current Value" value={`₹${formatCompact(summary.current)}`} />
          <SummaryCard
            label="Unrealised P&L"
            value={`${summary.pnl >= 0 ? '+' : ''}₹${formatCompact(summary.pnl)}`}
            subValue={`${summary.pnlPct >= 0 ? '+' : ''}${summary.pnlPct.toFixed(2)}%`}
            color={summary.pnl >= 0 ? 'text-gain' : 'text-loss'}
          />
          <SummaryCard label="Holdings" value={`${investments.length}`} subValue={`${Object.keys(grouped).length} types`} />
        </div>
      )}

      {/* Holdings table */}
      {investments.length === 0 ? (
        <EmptyInvestments onImport={() => fileRef.current?.click()} />
      ) : (
        <div className="space-y-4 animate-fade-in-3">
          {Object.entries(grouped).map(([type, items]) => (
            <div key={type} className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--accent))/30]">
                <span className="text-sm font-medium">{typeLabels[type] || type}</span>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">{items.length} holdings</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[hsl(var(--border))]">
                      {['Symbol', 'Qty', 'Avg Cost', 'LTP', 'Invested', 'Current', 'P&L', 'P&L %'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-[hsl(var(--muted-foreground))]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[hsl(var(--border))]">
                    {items.map(inv => {
                      const pnl = (inv.current_value ?? 0) - (inv.invested_value ?? 0)
                      const pnlPct = (inv.invested_value ?? 0) > 0 ? (pnl / inv.invested_value!) * 100 : 0
                      return (
                        <tr key={inv.id} className="hover:bg-[hsl(var(--accent))] transition-colors">
                          <td className="px-4 py-3 font-medium">{inv.symbol}</td>
                          <td className="px-4 py-3 num text-[hsl(var(--muted-foreground))]">{inv.quantity.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3 num">₹{formatCompact(inv.avg_cost)}</td>
                          <td className="px-4 py-3 num">{inv.ltp ? `₹${formatCompact(inv.ltp)}` : '—'}</td>
                          <td className="px-4 py-3 num">₹{formatCompact(inv.invested_value ?? 0)}</td>
                          <td className="px-4 py-3 num font-medium">₹{formatCompact(inv.current_value ?? 0)}</td>
                          <td className={`px-4 py-3 num ${pnl >= 0 ? 'text-gain' : 'text-loss'}`}>
                            {pnl >= 0 ? '+' : ''}₹{formatCompact(pnl)}
                          </td>
                          <td className={`px-4 py-3 num text-sm ${pnl >= 0 ? 'text-gain' : 'text-loss'}`}>
                            {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value, subValue, color }: { label: string; value: string; subValue?: string; color?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">{label}</p>
      <p className={`text-lg font-semibold num ${color || 'text-[hsl(var(--foreground))]'}`}>{value}</p>
      {subValue && <p className={`text-xs num ${color || 'text-[hsl(var(--muted-foreground))]'}`}>{subValue}</p>}
    </div>
  )
}

function EmptyInvestments({ onImport }: { onImport: () => void }) {
  return (
    <div className="card flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <TrendingUp className="w-10 h-10 text-[hsl(var(--muted-foreground))] mb-3" />
      <p className="text-sm font-medium">No investments imported</p>
      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 mb-4 max-w-xs">
        Download your holdings CSV from Zerodha Console or Groww and upload it here
      </p>
      <button onClick={onImport} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium transition-colors">
        <Upload className="w-4 h-4" /> Import Holdings CSV
      </button>
    </div>
  )
}
