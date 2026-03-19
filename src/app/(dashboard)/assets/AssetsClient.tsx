'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, TrendingUp, RefreshCw } from 'lucide-react'
import type { Asset, AssetCategory, AssetFormData } from '@/types'
import { ASSET_TYPE_LABELS, CATEGORY_COLORS, formatCompact } from '@/types'
import AssetModal from '@/components/modals/AssetModal'

const CATEGORY_LABELS: Record<AssetCategory, string> = {
  equity: 'Equity', debt: 'Debt', real_estate: 'Real Estate',
  bank: 'Bank & Cash', others: 'Others'
}

export default function AssetsClient({ initialAssets }: { initialAssets: Asset[] }) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Asset | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const supabase = createClient()

  const totalValue = assets.reduce((s, a) => s + a.current_value, 0)

  const grouped = assets.reduce<Record<AssetCategory, Asset[]>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = []
    acc[a.category].push(a)
    return acc
  }, {} as any)

  const handleSave = async (data: AssetFormData) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editing) {
      const { data: updated, error } = await supabase
        .from('assets').update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', editing.id).select().single()
      if (error) { toast.error('Failed to update asset'); return }
      setAssets(prev => prev.map(a => a.id === editing.id ? updated : a))
      toast.success('Asset updated')
    } else {
      const { data: created, error } = await supabase
        .from('assets').insert({ ...data, user_id: user.id }).select().single()
      if (error) { toast.error('Failed to add asset'); return }
      setAssets(prev => [...prev, created])
      toast.success('Asset added')
    }
    setModalOpen(false)
    setEditing(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this asset?')) return
    setDeleting(id)
    const { error } = await supabase.from('assets').delete().eq('id', id)
    if (error) { toast.error('Failed to delete'); setDeleting(null); return }
    setAssets(prev => prev.filter(a => a.id !== id))
    toast.success('Asset removed')
    setDeleting(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Assets</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Total: <span className="text-emerald-400 font-semibold num">₹{formatCompact(totalValue)}</span>
            &nbsp;·&nbsp; {assets.length} assets
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Asset
        </button>
      </div>

      {/* Asset groups */}
      {assets.length === 0 ? (
        <EmptyState onAdd={() => setModalOpen(true)} />
      ) : (
        <div className="space-y-4 animate-fade-in-1">
          {(Object.keys(CATEGORY_LABELS) as AssetCategory[]).map(category => {
            const items = grouped[category]
            if (!items?.length) return null
            const catTotal = items.reduce((s, a) => s + a.current_value, 0)
            return (
              <div key={category} className="card overflow-hidden">
                {/* Category header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--accent))/50]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS[category] }} />
                    <span className="text-sm font-medium">{CATEGORY_LABELS[category]}</span>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">({items.length})</span>
                  </div>
                  <span className="text-sm font-semibold num text-[hsl(var(--foreground))]">
                    ₹{formatCompact(catTotal)}
                  </span>
                </div>

                {/* Assets table */}
                <div className="divide-y divide-[hsl(var(--border))]">
                  {items.map(asset => (
                    <div key={asset.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[hsl(var(--accent))] transition-colors group">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">{asset.name}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                          {ASSET_TYPE_LABELS[asset.type]}
                          {asset.institution && ` · ${asset.institution}`}
                        </p>
                      </div>

                      {asset.quantity && (
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">Qty</p>
                          <p className="text-sm num">{asset.quantity.toLocaleString('en-IN')}</p>
                        </div>
                      )}

                      {asset.purchase_price && (
                        <div className="text-right hidden md:block">
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">Invested</p>
                          <p className="text-sm num">₹{formatCompact(asset.purchase_price)}</p>
                        </div>
                      )}

                      {asset.purchase_price && asset.purchase_price > 0 && (
                        <div className="text-right hidden md:block">
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">P&L</p>
                          <PnL current={asset.current_value} cost={asset.purchase_price} />
                        </div>
                      )}

                      <div className="text-right">
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">Value</p>
                        <p className="text-sm font-semibold num text-[hsl(var(--foreground))]">
                          ₹{formatCompact(asset.current_value)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditing(asset); setModalOpen(true) }}
                          className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id)}
                          disabled={deleting === asset.id}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-[hsl(var(--muted-foreground))] hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AssetModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={handleSave}
        asset={editing}
      />
    </div>
  )
}

function PnL({ current, cost }: { current: number; cost: number }) {
  const pnl = current - cost
  const pct = cost > 0 ? (pnl / cost) * 100 : 0
  const isPos = pnl >= 0
  return (
    <p className={`text-sm num ${isPos ? 'text-gain' : 'text-loss'}`}>
      {isPos ? '+' : ''}₹{formatCompact(pnl)} ({pct.toFixed(1)}%)
    </p>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="card flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <TrendingUp className="w-10 h-10 text-[hsl(var(--muted-foreground))] mb-3" />
      <p className="text-sm font-medium text-[hsl(var(--foreground))]">No assets yet</p>
      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 mb-4">
        Add your savings, investments, real estate, and more
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium transition-colors"
      >
        <Plus className="w-4 h-4" /> Add your first asset
      </button>
    </div>
  )
}
