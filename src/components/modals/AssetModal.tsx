'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import type { Asset, AssetFormData, AssetType, AssetCategory } from '@/types'
import { ASSET_TYPE_LABELS } from '@/types'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().min(1),
  category: z.string().min(1),
  current_value: z.coerce.number().min(0, 'Value must be positive'),
  purchase_price: z.coerce.number().optional(),
  quantity: z.coerce.number().optional(),
  ticker_symbol: z.string().optional(),
  currency: z.string().default('INR'),
  institution: z.string().optional(),
  notes: z.string().optional(),
})

const CATEGORY_TO_TYPES: Record<string, AssetType[]> = {
  bank:        ['savings', 'fd', 'rd'],
  equity:      ['stocks', 'mf_equity', 'etf', 'us_stocks', 'sgb'],
  debt:        ['mf_debt', 'ppf', 'epf', 'nps', 'bonds'],
  real_estate: ['property', 'reit'],
  others:      ['gold', 'crypto', 'vehicle', 'other'],
}

export default function AssetModal({ open, onClose, onSave, asset }: {
  open: boolean
  onClose: () => void
  onSave: (data: AssetFormData) => Promise<void>
  asset: Asset | null
}) {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { currency: 'INR', category: 'equity', type: 'stocks' },
  })

  const category = watch('category')
  const type = watch('type')

  // When category changes, default the type
  useEffect(() => {
    const types = CATEGORY_TO_TYPES[category] || []
    if (types.length && !types.includes(type as AssetType)) {
      setValue('type', types[0])
    }
  }, [category])

  useEffect(() => {
    if (asset) {
      reset({
        name: asset.name, type: asset.type, category: asset.category,
        current_value: asset.current_value, purchase_price: asset.purchase_price ?? undefined,
        quantity: asset.quantity ?? undefined, ticker_symbol: asset.ticker_symbol ?? '',
        currency: asset.currency, institution: asset.institution ?? '', notes: asset.notes ?? '',
      })
    } else {
      reset({ currency: 'INR', category: 'equity', type: 'stocks' })
    }
  }, [asset, open])

  if (!open) return null

  const availableTypes = CATEGORY_TO_TYPES[category] || []
  const needsQuantity = ['stocks', 'mf_equity', 'etf', 'us_stocks', 'sgb', 'gold', 'crypto'].includes(type)
  const needsTicker = ['stocks', 'us_stocks', 'etf', 'sgb'].includes(type)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
          <h2 className="text-base font-semibold">{asset ? 'Edit Asset' : 'Add Asset'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSave as any)} className="px-6 py-5 space-y-4">
          {/* Category + Type */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Category" error={errors.category?.message}>
              <select {...register('category')} className="input-field">
                <option value="bank">Bank & Cash</option>
                <option value="equity">Equity</option>
                <option value="debt">Debt</option>
                <option value="real_estate">Real Estate</option>
                <option value="others">Others</option>
              </select>
            </FormField>
            <FormField label="Asset Type" error={errors.type?.message}>
              <select {...register('type')} className="input-field">
                {availableTypes.map(t => (
                  <option key={t} value={t}>{ASSET_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </FormField>
          </div>

          {/* Name */}
          <FormField label="Name" error={errors.name?.message}>
            <input {...register('name')} placeholder="e.g. HDFC Savings, NIFTY50 ETF…" className="input-field" />
          </FormField>

          {/* Value + Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <FormField label="Current Value (₹)" error={errors.current_value?.message}>
                <input {...register('current_value')} type="number" step="0.01" placeholder="0" className="input-field" />
              </FormField>
            </div>
            <FormField label="Currency" error={undefined}>
              <select {...register('currency')} className="input-field">
                {['INR','USD','EUR','GBP','SGD','AED'].map(c => <option key={c}>{c}</option>)}
              </select>
            </FormField>
          </div>

          {/* Purchase price */}
          <FormField label="Purchase / Invested Amount (₹)" error={errors.purchase_price?.message}>
            <input {...register('purchase_price')} type="number" step="0.01" placeholder="Optional — for P&L tracking" className="input-field" />
          </FormField>

          {/* Quantity + Ticker */}
          {needsQuantity && (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Quantity / Units" error={errors.quantity?.message}>
                <input {...register('quantity')} type="number" step="0.000001" placeholder="0" className="input-field" />
              </FormField>
              {needsTicker && (
                <FormField label="Ticker Symbol" error={errors.ticker_symbol?.message}>
                  <input {...register('ticker_symbol')} placeholder="e.g. RELIANCE, AAPL" className="input-field" />
                </FormField>
              )}
            </div>
          )}

          {/* Institution + Notes */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Institution / Platform" error={undefined}>
              <input {...register('institution')} placeholder="e.g. HDFC, Zerodha" className="input-field" />
            </FormField>
            <FormField label="Notes" error={undefined}>
              <input {...register('notes')} placeholder="Optional" className="input-field" />
            </FormField>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-[hsl(var(--border))] text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--border))] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium transition-colors disabled:opacity-60">
              {isSubmitting ? 'Saving…' : asset ? 'Update' : 'Add Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}
