'use client'
import Link from 'next/link'
import { formatCurrency, type Transaction } from '@/types'
import { format, parseISO } from 'date-fns'
import { ArrowUpRight } from 'lucide-react'

export default function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Recent Transactions</h3>
        <Link href="/transactions" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors">
          View all <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-[hsl(var(--muted-foreground))]">
          <p className="text-sm">No transactions yet</p>
          <Link href="/transactions" className="text-xs text-emerald-400 mt-2 hover:underline">
            Add your first transaction
          </Link>
        </div>
      ) : (
        <div className="flex-1 space-y-1">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors group">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold
                  ${tx.type === 'income' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                  {tx.category.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-[hsl(var(--foreground))] truncate">{tx.description || tx.category}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {tx.category} · {format(parseISO(tx.date), 'dd MMM')}
                  </p>
                </div>
              </div>
              <span className={`text-sm font-semibold num flex-shrink-0 ml-3 ${tx.type === 'income' ? 'text-gain' : 'text-loss'}`}>
                {tx.type === 'income' ? '+' : '-'}₹{formatCurrency(tx.amount, 'INR').replace('₹', '').replace(/[₹,]/g, '')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
