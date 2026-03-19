import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InvestmentsClient from './InvestmentsClient'

export default async function InvestmentsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: investments } = await supabase
    .from('investments')
    .select('*')
    .eq('user_id', user.id)
    .order('current_value', { ascending: false })

  return <InvestmentsClient initialInvestments={investments ?? []} />
}
