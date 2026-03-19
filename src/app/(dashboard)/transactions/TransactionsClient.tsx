'use client'
import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, Trash2, Edit2, Filter, ArrowUpDown } from 'lucide-react'
import type { Transaction, TransactionFormData } from '@/types'
import { formatCompact, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/types'
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns'
import TransactionModal from '@/components/modals/TransactionModal'

type FilterType = 'all' | 'income' | 'expense'

export default function TransactionsClient({ initialTransactions }: { initialTransactions: Transaction[] }) {
  const [transactions, setTransactions] = useState(initialTransactions)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [filterCategory, setFilterCategory] = useState('')
  const supabase = createClient()

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (filterType !== 'all' && t.type !== filterType) return false
      if (filterCategory && t.category !== filterCategory) return false
      return true
    })
  }, [transactions, filterType, filterCategory])

  const summary = useMemo(() => {
    const now = new Date()
    const thisMonth = transactions.filter(t => {
      const d = parseISO(t.date)
      return d >= startOfMonth(now) && d <= endOfMonth(now)
    })
    return {
      income: thisMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expenses: thisMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    }
  }, [transactions])

  const handleSave = async (data: TransactionFormData) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editing) {
      const { data: updated, error } = await supabase
        .from('transactions').update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', editing.id).select().single()
      if (error) { toast.error('Failed to update'); return }
      setTransactions(prev => prev.map(t => t.id === editing.id ? updated : t))
      toast.success('Transaction updated')
    } else {
      const { data: created, error } = await supabase
        .from('transactions').insert({ ...data, user_id: user.id }).select().single()
      if (error) { toast.error('Failed to add transaction'); return }
      setTransactions(prev => [created, ...prev])
      toast.success('Transaction added')
    }
    setModalOpen(false)
    setEditing(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) { toast.error('Failed to delete'); return }
    setTransactions(prev => prev.filter(t => t.id !== id))
    toast.success('Deleted')
  }

  const allCategories = [...new Set(transactions.map(t => t.category))].sort()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            This month: <span className="text-gain num">+₹{formatCompact(summary.income)}</span>
            {' · '}
            <span className="text-loss num">-₹{formatCompact(summary.expenses)}</span>
            {' · '}
            <span className={`num font-medium ${summary.income - summary.expenses >= 0 ? 'text-gain' : 'text-loss'}`}>
              = ₹{formatCompact(summary.income - summary.expenses)}
            </span>
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 animate-fade-in-1">
        {(['all', 'income', 'expense'] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilterType(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize
              ${filterType === f
                ? f === 'income' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : f === 'expense' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))]'
                : 'border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              }`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="input-field text-xs py-1.5 h-auto"
        >
          <option value="">All categories</option>
          {allCategories.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden animate-fade-in-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-[hsl(var(--muted-foreground))]">
            <p className="text-sm">No transactions found</p>
          </div>
        ) : (
          <div className="divide-y divide-[hsl(var(--border))]">
            {/* Group by month */}
            {groupByMonth(filtered).map(({ month, items }) => (
              <div key={month}>
                <div className="px-5 py-2 bg-[hsl(var(--accent))/30] border-b border-[hsl(var(--border))]">
                  <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{month}</span>
                </div>
                {items.map(tx => (
                  <TxRow key={tx.id} tx={tx} onEdit={() => { setEditing(tx); setModalOpen(true) }} onDelete={() => handleDelete(tx.id)} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <TransactionModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={handleSave}
        transaction={editing}
      />
    </div>
  )
}

function TxRow({ tx, onEdit, onDelete }: { tx: Transaction; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-[hsl(var(--accent))] transition-colors group">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold
        ${tx.type === 'income' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
        {tx.category.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[hsl(var(--foreground))] truncate">{tx.description || tx.category}</p>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          {tx.category}{tx.sub_category ? ` · ${tx.sub_category}` : ''}{' · '}{format(parseISO(tx.date), 'dd MMM')}
          {tx.is_recurring && <span className="ml-2 text-emerald-400/70">↻ recurring</span>}
        </p>
      </div>
      <span className={`text-sm font-semibold num ${tx.type === 'income' ? 'text-gain' : 'text-loss'}`}>
        {tx.type === 'income' ? '+' : '-'}₹{formatCompact(tx.amount)}
      </span>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-1.5 rounded hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded hover:bg-red-500/10 text-[hsl(var(--muted-foreground))] hover:text-red-400 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

function groupByMonth(txs: Transaction[]) {
  const map = new Map<string, Transaction[]>()
  txs.forEach(t => {
    const m = format(parseISO(t.date), 'MMMM yyyy')
    if (!map.has(m)) map.set(m, [])
    map.get(m)!.push(t)
  })
  return Array.from(map.entries()).map(([month, items]) => ({ month, items }))
}
