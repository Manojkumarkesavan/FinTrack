import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'FinTrack — Your Financial Command Centre',
  description: 'Track assets, liabilities, investments and build wealth — all in one place.',
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'FinTrack',
    description: 'Personal finance tracker for serious investors',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head />
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'hsl(220 13% 10%)',
                border: '1px solid hsl(220 13% 16%)',
                color: 'hsl(210 20% 92%)',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
