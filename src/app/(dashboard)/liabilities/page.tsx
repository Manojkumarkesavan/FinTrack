import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LiabilitiesClient from './LiabilitiesClient'

export default async function LiabilitiesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: liabilities } = await supabase
    .from('liabilities')
    .select('*')
    .eq('user_id', user.id)
    .order('outstanding_amount', { ascending: false })

  return <LiabilitiesClient initialLiabilities={liabilities ?? []} />
}
