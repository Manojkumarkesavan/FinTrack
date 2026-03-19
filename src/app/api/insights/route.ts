import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const INSIGHT_PROMPTS: Record<string, (data: any) => string> = {
  emergency_fund: (d) => `You are a personal finance advisor. A user has:
- Net worth: ₹${d.summary?.net_worth ?? 0}
- Total assets: ₹${d.summary?.total_assets ?? 0}
- Monthly income: ₹${d.profile?.monthly_income ?? 50000}

Their liquid assets (bank+cash) are roughly 10% of total assets.

Assess their emergency fund status. Give:
1. A 1-sentence verdict (max 15 words)
2. One concrete action they can take (max 25 words)

Respond ONLY as JSON: {"verdict": "...", "action": "..."}`,

  savings_rate: (d) => `You are a personal finance advisor. A user has:
- Monthly income: ₹${d.profile?.monthly_income ?? 50000}
- Total assets: ₹${d.summary?.total_assets ?? 0}
- Net worth: ₹${d.summary?.net_worth ?? 0}

Assess their savings rate and wealth building trajectory. Give:
1. A 1-sentence verdict (max 15 words)
2. One concrete action (max 25 words)

Respond ONLY as JSON: {"verdict": "...", "action": "..."}`,

  allocation: (d) => `You are a personal finance advisor. A user's asset allocation:
- Equity: ₹${d.summary?.equity_value ?? 0}
- Debt: ₹${d.summary?.debt_value ?? 0}
- Real Estate: ₹${d.summary?.real_estate_value ?? 0}
- Others: ₹${d.summary?.others_value ?? 0}
- Total: ₹${d.summary?.total_assets ?? 0}

Assess this allocation for a typical Indian investor. Give:
1. A 1-sentence verdict (max 15 words)
2. One rebalancing action (max 25 words)

Respond ONLY as JSON: {"verdict": "...", "action": "..."}`,

  debt: (d) => `You are a personal finance advisor. A user has:
- Total liabilities: ₹${d.summary?.total_liabilities ?? 0}
- Monthly income: ₹${d.profile?.monthly_income ?? 50000}
- Net worth: ₹${d.summary?.net_worth ?? 0}

Assess their debt situation. Give:
1. A 1-sentence verdict (max 15 words)
2. One debt optimisation action (max 25 words)

Respond ONLY as JSON: {"verdict": "...", "action": "..."}`,

  projection: (d) => `You are a personal finance advisor. A user has:
- Current net worth: ₹${d.summary?.net_worth ?? 0}
- Monthly income: ₹${d.profile?.monthly_income ?? 50000}
- Equity investments: ₹${d.summary?.equity_value ?? 0}

Project their wealth growth and key milestone. Give:
1. A 1-sentence projection verdict (max 15 words)
2. One action to accelerate growth (max 25 words)

Respond ONLY as JSON: {"verdict": "...", "action": "..."}`,
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { insight_type, summary, profile } = body

  if (!INSIGHT_PROMPTS[insight_type]) {
    return NextResponse.json({ error: 'Unknown insight type' }, { status: 400 })
  }

  // Check cache — skip if generated within 24h
  const { data: cached } = await supabase
    .from('insights_cache')
    .select('*')
    .eq('user_id', user.id)
    .eq('insight_type', insight_type)
    .single()

  const cacheAge = cached
    ? (Date.now() - new Date(cached.generated_at).getTime()) / 1000 / 60 / 60
    : Infinity

  if (cached && cacheAge < 24) {
    return NextResponse.json(cached)
  }

  // Call Claude Haiku
  const prompt = INSIGHT_PROMPTS[insight_type]({ summary, profile })

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Claude API error:', err)
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 500 })
  }

  const aiData = await res.json()
  const rawText = aiData.content?.[0]?.text ?? '{}'

  let content
  try {
    content = JSON.parse(rawText.replace(/```json|```/g, '').trim())
  } catch {
    content = { verdict: 'Analysis complete', action: rawText.slice(0, 100) }
  }

  // Upsert to cache
  const { data: saved, error } = await supabase
    .from('insights_cache')
    .upsert({ user_id: user.id, insight_type, content, generated_at: new Date().toISOString() }, { onConflict: 'user_id,insight_type' })
    .select()
    .single()

  if (error) console.error('Cache upsert error:', error)

  return NextResponse.json(saved ?? { user_id: user.id, insight_type, content, generated_at: new Date().toISOString() })
}
