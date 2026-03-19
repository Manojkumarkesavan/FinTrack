'use client'
import { useState } from 'react'
import { Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { NetworthSummary } from '@/types'

export default function AddSnapshotButton({ summary }: { summary: NetworthSummary }) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSnapshot = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date().toISOString().split('T')[0]
      const { error } = await supabase.from('networth_snapshots').upsert({
        user_id: user.id,
        snapshot_date: today,
        total_assets: summary.total_assets,
        total_liabilities: summary.total_liabilities,
        net_worth: summary.net_worth,
        breakdown: {
          equity: summary.equity_value,
          debt: summary.debt_value,
          real_estate: summary.real_estate_value,
          others: summary.others_value,
        },
      }, { onConflict: 'user_id,snapshot_date' })

      if (error) throw error
      toast.success('Snapshot saved for today!')
    } catch {
      toast.error('Failed to save snapshot')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSnapshot}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all disabled:opacity-50"
    >
      <Camera className="w-3.5 h-3.5" />
      {loading ? 'Saving...' : 'Save snapshot'}
    </button>
  )
}
