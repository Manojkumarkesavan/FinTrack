'use client'

import { useMemo } from 'react'
import type { Asset, AssetCategory } from '@/types'
import { CATEGORY_COLORS, formatCompact } from '@/types'

interface PortfolioRiskProps {
  assets: Asset[]
}

export default function PortfolioRisk({ assets }: PortfolioRiskProps) {
  const diversification = useMemo(() => {
    const total = assets.reduce((sum, a) => sum + a.current_value, 0)
    if (total === 0) return []

    const byCategory = assets.reduce<Record<AssetCategory, number>>((acc, a) => {
      acc[a.category] = (acc[a.category] || 0) + a.current_value
      return acc
    }, {} as any)

    return Object.entries(byCategory)
      .map(([cat, val]) => ({
        category: cat as AssetCategory,
        value: val as number,
        percentage: ((val as number) / total) * 100,
      }))
      .sort((a, b) => b.value - a.value)
  }, [assets])

  const total = useMemo(() => assets.reduce((sum, a) => sum + a.current_value, 0), [assets])

  const diversificationScore = useMemo(() => {
    if (diversification.length === 0) return 'N/A'
    if (diversification.length === 1) return 'Very Low'
    if (diversification.length === 2) return 'Low'

    const maxAllocation = Math.max(...diversification.map(d => d.percentage))
    if (maxAllocation > 70) return 'Low'
    if (maxAllocation > 50) return 'Moderate'
    if (maxAllocation > 30) return 'Good'
    return 'Excellent'
  }, [diversification])

  const riskLevel = useMemo(() => {
    const equityPercentage = diversification.find(d => d.category === 'equity')?.percentage || 0
    if (equityPercentage > 70) return 'High'
    if (equityPercentage > 50) return 'Moderate-High'
    if (equityPercentage > 30) return 'Moderate'
    if (equityPercentage > 10) return 'Conservative'
    return 'Very Conservative'
  }, [diversification])

  if (total === 0) {
    return (
      <div className="card p-6">
        <h3 className="font-semibold text-[hsl(var(--foreground))] mb-4">Portfolio Diversification</h3>
        <div className="text-center py-8">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">No assets yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-[hsl(var(--foreground))] mb-4">Portfolio Diversification</h3>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="p-3 rounded bg-[hsl(var(--accent))]">
          <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Diversification</p>
          <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{diversificationScore}</p>
        </div>
        <div className="p-3 rounded bg-[hsl(var(--accent))]">
          <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Risk Level</p>
          <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{riskLevel}</p>
        </div>
      </div>

      {/* Allocation Bars */}
      <div className="space-y-3">
        {diversification.map(item => (
          <div key={item.category}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-[hsl(var(--foreground))]">
                <span
                  className="inline-block w-2 h-2 rounded-full mr-2"
                  style={{ background: CATEGORY_COLORS[item.category] }}
                />
                {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
              </span>
              <span className="text-xs font-semibold num text-[hsl(var(--muted-foreground))]">
                {item.percentage.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-[hsl(var(--accent))] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${item.percentage}%`,
                  background: CATEGORY_COLORS[item.category],
                }}
              />
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
              ₹{formatCompact(item.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Recommendation */}
      <div className="mt-5 pt-4 border-t border-[hsl(var(--border))]">
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          {diversificationScore === 'Excellent'
            ? '✓ Your portfolio is well-diversified across asset classes.'
            : diversificationScore === 'Good'
            ? '→ Consider adding more asset classes for better diversification.'
            : diversificationScore === 'Moderate'
            ? '⚠ Your portfolio is concentrated. Consider rebalancing.'
            : '⚠ Your portfolio is highly concentrated. Rebalancing recommended.'}
        </p>
      </div>
    </div>
  )
}
