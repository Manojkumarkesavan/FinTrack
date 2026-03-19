import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GoalsClient from './GoalsClient'

export default async function GoalsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: goals } = await supabase
    .from('financial_goals')
    .select('*')
    .eq('user_id', user.id)
    .order('priority', { ascending: false })
    .order('target_date', { ascending: true })

  return <GoalsClient initialGoals={goals ?? []} userId={user.id} />
}
