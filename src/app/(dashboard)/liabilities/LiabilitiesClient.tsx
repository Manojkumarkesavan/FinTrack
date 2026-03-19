'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, CreditCard } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import type { Liability, LiabilityFormData } from '@/types'
import { LIABILITY_TYPE_LABELS, formatCompact } from '@/types'
import { format, differenceInMonths, parseISO, addMonths } from 'date-fns'

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  type: z.string().min(1),
  principal_amount: z.coerce.number().min(0),
  outstanding_amount: z.coerce.number().min(0),
  interest_rate: z.coerce.number().optional(),
  emi_amount: z.coerce.number().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  institution: z.string().optional(),
})

export default function LiabilitiesClient({ initialLiabilities }: { initialLiabilities: Liability[] }) {
  const [liabilities, setLiabilities] = useState(initialLiabilities)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Liability | null>(null)
  const supabase = createClient()

  const totalOutstanding = liabilities.reduce((s, l) => s + l.outstanding_amount, 0)
  const totalEMI = liabilities.reduce((s, l) => s + (l.emi_amount ?? 0), 0)

  const handleSave = async (data: LiabilityFormData) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editing) {
      const { data: updated, error } = await supabase
        .from('liabilities').update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', editing.id).select().single()
      if (error) { toast.error('Failed to update'); return }
      setLiabilities(prev => prev.map(l => l.id === editing.id ? updated : l))
      toast.success('Liability updated')
    } else {
      const { data: created, error } = await supabase
        .from('liabilities').insert({ ...data, user_id: user.id }).select().single()
      if (error) { toast.error('Failed to add liability'); return }
      setLiabilities(prev => [...prev, created])
      toast.success('Liability added')
    }
    setModalOpen(false)
    setEditing(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this liability?')) return
    const { error } = await supabase.from('liabilities').delete().eq('id', id)
    if (error) { toast.error('Failed to delete'); return }
    setLiabilities(prev => prev.filter(l => l.id !== id))
    toast.success('Removed')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Liabilities</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Outstanding: <span className="text-loss num font-semibold">₹{formatCompact(totalOutstanding)}</span>
            {totalEMI > 0 && <> · EMI: <span className="text-amber-400 num font-semibold">₹{formatCompact(totalEMI)}/mo</span></>}
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Liability
        </button>
      </div>

      {liabilities.length === 0 ? (
        <div className="card flex flex-col items-center py-14 text-center animate-fade-in">
          <CreditCard className="w-10 h-10 text-[hsl(var(--muted-foreground))] mb-3" />
          <p className="text-sm font-medium">No liabilities added</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 mb-4">Track loans, EMIs, and credit card balances</p>
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Add Liability
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-1">
          {liabilities.map(l => {
            const paidOff = l.principal_amount > 0 ? ((l.principal_amount - l.outstanding_amount) / l.principal_amount) * 100 : 0
            const monthsLeft = l.end_date
              ? Math.max(0, differenceInMonths(parseISO(l.end_date), new Date()))
              : null

            return (
              <div key={l.id} className="card p-5 hover:border-[hsl(var(--border))] transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold">{l.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                      {LIABILITY_TYPE_LABELS[l.type as keyof typeof LIABILITY_TYPE_LABELS]}
                      {l.institution && ` · ${l.institution}`}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditing(l); setModalOpen(true) }} className="p-1.5 rounded hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(l.id)} className="p-1.5 rounded hover:bg-red-500/10 text-[hsl(var(--muted-foreground))] hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-[hsl(var(--muted-foreground))]">Outstanding</span>
                    <span className="text-loss font-semibold num">₹{formatCompact(l.outstanding_amount)}</span>
                  </div>
                  {l.emi_amount && (
                    <div className="flex justify-between text-xs">
                      <span className="text-[hsl(var(--muted-foreground))]">EMI / month</span>
                      <span className="num">₹{formatCompact(l.emi_amount)}</span>
                    </div>
                  )}
                  {l.interest_rate && (
                    <div className="flex justify-between text-xs">
                      <span className="text-[hsl(var(--muted-foreground))]">Interest rate</span>
                      <span className="num">{l.interest_rate}% p.a.</span>
                    </div>
                  )}
                  {monthsLeft !== null && (
                    <div className="flex justify-between text-xs">
                      <span className="text-[hsl(var(--muted-foreground))]">Closes in</span>
                      <span className="num">{monthsLeft} months</span>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                {l.principal_amount > 0 && (
                  <div>
                    <div className="flex justify-between text-[10px] text-[hsl(var(--muted-foreground))] mb-1">
                      <span>{paidOff.toFixed(0)}% paid off</span>
                      <span>₹{formatCompact(l.principal_amount - l.outstanding_amount)} cleared</span>
                    </div>
                    <div className="h-1.5 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${paidOff}%` }} />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {modalOpen && (
        <LiabilityModal
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSave={handleSave}
          liability={editing}
        />
      )}
    </div>
  )
}

function LiabilityModal({ onClose, onSave, liability }: {
  onClose: () => void
  onSave: (d: LiabilityFormData) => Promise<void>
  liability: Liability | null
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: liability ? {
      name: liability.name, type: liability.type,
      principal_amount: liability.principal_amount, outstanding_amount: liability.outstanding_amount,
      interest_rate: liability.interest_rate ?? undefined, emi_amount: liability.emi_amount ?? undefined,
      start_date: liability.start_date ?? '', end_date: liability.end_date ?? '',
      institution: liability.institution ?? '',
    } : { type: 'home_loan' },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="card w-full max-w-md shadow-2xl animate-fade-in overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
          <h2 className="text-base font-semibold">{liability ? 'Edit Liability' : 'Add Liability'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSave as any)} className="px-6 py-5 space-y-4">
          <Field label="Name" error={errors.name?.message}>
            <input {...register('name')} placeholder="e.g. HDFC Home Loan" className="input-field" />
          </Field>
          <Field label="Type" error={errors.type?.message}>
            <select {...register('type')} className="input-field">
              {Object.entries(LIABILITY_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Principal Amount (₹)" error={errors.principal_amount?.message}>
              <input {...register('principal_amount')} type="number" placeholder="0" className="input-field" />
            </Field>
            <Field label="Outstanding (₹)" error={errors.outstanding_amount?.message}>
              <input {...register('outstanding_amount')} type="number" placeholder="0" className="input-field" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Interest Rate (% p.a.)" error={undefined}>
              <input {...register('interest_rate')} type="number" step="0.01" placeholder="8.5" className="input-field" />
            </Field>
            <Field label="EMI Amount (₹/mo)" error={undefined}>
              <input {...register('emi_amount')} type="number" placeholder="0" className="input-field" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Date" error={undefined}>
              <input {...register('start_date')} type="date" className="input-field" />
            </Field>
            <Field label="End Date" error={undefined}>
              <input {...register('end_date')} type="date" className="input-field" />
            </Field>
          </div>
          <Field label="Institution" error={undefined}>
            <input {...register('institution')} placeholder="e.g. HDFC Bank" className="input-field" />
          </Field>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-[hsl(var(--border))] text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium transition-colors disabled:opacity-60">
              {isSubmitting ? 'Saving…' : liability ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}
