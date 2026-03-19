'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'
import type { FinancialGoal, GoalFormData, GoalCategory, GoalPriority, Currency } from '@/types'
import { GOAL_CATEGORY_LABELS, GOAL_CATEGORY_ICONS } from '@/types'

interface GoalModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: GoalFormData) => void
  goal?: FinancialGoal | null
}

const GOAL_CATEGORIES: GoalCategory[] = [
  'retirement',
  'education',
  'home',
  'vehicle',
  'investment',
  'debt_payoff',
  'savings',
  'other',
]

const PRIORITIES: GoalPriority[] = ['low', 'medium', 'high']

export default function GoalModal({ open, onClose, onSave, goal }: GoalModalProps) {
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<GoalFormData>({
    defaultValues: {
      name: goal?.name ?? '',
      description: goal?.description ?? undefined,
      category: goal?.category ?? 'retirement',
      target_amount: goal?.target_amount ?? 0,
      currency: goal?.currency ?? 'INR',
      start_date: goal?.start_date ?? new Date().toISOString().split('T')[0],
      target_date: goal?.target_date ?? '',
      priority: goal?.priority ?? 'medium',
      notes: goal?.notes ?? undefined,
    },
  })

  const category = watch('category')
  const targetAmount = watch('target_amount')

  const onSubmit = (data: GoalFormData) => {
    if (data.target_amount <= 0) {
      alert('Target amount must be greater than 0')
      return
    }
    onSave(data)
    reset()
  }

  useEffect(() => {
    if (goal) {
      reset({
        name: goal.name,
        description: goal.description ?? undefined,
        category: goal.category,
        target_amount: goal.target_amount,
        currency: goal.currency,
        start_date: goal.start_date,
        target_date: goal.target_date,
        priority: goal.priority,
        notes: goal.notes ?? undefined,
      })
    } else {
      reset({
        name: '',
        description: undefined,
        category: 'retirement',
        target_amount: 0,
        currency: 'INR',
        start_date: new Date().toISOString().split('T')[0],
        target_date: '',
        priority: 'medium',
        notes: undefined,
      })
    }
  }, [goal, reset, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="card max-w-md w-full max-h-[90vh] overflow-y-auto bg-[hsl(var(--card))]">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-5 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <h2 className="font-semibold text-[hsl(var(--foreground))]">
            {goal ? 'Edit Goal' : 'Create New Goal'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-2">
              Goal Name *
            </label>
            <input
              type="text"
              {...register('name', { required: 'Required' })}
              placeholder="e.g., Retirement Fund"
              className="w-full px-3 py-2 text-sm rounded bg-[hsl(var(--input))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] focus:border-emerald-500 focus:outline-none"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-2">
              Description
            </label>
            <textarea
              {...register('description')}
              placeholder="Add details about this goal..."
              className="w-full px-3 py-2 text-sm rounded bg-[hsl(var(--input))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] focus:border-emerald-500 focus:outline-none resize-none h-20"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-2">
              Category *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {GOAL_CATEGORIES.map(cat => (
                <label
                  key={cat}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer border transition-colors ${
                    category === cat
                      ? 'bg-emerald-500/15 border-emerald-500'
                      : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]'
                  }`}
                >
                  <input
                    type="radio"
                    value={cat}
                    {...register('category')}
                    className="w-3 h-3"
                  />
                  <span className="text-xs">
                    {GOAL_CATEGORY_ICONS[cat]} {GOAL_CATEGORY_LABELS[cat]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Target Amount */}
          <div>
            <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-2">
              Target Amount *
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                {...register('target_amount', { required: 'Required', min: 0 })}
                placeholder="0"
                className="flex-1 px-3 py-2 text-sm rounded bg-[hsl(var(--input))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] focus:border-emerald-500 focus:outline-none"
              />
              <select
                {...register('currency')}
                className="px-3 py-2 text-sm rounded bg-[hsl(var(--input))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] focus:border-emerald-500 focus:outline-none"
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            {errors.target_amount && (
              <p className="text-xs text-red-500 mt-1">{errors.target_amount.message}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-2">
                Start Date *
              </label>
              <input
                type="date"
                {...register('start_date', { required: 'Required' })}
                className="w-full px-3 py-2 text-sm rounded bg-[hsl(var(--input))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] focus:border-emerald-500 focus:outline-none"
              />
              {errors.start_date && (
                <p className="text-xs text-red-500 mt-1">{errors.start_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-2">
                Target Date *
              </label>
              <input
                type="date"
                {...register('target_date', { required: 'Required' })}
                className="w-full px-3 py-2 text-sm rounded bg-[hsl(var(--input))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] focus:border-emerald-500 focus:outline-none"
              />
              {errors.target_date && (
                <p className="text-xs text-red-500 mt-1">{errors.target_date.message}</p>
              )}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-2">
              Priority *
            </label>
            <div className="flex gap-2">
              {PRIORITIES.map(priority => (
                <label
                  key={priority}
                  className={`flex-1 flex items-center justify-center px-3 py-2 rounded border cursor-pointer transition-colors text-xs font-medium ${
                    watch('priority') === priority
                      ? priority === 'high'
                        ? 'bg-red-500/15 border-red-500 text-red-600'
                        : priority === 'medium'
                        ? 'bg-yellow-500/15 border-yellow-500 text-yellow-600'
                        : 'bg-blue-500/15 border-blue-500 text-blue-600'
                      : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]'
                  }`}
                >
                  <input
                    type="radio"
                    value={priority}
                    {...register('priority')}
                    className="w-3 h-3 mr-1"
                  />
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-2">
              Notes
            </label>
            <textarea
              {...register('notes')}
              placeholder="Additional notes..."
              className="w-full px-3 py-2 text-sm rounded bg-[hsl(var(--input))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] focus:border-emerald-500 focus:outline-none resize-none h-16"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 sm:gap-3 pt-4 border-t border-[hsl(var(--border))]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 sm:px-4 py-2 rounded-lg bg-[hsl(var(--accent))] hover:bg-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] text-xs sm:text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-3 sm:px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs sm:text-sm font-medium transition-colors"
            >
              {goal ? 'Update Goal' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
