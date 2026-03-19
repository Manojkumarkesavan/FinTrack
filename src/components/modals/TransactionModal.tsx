'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import type { Transaction, TransactionFormData } from '@/types'
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/types'
import { format } from 'date-fns'

const schema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive('Amount must be positive'),
  category: z.string().min(1, 'Select a category'),
  sub_category: z.string().optional(),
  description: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  is_recurring: z.boolean().default(false),
  recurring_frequency: z.string().optional(),
  currency: z.string().default('INR'),
})

export default function TransactionModal({ open, onClose, onSave, transaction }: {
  open: boolean
  onClose: () => void
  onSave: (data: TransactionFormData) => Promise<void>
  transaction: Transaction | null
}) {
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'expense' as const, date: format(new Date(), 'yyyy-MM-dd'), is_recurring: false, currency: 'INR' },
  })

  const type = watch('type')
  const isRecurring = watch('is_recurring')

  useEffect(() => {
    if (transaction) {
      reset({
        type: transaction.type, amount: transaction.amount, category: transaction.category,
        sub_category: transaction.sub_category ?? '', description: transaction.description ?? '',
        date: transaction.date, is_recurring: transaction.is_recurring,
        recurring_frequency: transaction.recurring_frequency ?? '', currency: transaction.currency,
      })
    } else {
      reset({ type: 'expense', date: format(new Date(), 'yyyy-MM-dd'), is_recurring: false, currency: 'INR' })
    }
  }, [transaction, open])

  if (!open) return null

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card w-full max-w-md shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
          <h2 className="text-base font-semibold">{transaction ? 'Edit Transaction' : 'Add Transaction'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSave as any)} className="px-6 py-5 space-y-4">
          {/* Type toggle */}
          <div className="flex rounded-lg overflow-hidden border border-[hsl(var(--border))]">
            {['income', 'expense'].map(t => (
              <label key={t} className="flex-1 cursor-pointer">
                <input type="radio" value={t} {...register('type')} className="sr-only" />
                <div className={`py-2.5 text-center text-sm font-medium transition-colors capitalize
                  ${type === t
                    ? t === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                  }`}>
                  {t === 'income' ? '+ Income' : '− Expense'}
                </div>
              </label>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className="label">Amount (₹)</label>
            <input {...register('amount')} type="number" step="0.01" placeholder="0.00" className="input-field text-lg font-semibold num" />
            {(errors as any).amount && <p className="text-xs text-red-400 mt-1">{(errors as any).amount.message}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="label">Category</label>
            <select {...register('category')} className="input-field">
              <option value="">Select category…</option>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
            {(errors as any).category && <p className="text-xs text-red-400 mt-1">{(errors as any).category.message}</p>}
          </div>

          {/* Description + Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label text-xs sm:text-sm">Description</label>
              <input {...register('description')} placeholder="Optional note" className="input-field text-sm" />
            </div>
            <div>
              <label className="label text-xs sm:text-sm">Date</label>
              <input {...register('date')} type="date" className="input-field text-sm" />
            </div>
          </div>

          {/* Recurring */}
          <div className="flex items-center gap-3">
            <input type="checkbox" id="recurring" {...register('is_recurring')} className="w-4 h-4 accent-emerald-500" />
            <label htmlFor="recurring" className="text-sm text-[hsl(var(--muted-foreground))] cursor-pointer">Recurring transaction</label>
          </div>
          {isRecurring && (
            <select {...register('recurring_frequency')} className="input-field">
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="yearly">Yearly</option>
            </select>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-[hsl(var(--border))] text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium transition-colors disabled:opacity-60">
              {isSubmitting ? 'Saving…' : transaction ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
