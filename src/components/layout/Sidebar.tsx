'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Wallet, CreditCard, ArrowLeftRight,
  TrendingUp, Target, Lightbulb, Settings, LogOut,
  ChevronLeft, ChevronRight, TrendingDown
} from 'lucide-react'
import type { Profile } from '@/types'
import type { User } from '@supabase/supabase-js'

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/assets', icon: Wallet, label: 'Assets' },
  { href: '/liabilities', icon: CreditCard, label: 'Liabilities' },
  { href: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { href: '/investments', icon: TrendingUp, label: 'Investments' },
  { href: '/goals', icon: Target, label: 'Goals', soon: true },
  { href: '/insights', icon: Lightbulb, label: 'Insights' },
]

export default function Sidebar({ profile, user }: { profile: Profile | null; user: User }) {
  const [collapsed, setCollapsed] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/')
  }

  const initials = (profile?.full_name || user.email || 'U')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <aside className={`
      relative flex flex-col h-full transition-all duration-300 ease-in-out
      bg-[hsl(var(--card))] border-r border-[hsl(var(--border))]
      ${collapsed ? 'w-16' : 'w-56'}
    `}>
      {/* Logo */}
      <div className={`flex items-center h-16 px-4 border-b border-[hsl(var(--border))] ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
        <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
          <TrendingDown className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <span className="font-semibold text-[hsl(var(--foreground))] tracking-tight text-sm">
            FinTrack
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label, soon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={soon ? '#' : href}
              title={collapsed ? label : undefined}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                ${active
                  ? 'bg-emerald-500/15 text-emerald-400 font-medium'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
                }
                ${soon ? 'opacity-50 cursor-default' : ''}
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && (
                <span className="flex-1">{label}</span>
              )}
              {!collapsed && soon && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                  Soon
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 border-t border-[hsl(var(--border))] space-y-0.5">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!collapsed && 'Settings'}
        </Link>

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[hsl(var(--muted-foreground))] hover:text-red-400 hover:bg-red-500/10 transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && (signingOut ? 'Signing out...' : 'Sign out')}
        </button>

        {!collapsed && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 mt-1 rounded-lg bg-[hsl(var(--accent))]">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[hsl(var(--foreground))] truncate">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] truncate">{user.email}</p>
            </div>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-emerald-500/50 transition-colors z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  )
}
