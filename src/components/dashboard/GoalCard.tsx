'use client'

import { useState } from 'react'
import { Edit2, Trash2, Pause, Play, CheckCircle2, AlertCircle } from 'lucide-react'
import type { FinancialGoal } from '@/types'
import { formatCompact, GOAL_CATEGORY_LABELS, GOAL_CATEGORY_ICONS, GOAL_STATUS_LABELS } from '@/types'

interface GoalCardProps {
  goal: FinancialGoal
  onEdit: () => void
  onDelete: () => void
  onUpdateProgress: (amount: number) => void
  onStatusChange: (status: string) => void
  deleting: boolean
}

export default function GoalCard({
  goal,
  onEdit,
  onDelete,
  onUpdateProgress,
  onStatusChange,
  deleting,
}: GoalCardProps) {
  const [editingProgress, setEditingProgress] = useState(false)
  const [newAmount, setNewAmount] = useState(goal.current_amount.toString())

  const progressPercent = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
  const daysRemaining = Math.ceil(
    (new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )
  const isOverdue = daysRemaining < 0
  const isCompleted = goal.status === 'completed'
  const isPaused = goal.status === 'paused'

  const handleProgressSave = () => {
    const amount = parseFloat(newAmount)
    if (!isNaN(amount) && amount >= 0 && amount <= goal.target_amount) {
      onUpdateProgress(amount)
      setEditingProgress(false)
    }
  }

  const categoryIcon = GOAL_CATEGORY_ICONS[goal.category]
  const categoryLabel = GOAL_CATEGORY_LABELS[goal.category]
  const statusLabel = GOAL_STATUS_LABELS[goal.status]

  const priorityColor =
    goal.priority === 'high' ? 'bg-red-500/10 text-red-600' :
    goal.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-600' :
    'bg-blue-500/10 text-blue-600'

  return (
    <div className={`card p-5 relative transition-all ${isCompleted ? 'opacity-75' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{categoryIcon}</span>
            <h3 className="font-semibold text-[hsl(var(--foreground))]">{goal.name}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))]">
              {categoryLabel}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${priorityColor}`}>
              {goal.priority.charAt(0).toUpperCase() + goal.priority.slice(1)} Priority
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600">
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
            title="Edit goal"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onStatusChange(isPaused ? 'active' : 'paused')}
            className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
            title={isPaused ? 'Resume goal' : 'Pause goal'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-[hsl(var(--muted-foreground))] hover:text-red-400 transition-colors disabled:opacity-50"
            title="Delete goal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Description */}
      {goal.description && (
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4 line-clamp-2">{goal.description}</p>
      )}

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[hsl(var(--muted-foreground))]">Progress</span>
          <span className="text-xs font-medium text-[hsl(var(--foreground))]">{progressPercent.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-[hsl(var(--accent))] rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Amount Section */}
      <div className="grid grid-cols-3 gap-3 mb-4 text-center">
        <div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Current</p>
          <div className="flex items-center gap-1">
            {editingProgress ? (
              <input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="w-full px-2 py-1 text-xs rounded bg-[hsl(var(--input))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))]"
                min="0"
                max={goal.target_amount}
              />
            ) : (
              <button
                onClick={() => setEditingProgress(true)}
                className="text-sm font-semibold num text-emerald-400 hover:text-emerald-300"
              >
                ₹{formatCompact(goal.current_amount)}
              </button>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Remaining</p>
          <p className="text-sm font-semibold num text-[hsl(var(--foreground))]">
            ₹{formatCompact(Math.max(0, goal.target_amount - goal.current_amount))}
          </p>
        </div>

        <div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Target</p>
          <p className="text-sm font-semibold num text-[hsl(var(--foreground))]">
            ₹{formatCompact(goal.target_amount)}
          </p>
        </div>
      </div>

      {/* Save button for edit mode */}
      {editingProgress && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleProgressSave}
            className="flex-1 px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-medium transition-colors"
          >
            Save
          </button>
          <button
            onClick={() => {
              setEditingProgress(false)
              setNewAmount(goal.current_amount.toString())
            }}
            className="flex-1 px-3 py-1.5 rounded bg-[hsl(var(--accent))] hover:bg-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] text-xs font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Timeline */}
      <div className="flex items-center gap-2 pt-3 border-t border-[hsl(var(--border))] text-xs">
        {isOverdue && !isCompleted ? (
          <div className="flex items-center gap-1 text-red-500">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Overdue by {Math.abs(daysRemaining)} days</span>
          </div>
        ) : isCompleted ? (
          <div className="flex items-center gap-1 text-emerald-500">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[hsl(var(--muted-foreground))]">
            <span>{daysRemaining} days remaining</span>
          </div>
        )}
      </div>
    </div>
  )
}
