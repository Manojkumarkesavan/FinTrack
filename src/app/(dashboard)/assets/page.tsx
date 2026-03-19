import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AssetsClient from './AssetsClient'

export default async function AssetsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: assets } = await supabase
    .from('assets')
    .select('*')
    .eq('user_id', user.id)
    .order('category')
    .order('current_value', { ascending: false })

  return <AssetsClient initialAssets={assets ?? []} />
}
