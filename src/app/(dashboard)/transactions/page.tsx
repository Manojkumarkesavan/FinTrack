import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TransactionsClient from './TransactionsClient'

export default async function TransactionsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(200)

  return <TransactionsClient initialTransactions={transactions ?? []} />
}
