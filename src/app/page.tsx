'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, ShieldCheck, Zap, BarChart3 } from 'lucide-react'

export default function LandingPage() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleGoogleSignIn = async () => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-[hsl(var(--foreground))] tracking-tight">FinTrack</span>
        </div>
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
        >
          Sign in
        </button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Built for India — tracks Zerodha, Groww, PPF, EPF & more
          </div>

          {/* Headline */}
          <div>
            <h1 className="font-display text-5xl md:text-6xl text-[hsl(var(--foreground))] leading-[1.05] tracking-tight mb-4">
              Your complete<br />
              <span className="text-emerald-400">financial picture.</span>
            </h1>
            <p className="text-lg text-[hsl(var(--muted-foreground))] max-w-lg mx-auto leading-relaxed">
              Assets, liabilities, investments, income and expenses — unified in one beautifully simple dashboard.
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl bg-white text-gray-900 font-medium text-sm hover:bg-gray-100 active:scale-[0.98] transition-all shadow-lg shadow-black/20 disabled:opacity-70"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </button>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Free to use · No credit card required · Your data stays yours
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
            {[
              { icon: BarChart3, label: 'Net worth tracker', sub: 'With trend history' },
              { icon: TrendingUp, label: 'Broker imports', sub: 'Zerodha & Groww CSV' },
              { icon: ShieldCheck, label: 'Financial health', sub: 'Emergency fund, D/I ratio' },
              { icon: Zap, label: 'AI insights', sub: 'Personalised tips' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="card p-4 text-left space-y-2 hover:border-emerald-500/30 transition-colors">
                <Icon className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--foreground))]">{label}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-5 text-xs text-[hsl(var(--muted-foreground))] border-t border-[hsl(var(--border))]">
        Private beta · Data encrypted at rest · Built with Supabase
      </footer>
    </div>
  )
}
