'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ThemeToggle from './ThemeToggle'
import { Menu, X, LogOut, TrendingDown } from 'lucide-react'
import {
  LayoutDashboard, Wallet, CreditCard, ArrowLeftRight,
  TrendingUp, Target, Lightbulb, Settings
} from 'lucide-react'
import type { Profile } from '@/types'
import type { User } from '@supabase/supabase-js'

const NAV_ITEMS: Array<{ href: string; icon: any; label: string; soon?: boolean }> = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/assets', icon: Wallet, label: 'Assets' },
  { href: '/liabilities', icon: CreditCard, label: 'Liabilities' },
  { href: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { href: '/investments', icon: TrendingUp, label: 'Investments' },
  { href: '/goals', icon: Target, label: 'Goals' },
  { href: '/insights', icon: Lightbulb, label: 'Insights' },
]

export default function MobileNav({ profile, user }: { profile: Profile | null; user: User }) {
  const [open, setOpen] = useState(false)
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

  const handleNavClick = () => {
    setOpen(false)
  }

  return (
    <>
      {/* Mobile Header with Hamburger */}
      <div className="md:hidden sticky top-0 z-40 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))]">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-[hsl(var(--foreground))] text-sm">FinTrack</span>
          </div>

          {/* Theme Toggle + Hamburger */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setOpen(!open)}
              className="p-2 rounded-lg hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] transition-colors"
              aria-label="Toggle menu"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {open && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <nav className="fixed top-14 left-0 right-0 z-30 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] md:hidden">
            <div className="px-4 py-3 space-y-0.5 max-h-[calc(100vh-56px)] overflow-y-auto">
              {NAV_ITEMS.map(({ href, icon: Icon, label, soon }) => {
                const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                return (
                  <Link
                    key={href}
                    href={soon ? '#' : href}
                    onClick={handleNavClick}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                      ${active
                        ? 'bg-emerald-500/15 text-emerald-400 font-medium'
                        : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
                      }
                      ${soon ? 'opacity-50 cursor-default' : ''}
                    `}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1">{label}</span>
                    {soon && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                        Soon
                      </span>
                    )}
                  </Link>
                )
              })}

              {/* Divider */}
              <div className="my-2 border-t border-[hsl(var(--border))]"></div>

              {/* Settings */}
              <Link
                href="/settings"
                onClick={handleNavClick}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Link>

              {/* Sign Out */}
              <button
                onClick={() => {
                  setOpen(false)
                  handleSignOut()
                }}
                disabled={signingOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[hsl(var(--muted-foreground))] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                <span>{signingOut ? 'Signing out...' : 'Sign Out'}</span>
              </button>
            </div>
          </nav>
        </>
      )}
    </>
  )
}
