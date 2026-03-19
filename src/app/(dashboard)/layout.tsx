import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[hsl(var(--background))] overflow-hidden">
      {/* Mobile Navigation - Hidden on Desktop */}
      <MobileNav profile={profile} user={user} />

      {/* Desktop Sidebar - Hidden on Mobile */}
      <Sidebar profile={profile} user={user} />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
