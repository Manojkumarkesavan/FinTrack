'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, Target } from 'lucide-react'
import type { FinancialGoal, GoalFormData } from '@/types'
import { formatCompact, GOAL_CATEGORY_LABELS } from '@/types'
import GoalCard from '@/components/dashboard/GoalCard'
import GoalModal from '@/components/modals/GoalModal'

export default function GoalsClient({ initialGoals, userId }: { initialGoals: FinancialGoal[]; userId: string }) {
  const [goals, setGoals] = useState<FinancialGoal[]>(initialGoals)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<FinancialGoal | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const supabase = createClient()

  const totalTarget = goals.filter(g => g.status === 'active').reduce((s, g) => s + g.target_amount, 0)
  const totalProgress = goals.filter(g => g.status === 'active').reduce((s, g) => s + g.current_amount, 0)
  const activeGoals = goals.filter(g => g.status === 'active').length
  const completedGoals = goals.filter(g => g.status === 'completed').length

  const handleSave = async (data: GoalFormData) => {
    if (editing) {
      const { data: updated, error } = await supabase
        .from('financial_goals')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', editing.id)
        .select()
        .single()

      if (error) {
        toast.error('Failed to update goal')
        return
      }

      setGoals(prev => prev.map(g => (g.id === editing.id ? updated : g)))
      toast.success('Goal updated')
    } else {
      const { data: created, error } = await supabase
        .from('financial_goals')
        .insert({ ...data, user_id: userId, current_amount: 0, status: 'active' })
        .select()
        .single()

      if (error) {
        toast.error('Failed to create goal')
        return
      }

      setGoals(prev => [...prev, created])
      toast.success('Goal created')
    }

    setModalOpen(false)
    setEditing(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this goal? This cannot be undone.')) return

    setDeleting(id)
    const { error } = await supabase.from('financial_goals').delete().eq('id', id)

    if (error) {
      toast.error('Failed to delete goal')
      setDeleting(null)
      return
    }

    setGoals(prev => prev.filter(g => g.id !== id))
    toast.success('Goal deleted')
    setDeleting(null)
  }

  const handleUpdateProgress = async (goalId: string, newAmount: number) => {
    const { error } = await supabase
      .from('financial_goals')
      .update({ current_amount: newAmount, updated_at: new Date().toISOString() })
      .eq('id', goalId)

    if (error) {
      toast.error('Failed to update progress')
      return
    }

    setGoals(prev =>
      prev.map(g => (g.id === goalId ? { ...g, current_amount: newAmount } : g))
    )
    toast.success('Progress updated')
  }

  const handleStatusChange = async (goalId: string, newStatus: string) => {
    const { error } = await supabase
      .from('financial_goals')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', goalId)

    if (error) {
      toast.error('Failed to update status')
      return
    }

    setGoals(prev =>
      prev.map(g => (g.id === goalId ? { ...g, status: newStatus as any } : g))
    )
    toast.success('Status updated')
  }

  const grouped = {
    active: goals.filter(g => g.status === 'active'),
    completed: goals.filter(g => g.status === 'completed'),
    paused: goals.filter(g => g.status === 'paused'),
    abandoned: goals.filter(g => g.status === 'abandoned'),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Goals</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            {activeGoals} active · {completedGoals} completed
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
          className="flex items-center justify-center sm:justify-start gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium transition-colors w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" /> Add Goal
        </button>
      </div>

      {/* Summary cards */}
      {goals.length > 0 && activeGoals > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in-1">
          <SummaryCard label="Active Goals" value={String(activeGoals)} />
          <SummaryCard label="Progress" value={`₹${formatCompact(totalProgress)}`} />
          <SummaryCard label="Target" value={`₹${formatCompact(totalTarget)}`} />
          <SummaryCard
            label="Achieved"
            value={`${totalTarget > 0 ? ((totalProgress / totalTarget) * 100).toFixed(1) : 0}%`}
          />
        </div>
      )}

      {/* Goals list */}
      {goals.length === 0 ? (
        <EmptyState onAdd={() => setModalOpen(true)} />
      ) : (
        <div className="space-y-6 animate-fade-in-2">
          {/* Active Goals */}
          {grouped.active.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">Active Goals</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {grouped.active.map(goal => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={() => {
                      setEditing(goal)
                      setModalOpen(true)
                    }}
                    onDelete={() => handleDelete(goal.id)}
                    onUpdateProgress={(amount) => handleUpdateProgress(goal.id, amount)}
                    onStatusChange={(status) => handleStatusChange(goal.id, status)}
                    deleting={deleting === goal.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Goals */}
          {grouped.completed.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">Completed</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {grouped.completed.map(goal => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={() => {
                      setEditing(goal)
                      setModalOpen(true)
                    }}
                    onDelete={() => handleDelete(goal.id)}
                    onUpdateProgress={(amount) => handleUpdateProgress(goal.id, amount)}
                    onStatusChange={(status) => handleStatusChange(goal.id, status)}
                    deleting={deleting === goal.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Paused Goals */}
          {grouped.paused.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">Paused</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {grouped.paused.map(goal => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={() => {
                      setEditing(goal)
                      setModalOpen(true)
                    }}
                    onDelete={() => handleDelete(goal.id)}
                    onUpdateProgress={(amount) => handleUpdateProgress(goal.id, amount)}
                    onStatusChange={(status) => handleStatusChange(goal.id, status)}
                    deleting={deleting === goal.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Abandoned Goals */}
          {grouped.abandoned.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">Abandoned</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {grouped.abandoned.map(goal => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={() => {
                      setEditing(goal)
                      setModalOpen(true)
                    }}
                    onDelete={() => handleDelete(goal.id)}
                    onUpdateProgress={(amount) => handleUpdateProgress(goal.id, amount)}
                    onStatusChange={(status) => handleStatusChange(goal.id, status)}
                    deleting={deleting === goal.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <GoalModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onSave={handleSave}
        goal={editing}
      />
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">{label}</p>
      <p className="text-lg font-semibold num text-[hsl(var(--foreground))]">{value}</p>
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="card flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <Target className="w-10 h-10 text-[hsl(var(--muted-foreground))] mb-3" />
      <p className="text-sm font-medium text-[hsl(var(--foreground))]">No goals yet</p>
      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 mb-4 max-w-xs">
        Define your financial goals and track progress towards them. From retirement to home purchase.
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium transition-colors"
      >
        <Plus className="w-4 h-4" /> Create Goal
      </button>
    </div>
  )
}
