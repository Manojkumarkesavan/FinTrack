import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InsightsClient from './InsightsClient'

export default async function InsightsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const [{ data: insights }, { data: profile }, { data: summaryRows }] = await Promise.all([
    supabase.from('insights_cache').select('*').eq('user_id', user.id),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.rpc('get_networth_summary', { p_user_id: user.id }),
  ])

  return <InsightsClient initialInsights={insights ?? []} profile={profile} summary={summaryRows?.[0] ?? null} />
}
