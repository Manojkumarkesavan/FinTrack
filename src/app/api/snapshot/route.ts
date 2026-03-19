import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Called by Vercel cron on last day of each month
// vercel.json: "0 23 28-31 * *"
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  // Get all users
  const { data: profiles } = await supabase.from('profiles').select('id')
  if (!profiles?.length) return NextResponse.json({ ok: true, processed: 0 })

  let processed = 0
  for (const { id } of profiles) {
    // Compute net worth for this user
    const { data: summary } = await supabase.rpc('get_networth_summary', { p_user_id: id })
    const s = summary?.[0]
    if (!s) continue

    await supabase.from('networth_snapshots').upsert({
      user_id: id,
      snapshot_date: today,
      total_assets: s.total_assets,
      total_liabilities: s.total_liabilities,
      net_worth: s.net_worth,
      breakdown: {
        equity: s.equity_value,
        debt: s.debt_value,
        real_estate: s.real_estate_value,
        others: s.others_value,
      },
    }, { onConflict: 'user_id,snapshot_date' })
    processed++
  }

  return NextResponse.json({ ok: true, processed, date: today })
}
