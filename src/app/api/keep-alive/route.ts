import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createAdminClient()
    await supabase.from('profiles').select('id').limit(1)
    return NextResponse.json({ ok: true, ts: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
