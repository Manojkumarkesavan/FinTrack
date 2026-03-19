import { NextResponse } from 'next/server'

// Proxy Yahoo Finance to avoid CORS issues from browser
// Usage: GET /api/prices?symbols=RELIANCE.NS,INFY.NS,AAPL
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbols = searchParams.get('symbols')?.split(',').map(s => s.trim()) ?? []

  if (!symbols.length) return NextResponse.json({ error: 'No symbols' }, { status: 400 })

  const results: Record<string, number | null> = {}

  await Promise.allSettled(
    symbols.map(async (symbol) => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          next: { revalidate: 900 }, // Cache 15 minutes
        })
        if (!res.ok) { results[symbol] = null; return }
        const data = await res.json()
        const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice
        results[symbol] = price ?? null
      } catch {
        results[symbol] = null
      }
    })
  )

  return NextResponse.json(results, {
    headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800' },
  })
}
