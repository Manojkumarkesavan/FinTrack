'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { User, Database, Shield, Download, Trash2 } from 'lucide-react'
import type { Profile } from '@/types'
import type { User as SupaUser } from '@supabase/supabase-js'
import Image from 'next/image'

export default function SettingsClient({ profile, user }: { profile: Profile | null; user: SupaUser }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    monthly_income: profile?.monthly_income?.toString() ?? '',
    base_currency: profile?.base_currency ?? 'INR',
  })
  const supabase = createClient()

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name,
      monthly_income: parseFloat(form.monthly_income) || 0,
      base_currency: form.base_currency,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id)
    if (error) toast.error('Failed to save')
    else toast.success('Profile saved')
    setSaving(false)
  }

  const handleExport = async () => {
    const [{ data: assets }, { data: liabilities }, { data: transactions }, { data: investments }] = await Promise.all([
      supabase.from('assets').select('*').eq('user_id', user.id),
      supabase.from('liabilities').select('*').eq('user_id', user.id),
      supabase.from('transactions').select('*').eq('user_id', user.id),
      supabase.from('investments').select('*').eq('user_id', user.id),
    ])
    const blob = new Blob([JSON.stringify({ assets, liabilities, transactions, investments }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fintrack-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    toast.success('Data exported')
  }

  const handleDeleteAll = async () => {
    const confirmed = prompt('Type DELETE to confirm deleting ALL your data. This cannot be undone.')
    if (confirmed !== 'DELETE') return
    await Promise.all([
      supabase.from('assets').delete().eq('user_id', user.id),
      supabase.from('liabilities').delete().eq('user_id', user.id),
      supabase.from('transactions').delete().eq('user_id', user.id),
      supabase.from('investments').delete().eq('user_id', user.id),
      supabase.from('networth_snapshots').delete().eq('user_id', user.id),
      supabase.from('insights_cache').delete().eq('user_id', user.id),
    ])
    toast.success('All data deleted')
    window.location.reload()
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Section icon={User} title="Profile">
        <div className="flex items-center gap-4 mb-5">
          {profile?.avatar_url ? (
            <Image src={profile.avatar_url} width={48} height={48} alt="avatar" className="rounded-full" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-semibold">
              {(form.full_name || user.email || 'U')[0].toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-medium">{user.email}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Google account</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input-field" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="Your name" />
          </div>
          <div>
            <label className="label">Monthly Income (₹)</label>
            <input className="input-field num" type="number" value={form.monthly_income} onChange={e => setForm(p => ({ ...p, monthly_income: e.target.value }))} placeholder="50000" />
          </div>
          <div>
            <label className="label">Base Currency</label>
            <select className="input-field" value={form.base_currency} onChange={e => setForm(p => ({ ...p, base_currency: e.target.value as any }))}>
              {['INR', 'USD', 'EUR', 'GBP', 'SGD', 'AED'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="mt-4 px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving…
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </Section>

      {/* Data Management */}
      <Section icon={Database} title="Data Management">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl bg-[hsl(var(--accent))]">
            <div>
              <p className="text-sm font-medium">Export your data</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">Download all your data as JSON</p>
            </div>
            <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[hsl(var(--border))] text-xs text-[hsl(var(--foreground))] hover:bg-[hsl(var(--background))] transition-colors">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/20">
            <div>
              <p className="text-sm font-medium text-red-400">Delete all data</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">Permanently remove all your financial data</p>
            </div>
            <button onClick={handleDeleteAll} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/30 text-xs text-red-400 hover:bg-red-500/10 transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      </Section>

      {/* Privacy */}
      <Section icon={Shield} title="Privacy & Security">
        <div className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
          <p>· Your data is stored encrypted at rest in Supabase (Postgres)</p>
          <p>· Row-Level Security ensures only you can read your data</p>
          <p>· Google OAuth — we never store your Google password</p>
          <p>· No third-party analytics or ad trackers</p>
          <p>· AI insights are generated using anonymised aggregate numbers — no PII is sent to Claude</p>
        </div>
      </Section>
    </div>
  )
}

function Section({ icon: Icon, title, children }: { icon: typeof User; title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6 animate-fade-in-1">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-7 h-7 rounded-lg bg-[hsl(var(--accent))] flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
        </div>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  )
}
