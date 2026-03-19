export default function GoalsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
        <span className="text-2xl">🎯</span>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight mb-2">Goals — Coming Soon</h1>
      <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-sm">
        Track retirement corpus, home down-payment, child's education fund, and more. With SIP projections and progress tracking.
      </p>
    </div>
  )
}
